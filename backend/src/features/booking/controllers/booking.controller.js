const admin = require("../../../config/firebase.config.js");
const { getMessaging } = require("firebase-admin/messaging");
const db = admin.firestore();
const client = require("../../../database/connection");
const bookingQueries = require("../../../database/queries/booking.queries.js");

// Helper function - getWorkerLocation
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
    // console.log(locations);
    return locations;
  } catch (error) {
    console.error("Error getting location:", error);
    return [];
  }
};

// Helper function - getAllLocations
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
    // console.log(locations)
    return locations;
  } catch (error) {
    console.error("Error getting locations:", error);
    return [];
  }
};

// Helper function - createUserBackgroundAction
const createUserBackgroundAction = async (
  userId,
  encodedId,
  screen,
  serviceBooked,
  userNotificationEncodedId = null
) => {
  // console.log('Service Booked:', screen,encodedId,serviceBooked);

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
    const upsertQuery = bookingQueries.upsertUserActionQuery;

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

// Helper function - updateWorkerAction
const updateWorkerAction = async (workerId, encodedId, screen) => {
  try {
    console.log("updateWorkerAction called with:", {
      workerId,
      encodedId,
      screen,
    });

    const params = JSON.stringify({ encodedId });
    console.log("Constructed params:", params);

    const query = bookingQueries.upsertWorkerActionQuery;

    console.log("Executing SQL query:", query);
    const result = await client.query(query, [workerId, screen, params]);
    console.log("Query executed successfully. Result:", result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error("Error inserting user action:", error);
  }
};

// Helper for interval tracking
const intervalSetForNotifications = new Set();

// Helper function - updateNavigationStatus
const updateNavigationStatus = async (notification_id) => {
  try {
    const result = await client.query(
      bookingQueries.updateNavigationStatusQuery,
      [notification_id]
    );
  } catch (error) {
    console.error("Error updating navigation status to timeup:", error);
    throw error; // Throw the error to handle it in calling functions
  }
};

// Booking Controller Functions

const getServiceBookingItemDetails = async (req, res) => {
  try {
    const { tracking_id } = req.body;
    console.log(tracking_id);
    // console.log(tracking_id)
    const query = bookingQueries.getServiceBookingItemDetailsQuery;

    const values = [tracking_id];

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "No service tracking details found for the given accepted ID",
      });
    }

    // const { service_booked } = result.rows[0];

    // if (!service_booked || !Array.isArray(service_booked)) {
    //   return res
    //     .status(400)
    //     .json({ message: "Invalid service_booked data format" });
    // }

    // const gstRate = 0.05;
    // const discountRate = 0.05;

    // const fetchedTotalAmount = service_booked.reduce(
    //   (total, service) => total + (service.cost || 0),
    //   0
    // );

    // const gstAmount = fetchedTotalAmount * gstRate;
    // const cgstAmount = fetchedTotalAmount * gstRate;
    // const discountAmount = fetchedTotalAmount * discountRate;
    // const fetchedFinalTotalAmount =
    //   fetchedTotalAmount + gstAmount + cgstAmount - discountAmount;

    // const paymentDetails = {
    //   gstAmount,
    //   cgstAmount,
    //   discountAmount,
    //   fetchedFinalTotalAmount,
    // };

    res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    console.error(
      "Error fetching service tracking worker item details: ",
      error
    );
    res.status(500).json({
      message: "Failed to fetch service tracking worker item details",
      error: error.message,
    });
  }
};

const getServiceBookingUserItemDetails = async (req, res) => {
  try {
    const { tracking_id } = req.body;
    console.log(tracking_id);
    // console.log(tracking_id)
    const query = bookingQueries.getServiceBookingUserItemDetailsQuery;

    const values = [tracking_id];

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "No service tracking details found for the given accepted ID",
      });
    }

    res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    console.error(
      "Error fetching service tracking worker item details: ",
      error
    );
    res.status(500).json({
      message: "Failed to fetch service tracking worker item details",
      error: error.message,
    });
  }
};

const getServiceOngoingItemDetails = async (req, res) => {
  try {
    const { tracking_id } = req.body;
    // console.log(tracking_id)
    const query = bookingQueries.getServiceOngoingItemDetailsQuery;

    const values = [tracking_id];

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(305).json({
        message: "No service tracking details found for the given accepted ID",
      });
    }

    res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    console.error(
      "Error fetching service tracking worker item details: ",
      error
    );
    res.status(500).json({
      message: "Failed to fetch service tracking worker item details",
      error: error.message,
    });
  }
};

const getServiceOngoingWorkerItemDetails = async (req, res) => {
  try {
    const { tracking_id } = req.body;
    console.log(tracking_id);

    const query = bookingQueries.getServiceOngoingWorkerItemDetailsQuery;

    const values = [tracking_id];

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(305).json({
        message: "No service tracking details found for the given accepted ID",
      });
    }

    res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    console.error(
      "Error fetching service tracking worker item details: ",
      error
    );
    res.status(500).json({
      message: "Failed to fetch service tracking worker item details",
      error: error.message,
    });
  }
};

const getUserAndWorkerLocation = async (req, res) => {
  const { notification_id } = req.body;

  try {
    // Step 1: Get user longitude, latitude, and worker_id from accepted table using notification_id
    const query = bookingQueries.getUserAndWorkerLocationQuery;
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

// Function to fetch location details from the database
const fetchLocationDetails = async (notificationId) => {
  console.log(notificationId);
  try {
    // Query to get the start and endpoint details using a JOIN between accepted and workerlocation tables
    const query = bookingQueries.getWorkerLocationFromAcceptedQuery;

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

    // console.log("worker", location);

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

// Check cancellation status
const checkCancellationStatus = async (req, res) => {
  try {
    const { notification_id } = req.query;
    const result = await client.query(
      bookingQueries.getNavigationStatusQuery,
      [notification_id]
    );
    if (result.rows.length > 0) {
      const { navigation_status } = result.rows[0];
      res.json({ navigation_status });
    } else {
      res.status(404).json({ error: "Notification not found" });
    }
  } catch (error) {
    console.error("Error checking cancellation status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateUserNavigationStatus = async (notification_id) => {
  try {
    await client.query(
      bookingQueries.updateUserNavigationStatusQuery,
      [notification_id]
    );
  } catch (error) {
    console.error("Error updating user navigation status to timeup:", error);
  }
};

const rejectRequest = async (req, res) => {
  const { user_notification_id } = req.body;
  const worker_id = req.worker.id;

  try {
    const result = await client.query(
      bookingQueries.rejectRequestQuery,
      ["reject", user_notification_id, worker_id]
    );

    if (result.rowCount === 0) {
      res
        .status(404)
        .json({ message: "Notification not found or worker mismatch" });
    } else {
      res.status(200).json({
        message: "Status updated to reject",
        notification: result.rows[0],
      });
    }
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const acceptRequest = async (req, res) => {
  const { user_notification_id } = req.body;
  const worker_id = req.worker.id;

  try {
    // Start a transaction
    await client.query("BEGIN");

    // Combined CTE to perform multiple operations

    const combinedQuery = bookingQueries.acceptRequestCombinedQuery;

    const combinedResult = await client.query(combinedQuery, [
      user_notification_id,
      worker_id,
    ]);

    // Extract the first row (since the query should return only one row)
    const row = combinedResult.rows[0];

    // **Check if someone already accepted the request**
    if (row.existing_notification_id) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "Someone already accepted the request." });
    }

    // **Check if notification exists**
    if (!row.cancel_status && !row.user_id && !row.notification_id) {
      // If 'get_notification' didn't find any row, these fields would be undefined
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Notification not found." });
    }
    if (row.cancel_status === "cancel") {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "Cannot accept request; it has been canceled." });
    }

    const insertedNotificationId = row.inserted_notification_id;
    const fcmResult = await client.query(
      bookingQueries.getUserFcmTokensQuery,
      [row.user_id]
    );

    const fcmTokens = fcmResult.rows
      .map((r) => r.fcm_token)
      .filter((token) => token);
    await client.query("COMMIT");
    if (fcmTokens.length > 0) {
      const multicastMessage = {
        tokens: fcmTokens,
        notification: {
          title: "Click Solver",
          body: `Commander has accepted your request; he will be there within 5 minutes.`,
        },
        data: {
          notification_id: insertedNotificationId.toString(),
          screen: "UserNavigation",
        },
      };
      const response = await getMessaging().sendEachForMulticast(
        multicastMessage
      );
      response.responses.forEach((resp, index) => {
        if (resp.success) {
        } else {
          console.error(
            `Error sending message to token ${fcmTokens[index]}:`,
            resp.error
          );
        }
      });
    } else {
      console.error("No FCM tokens to send the message to.");
    }
    const userNotificationEncodedId = Buffer.from(
      user_notification_id.toString()
    ).toString("base64");
    const encodedId = Buffer.from(insertedNotificationId.toString()).toString(
      "base64"
    );
    const screen = "UserNavigation";
    let parsedServiceBooked;
    if (typeof row.service_booked === "string") {
      try {
        parsedServiceBooked = JSON.parse(row.service_booked);
      } catch (parseError) {
        console.error("Error parsing service_booked JSON:", parseError);
        parsedServiceBooked = row.service_booked;
      }
    } else {
      parsedServiceBooked = row.service_booked;
    }
    const backgroundActionResult = await createUserBackgroundAction(
      row.user_id,
      encodedId,
      screen,
      parsedServiceBooked,
      userNotificationEncodedId
    );
    await updateWorkerAction(worker_id, encodedId, screen);
    res.status(200).json({
      message: "Status updated to accept",
      notificationId: insertedNotificationId,
      backgroundAction: backgroundActionResult,
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Error during ROLLBACK:", rollbackError);
    }
    console.error("Error updating status:", error.message);
    console.error("Error Stack:", error.stack);
    res.status(500).json({ message: "Internal server error" });
  }
};

const checkTaskStatus = async (req, res) => {
  const { notification_id } = req.body;

  try {
    // Directly check the result in the if condition to reduce extra variables
    const result = await client.query(
      bookingQueries.getServiceCallEndTimeQuery,
      [notification_id]
    );

    if (result.rows.length === 0) {
      // Return early if no notification is found
      return res.status(205).json({ message: "Notification not found" });
    }

    const end_time = result.rows[0].end_time;

    if (end_time) {
      // Return status if end_time is found
      return res.status(200).json({ status: end_time });
    }

    // If end_time is null, return a notification not found response
    return res.status(205).json({ message: "Notification not found" });
  } catch (error) {
    console.error("Error checking status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const checkStatus = async (req, res) => {
  const { user_notification_id } = req.query;

  try {
    const result = await client.query(
      bookingQueries.checkNotificationExistsQuery,
      [user_notification_id]
    );

    if (result.rows.length > 0) {
      // user_notification_id exists in the notifications table
      res.sendStatus(200);
    } else {
      // user_notification_id does not exist in the notifications table
      res.sendStatus(201);
    }
  } catch (error) {
    console.error("Error checking notification:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const cancelRequest = async (req, res) => {
  const { user_notification_id } = req.body;

  if (!user_notification_id) {
    return res.status(400).json({ error: "user_notification_id is required" });
  }

  try {
    // Combined query to check both 'accept' status and 'cancel_status'
    const query = bookingQueries.checkAcceptStatusQuery;

    const result = await client.query(query, [user_notification_id]);

    const acceptCount = parseInt(result.rows[0].accept_count, 10);
    const currentStatus = result.rows[0].cancel_status;

    // Check if there is an 'accept' status
    if (acceptCount > 0) {
      return res
        .status(400)
        .json({ error: "Cannot cancel as status is already accepted" });
    }

    // Only update if the current cancel_status is not 'timeup'
    if (currentStatus !== "timeup") {
      await client.query(
        bookingQueries.updateCancelStatusQuery,
        ["cancel", user_notification_id]
      );
      return res
        .status(200)
        .json({ message: "Cancel status updated to cancel" });
    } else {
      return res
        .status(400)
        .json({ error: "Cannot update status as it is already timeup" });
    }
  } catch (error) {
    console.error("Error updating cancel status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getServiceBookingItemDetails,
  getServiceBookingUserItemDetails,
  getServiceOngoingItemDetails,
  getServiceOngoingWorkerItemDetails,
  getUserAndWorkerLocation,
  getLocationDetails,
  fetchLocationDetails,
  checkCancellationStatus,
  updateUserNavigationStatus,
  rejectRequest,
  acceptRequest,
  checkTaskStatus,
  checkStatus,
  cancelRequest,
  getAllLocations,
};
