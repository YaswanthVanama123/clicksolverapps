const admin = require("../../../firebaseAdmin.js");
const db = admin.firestore();
const client = require("../../../connection.js");
const axios = require("axios");
const { getMessaging } = require("firebase-admin/messaging");

// Helper function to update worker action
const updateWorkerAction = async (workerId, encodedId, screen) => {
  try {
    console.log("updateWorkerAction called with:", {
      workerId,
      encodedId,
      screen,
    });

    const params = JSON.stringify({ encodedId });
    console.log("Constructed params:", params);

    const query = `
      INSERT INTO workeraction (worker_id, screen_name, params)
      VALUES ($1, $2, $3)
      ON CONFLICT (worker_id) DO UPDATE
        SET
          screen_name = CASE
            WHEN $2 <> '' THEN $2
            WHEN $2 = ''
              AND workeraction.params::jsonb->>'encodedId' = ($3::jsonb->>'encodedId')
              THEN ''::text
            ELSE workeraction.screen_name
          END,
          params = CASE
            WHEN $2 <> '' THEN $3
            ELSE workeraction.params
          END
      RETURNING *;
    `;

    console.log("Executing SQL query:", query);
    const result = await client.query(query, [workerId, screen, params]);
    console.log("Query executed successfully. Result:", result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error("Error inserting user action:", error);
  }
};

// Helper function to create user background action
const createUserBackgroundAction = async (
  userId,
  encodedId,
  screen,
  serviceBooked,
  userNotificationEncodedId = null
) => {
  try {
    // Prepare the new action object if 'screen' is provided
    const newAction = screen
      ? {
          screen,
          encodedId,
          serviceBooked,
        }
      : null;

    // Convert newAction to JSON string if it exists
    const newActionJson = newAction ? JSON.stringify(newAction) : null;

    // Prepare the initial track array for insertion
    const initialTrack = newAction
      ? JSON.stringify([newAction])
      : JSON.stringify([]);

    // Define the UPSERT query with explicit casting for $4 and $5
    const upsertQuery = `
      INSERT INTO useraction (user_id, track)
      VALUES ($1, $2::jsonb)
      ON CONFLICT (user_id) DO UPDATE
      SET track = (
        SELECT
          COALESCE(jsonb_agg(item), '[]'::jsonb)
        FROM
          jsonb_array_elements(useraction.track) AS item
        WHERE
          item->>'encodedId' <> $3
          AND ($4::text IS NULL OR item->>'encodedId' <> $4::text)
      ) || (
        CASE
          WHEN $5::jsonb IS NOT NULL THEN $6::jsonb
          ELSE '[]'::jsonb
        END
      )
      RETURNING *;
    `;

    // Parameters for the query
    const params = [
      userId, // $1: user_id
      initialTrack, // $2: initial track array (JSONB)
      encodedId, // $3: encodedId to remove
      userNotificationEncodedId, // $4: userNotificationEncodedId to remove (can be null)
      newActionJson, // $5: new action JSON (if screen is provided)
      newActionJson ? `[${newActionJson}]` : "[]", // $6: new action as JSONB array or empty array
    ];

    // Execute the UPSERT query
    const result = await client.query(upsertQuery, params);

    // The result will contain the inserted or updated row
    const updatedTrackScreen = result.rows[0];

    // Return the updated user action data
    return updatedTrackScreen;
  } catch (error) {
    console.error("Error inserting or updating user background action:", error);
    throw error; // Re-throw the error after logging
  }
};

// Helper function to update navigation status
const updateNavigationStatus = async (notification_id) => {
  try {
    const result = await client.query(
      "UPDATE accepted SET navigation_status = 'timeup' WHERE notification_id = $1",
      [notification_id]
    );
  } catch (error) {
    console.error("Error updating navigation status to timeup:", error);
    throw error; // Throw the error to handle it in calling functions
  }
};

// Helper function to get worker location from Firestore
const getWorkerLocation = async (workerId) => {
  try {
    if (!workerId) {
      return [];
    }

    const locationsRef = db.collection("locations");
    const query = locationsRef.where("worker_id", "==", workerId);

    const snapshot = await query.get();

    if (snapshot.empty) {
      return [];
    }

    let locations = [];
    snapshot.forEach((doc) => {
      locations.push({ id: doc.id, ...doc.data() });
    });
    return locations;
  } catch (error) {
    console.error("Error getting location:", error);
    return [];
  }
};

// Set to track notifications that have intervals set
const intervalSetForNotifications = new Set();

/**
 * Get route between two points using Ola Maps API
 */
const getRoute = async (req, res) => {
  try {
    // Expect payload:
    // { startPoint: [lng, lat], endPoint: [lng, lat] }
    const { startPoint, endPoint } = req.body;
    console.log("Request body:", req.body);

    if (
      !startPoint ||
      !endPoint ||
      !Array.isArray(startPoint) ||
      !Array.isArray(endPoint) ||
      startPoint.length !== 2 ||
      endPoint.length !== 2
    ) {
      return res.status(400).json({
        error:
          "Missing or invalid parameters: startPoint and endPoint are required as arrays [lng, lat].",
      });
    }

    // Destructure values from the arrays.
    const [startLng, startLat] = startPoint;
    const [endLng, endLat] = endPoint;

    // Ola Maps API key
    const apiKey =
      process.env.OLA_API_KEY || "q0k6sOfYNxdt3bGvqF6W1yvANHeVtrsu9T5KW9a4";
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "API key not configured on server" });
    }

    // Format URL for Ola Maps Directions API.
    // Note that the API expects origin/destination as lat,lng pairs.
    const url = `https://api.olamaps.io/routing/v1/directions?origin=${startLat},${startLng}&destination=${endLat},${endLng}&api_key=${apiKey}`;

    // Use POST method and include required headers:
    const response = await axios.post(url, null, {
      headers: {
        "X-Request-Id": `req-${Date.now()}`,
        Origin: "https://clicksolver.com", // Replace with your actual domain
      },
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error(
      "Error fetching route:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: error.toString() });
  }
};

/**
 * Insert tracking information for a service
 */
const insertTracking = async (req, res) => {
  try {
    const { notification_id, details } = req.body;

    // Generate a 4-digit random number for tracking_pin
    const trackingPin = Math.floor(1000 + Math.random() * 9000);

    // Generate a tracking_key: #cs followed by 13 random digits
    const trackingKey = `#cs${Math.floor(
      1000000000000 + Math.random() * 9000000000000
    )}`;

    // Set service_status as "Commander collected the service item"
    const serviceStatus = "Collected Item";

    const query = `
      WITH selected AS (
        SELECT
          a.accepted_id,
          a.notification_id,
          a.user_notification_id,
          a.longitude,
          a.latitude,
          a.worker_id,
          a.service_booked,
          a.user_id,
          a.total_cost,
          a.discount,
          a.tip_amount,
          u.fcm_token
        FROM accepted a
        JOIN userfcm u ON a.user_id = u.user_id
        WHERE a.notification_id = $1
      )
      INSERT INTO servicetracking (
        accepted_id,
        notification_id,
        user_notification_id,
        longitude,
        latitude,
        worker_id,
        service_booked,
        user_id,
        total_cost,
        discount,
        tip_amount,
        created_at,
        tracking_pin,
        tracking_key,
        service_status,
        data
      )
      SELECT
        selected.accepted_id,
        selected.notification_id,
        selected.user_notification_id,
        selected.longitude,
        selected.latitude,
        selected.worker_id,
        selected.service_booked,
        selected.user_id,
        selected.total_cost,
        selected.discount,
        selected.tip_amount,
        NOW(),
        $2,
        $3,
        $4,
        $5::jsonb
      FROM selected
      ON CONFLICT (accepted_id) DO NOTHING
      RETURNING
        accepted_id,
        notification_id,
        user_notification_id,
        longitude,
        latitude,
        worker_id,
        service_booked,
        user_id,
        total_cost,
        discount,
        tip_amount,
        created_at,
        tracking_pin,
        tracking_key,
        service_status,
        data,
        (SELECT ARRAY_AGG(fcm_token) FROM selected) AS fcm_tokens;
    `;

    const values = [
      notification_id,
      trackingPin,
      trackingKey,
      serviceStatus,
      details, // This should be a valid JSON string/object
    ];

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Tracking for this notification_id already exists.",
      });
    }

    const { user_id, service_booked, worker_id } = result.rows[0];
    const screen = "";
    const encodedId = Buffer.from(notification_id.toString()).toString(
      "base64"
    );

    await createUserBackgroundAction(
      user_id,
      encodedId,
      screen,
      service_booked
    );
    await updateWorkerAction(worker_id, encodedId, screen);

    const fcmTokens = result.rows
      .map((row) => row.fcm_tokens)
      .flat()
      .filter((token) => token);

    if (fcmTokens.length > 0) {
      const multicastMessage = {
        tokens: fcmTokens,
        notification: {
          title: "Click Solver",
          body: `Commander collected your Item to repair in his location.`,
        },
        data: {
          screen: "Home",
        },
      };

      try {
        const response = await getMessaging().sendEachForMulticast(
          multicastMessage
        );
        response.responses.forEach((res, index) => {
          if (!res.success) {
            console.error(
              `Error sending message to token ${fcmTokens[index]}:`,
              res.error
            );
          }
        });
      } catch (error) {
        console.error("Error sending notifications:", error);
      }
    } else {
      console.error("No FCM tokens to send the message to.");
    }

    res.status(201).json({
      message: "Tracking inserted successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error inserting tracking: ", error);
    res
      .status(500)
      .json({ message: "Failed to insert tracking", error: error.message });
  }
};

/**
 * Get worker tracking services
 */
const getWorkerTrackingServices = async (req, res) => {
  try {
    const workerId = req.worker.id;

    // SQL query to fetch service_status, created_at, tracking_id from servicetracking
    // and join with workerskills table to get service
    const query = `
      SELECT
        st.service_status,
        st.created_at,
        st.tracking_id,
        st.tracking_key,
        ws.service
      FROM servicetracking st
      JOIN workerskills ws ON st.worker_id = ws.worker_id
      WHERE st.worker_id = $1;
    `;

    const values = [workerId];

    // Execute the query
    const result = await client.query(query, values);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching worker tracking services: ", error);
    res.status(500).json({
      message: "Failed to fetch worker tracking services",
      error: error.message,
    });
  }
};

/**
 * Get all tracking services
 */
const getAllTrackingServices = async (req, res) => {
  try {
    console.log("Hi");
    // SQL query to fetch service_status, created_at, tracking_id from servicetracking
    // and join with workerskills table to get service
    const query = `
    SELECT
      st.service_status,
      st.created_at,
      st.tracking_id,
      ws.service
    FROM servicetracking st
    LEFT JOIN workerskills ws ON st.worker_id = ws.worker_id
  `;

    // Execute the query
    const result = await client.query(query);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching worker tracking services: ", error);
    res.status(500).json({
      message: "Failed to fetch worker tracking services",
      error: error.message,
    });
  }
};

/**
 * Get user tracking services
 */
const getUserTrackingServices = async (req, res) => {
  try {
    const userId = req.user.id;

    // SQL query to fetch service_status, created_at, tracking_id from servicetracking
    // and join with workerskills table to get service
    const query = `
      SELECT
        st.service_status,
        st.created_at,
        st.tracking_id,
        st.tracking_key,
        ws.service
      FROM servicetracking st
      JOIN workerskills ws ON st.worker_id = ws.worker_id
      WHERE st.user_id = $1;
    `;

    const values = [userId];

    // Execute the query
    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(205).json({
        message: "No tracking services found for the given notification ID",
      });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching worker tracking services: ", error);
    res.status(500).json({
      message: "Failed to fetch worker tracking services",
      error: error.message,
    });
  }
};

/**
 * Get all locations for given worker IDs from Firestore
 */
const getAllLocations = async (workerIds) => {
  try {
    if (workerIds.length < 1) {
      return [];
    }
    const locationsRef = db.collection("locations");

    // Create a query to filter documents where workerId is in the workerIds array
    const query = locationsRef.where("worker_id", "in", workerIds);

    const snapshot = await query.get();

    if (snapshot.empty) {
      return [];
    }

    let locations = [];
    snapshot.forEach((doc) => {
      locations.push({ id: doc.id, ...doc.data() });
    });
    return locations;
  } catch (error) {
    console.error("Error getting locations:", error);
    return [];
  }
};

/**
 * Get user and worker location for navigation
 */
const getUserAndWorkerLocation = async (req, res) => {
  const { notification_id } = req.body;

  try {
    // Step 1: Get user longitude, latitude, and worker_id from accepted table using notification_id
    const query = `
      SELECT longitude, latitude, worker_id
      FROM accepted
      WHERE notification_id = $1
    `;
    const result = await client.query(query, [notification_id]);

    // Check if the notification exists in the table
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const {
      longitude: userLongitude,
      latitude: userLatitude,
      worker_id,
    } = result.rows[0];

    // Step 2: Query Firestore for the worker's location by worker_id
    const workerLocationSnapshot = await db
      .collection("locations")
      .where("worker_id", "==", worker_id)
      .limit(1)
      .get();

    // Check if the worker's location was found
    if (workerLocationSnapshot.empty) {
      return res
        .status(404)
        .json({ message: "Worker location not found in Firestore" });
    }

    // Assuming only one document is returned (matching worker_id)
    const workerLocationData = workerLocationSnapshot.docs[0].data();

    // Extract the GeoPoint object from the worker's location data
    const workerLocationGeoPoint = workerLocationData.location;
    if (
      !workerLocationGeoPoint ||
      !workerLocationGeoPoint.latitude ||
      !workerLocationGeoPoint.longitude
    ) {
      return res
        .status(500)
        .json({ message: "Worker GeoPoint data is missing or incomplete" });
    }

    const workerLongitude = workerLocationGeoPoint.longitude;
    const workerLatitude = workerLocationGeoPoint.latitude;

    // Step 3: Return both user and worker locations as arrays
    return res.status(200).json({
      endPoint: [Number(userLongitude), Number(userLatitude)], // User's location
      startPoint: [workerLongitude, workerLatitude], // Worker's location
    });
  } catch (error) {
    console.error("Error fetching locations:", error.message);
    return res
      .status(500)
      .json({ message: "Error fetching locations", error: error.message });
  }
};

/**
 * Get location details for navigation
 */
const getLocationDetails = async (req, res) => {
  try {
    const { notification_id } = req.query;

    if (!notification_id) {
      return res.status(400).json({ error: "Missing notification_id" });
    }

    const locationDetails = await fetchLocationDetails(notification_id);
    res.json(locationDetails);

    // Start the interval to update the navigation status to timeup after 4 minutes
    if (notification_id && !intervalSetForNotifications.has(notification_id)) {
      intervalSetForNotifications.add(notification_id);
      setTimeout(() => updateNavigationStatus(notification_id), 4 * 60 * 1000);
    }
  } catch (err) {
    console.error("Error fetching location details:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Fetch location details from the database
 */
const fetchLocationDetails = async (notificationId) => {
  console.log(notificationId);
  try {
    // Query to get the start and endpoint details using a JOIN between accepted and workerlocation tables
    const query = `
      SELECT
        a.worker_id,
        a.longitude AS end_longitude,
        a.latitude AS end_latitude
      FROM accepted a
      WHERE a.notification_id = $1;
    `;

    const result = await client.query(query, [notificationId]);

    if (result.rows.length === 0) {
      throw new Error("Notification or Worker location not found");
    }

    const { end_longitude, end_latitude, worker_id } = result.rows[0];

    const location = await getWorkerLocation(worker_id);
    let start_latitude = null;
    let start_longitude = null;
    location.forEach((locationData) => {
      const {
        location: { _latitude: latitude, _longitude: longitude },
      } = locationData;
      start_longitude = longitude;
      start_latitude = latitude;
    });

    // Return the start and end points
    return {
      startPoint: [start_latitude, start_longitude],
      endPoint: [end_latitude, end_longitude],
    };
  } catch (err) {
    console.error("Error fetching location details:", err);
    throw err;
  }
};

module.exports = {
  getRoute,
  insertTracking,
  getWorkerTrackingServices,
  getAllTrackingServices,
  getUserTrackingServices,
  getAllLocations,
  getUserAndWorkerLocation,
  getLocationDetails,
  fetchLocationDetails,
};
