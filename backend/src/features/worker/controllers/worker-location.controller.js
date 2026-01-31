const admin = require("../../../config/firebase.config.js");
const { getMessaging } = require("firebase-admin/messaging");
const db = admin.firestore();
const client = require("../../../../connection.js");
const { v4: uuidv4 } = require("uuid");
const workerQueries = require("../../../database/queries/worker.queries");

// Location and Navigation Functions

const storeWorkerLocation = async (req, res) => {
  const { longitude, latitude, workerId } = req.body;

  try {
    await client.query(workerQueries.storeWorkerLocation, [
      longitude,
      latitude,
      workerId,
    ]);

    res.status(200).json({ message: "User location stored successfully" });
  } catch (error) {
    console.error("Error storing user location:", error);
    res.status(500).json({ error: "Failed to store user location" });
  }
};

const updateWorkerLocation = async (req, res) => {
  const workerId = req.worker.id;
  const { longitude, latitude } = req.body;

  try {
    await client.query(workerQueries.storeWorkerLocation, [
      longitude,
      latitude,
      workerId,
    ]);

    res.status(200).json({ message: "User location stored successfully" });
  } catch (error) {
    console.error("Error storing user location:", error);
    res.status(500).json({ error: "Failed to store user location" });
  }
};

const getWorkerNavigationDetails = async (req, res) => {
  const { notificationId } = req.body;

  if (!notificationId) {
    return res.status(400).json({ error: "Notification ID is required" });
  }

  try {
    // Query to fetch worker_id, pin from notifications and name, phone_number from workersverified using JOIN
    const result = await client.query(workerQueries.getWorkerNavigationDetails, [
      notificationId,
    ]);

    // If no results, return 404
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Notification or worker not found" });
    }

    const {
      pin,
      name,
      phone_number,
      profile,
      pincode,
      area,
      city,
      service_booked,
      average_rating,
      service_counts,
    } = result.rows[0];

    // Send the response
    return res.status(200).json({
      pin,
      name,
      phone_number,
      profile,
      pincode,
      area,
      city,
      service_booked,
      average_rating,
      service_counts,
    });
  } catch (error) {
    console.error("Error getting worker navigation details:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const workerCancelNavigation = async (req, res) => {
  const { notification_id } = req.body;

  if (!notification_id) {
    return res.status(400).json({ error: "Notification ID is required" });
  }

  try {
    // Combine status check and update in one query
    const result = await client.query(workerQueries.updateNavigationToCanceled, [
      notification_id,
    ]);

    // If no rows were returned, the notification either doesn't exist or the status is 'timeup'
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Cancellation time is up or Notification not found" });
    }

    const updatedStatus = result.rows[0].navigation_status;

    // If the updated status is 'timeup', cancellation is not allowed
    if (updatedStatus === "timeup") {
      return res.status(404).json({ error: "Cancellation time is up" });
    }

    return res.status(200).json({ message: "Cancellation successful" });
  } catch (error) {
    console.error("Error updating cancellation status:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

const workerCancellationStatus = async (req, res) => {
  const { notification_id } = req.query;

  if (!notification_id) {
    return res.status(400).json({ error: "notification_id is required" });
  }

  try {
    const result = await client.query(workerQueries.getNavigationStatus, [
      notification_id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    const notificationStatus = result.rows[0].navigation_status;
    res.json(notificationStatus);
  } catch (error) {
    console.error("Error fetching cancellation status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Helper functions for user actions
const createUserBackgroundAction = async (
  user_id,
  encodedUserNotificationId,
  screen,
  service_booked
) => {
  try {
    await client.query(workerQueries.updateUserBackgroundAction, [
      user_id,
      encodedUserNotificationId,
    ]);
  } catch (error) {
    console.error("Error updating user background action:", error);
  }
};

const updateWorkerAction = async (worker_id, encodedUserNotificationId, screen) => {
  try {
    await client.query(workerQueries.updateWorkerActionScreen, [worker_id, screen]);
  } catch (error) {
    console.error("Error updating worker action:", error);
  }
};

const workerNavigationCancel = async (req, res) => {
  const { notification_id, offer_code } = req.body;
  const encodedUserNotificationId = Buffer.from(
    notification_id.toString()
  ).toString("base64");

  try {
    await client.query("BEGIN");
    console.log("Transaction started for notification_id:", notification_id);

    const combinedQuery = await client.query(
      workerQueries.completeWorkerNavigationCancel,
      [notification_id, offer_code]
    );

    // Nothing to cancel?
    if (combinedQuery.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(205).json({
        message:
          "Cancellation not performed. Either invalid ID or already canceled.",
      });
    }

    // Now delete the original accepted record
    await client.query(workerQueries.deleteAcceptedRecord, [notification_id]);

    await client.query("COMMIT");
    console.log(
      "Transaction committed successfully for notification_id:",
      notification_id
    );

    const { user_id, service_booked, worker_id } = combinedQuery.rows[0];
    const fcmTokens = combinedQuery.rows
      .map((r) => r.fcm_token)
      .filter(Boolean);

    // Send FCM notifications if any
    if (fcmTokens.length > 0) {
      try {
        const multicastMessage = {
          tokens: fcmTokens,
          notification: {
            title: "Click Solver",
            body: "Sorry for this, User cancelled the Service.",
          },
          data: { screen: "Home" },
        };
        await getMessaging().sendEachForMulticast(multicastMessage);
      } catch (error) {
        console.error("Error sending notifications:", error);
      }
    }

    // Fire off background actions
    await createUserBackgroundAction(
      user_id,
      encodedUserNotificationId,
      "",
      service_booked
    );
    await updateWorkerAction(worker_id, encodedUserNotificationId, "");

    return res.status(200).json({ message: "Cancellation successful" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Helper functions for location calculations
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth's radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

const getAllLocations = async (worker_ids) => {
  try {
    const snapshot = await db
      .collection("workerLocations")
      .where("worker_id", "in", worker_ids)
      .get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.error("Error fetching locations from Firestore:", error);
    return [];
  }
};

const generatePin = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const formattedDate = () => {
  const now = new Date();
  return now.toLocaleDateString();
};

const formattedTime = () => {
  const now = new Date();
  return now.toLocaleTimeString();
};

const getCurrentTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const getWorkersNearby = async (req, res) => {
  try {
    // ------------------------------------------------------------------
    //  1) Extract request data
    // ------------------------------------------------------------------
    const user_id = req.user.id;
    const {
      area,
      pincode,
      city,
      alternateName,
      alternatePhoneNumber,
      serviceBooked, // array of { serviceName, cost }
      discount,
      tipAmount,
      offer,
    } = req.body;

    console.log("req.body", req.body);

    const created_at = getCurrentTimestamp();
    const serviceArray = JSON.stringify(serviceBooked); // e.g. '[{"serviceName":"...","cost": 250}, ...]'
    const serviceNames = serviceBooked.map((s) => s.serviceName);
    const totalCost =
      serviceBooked.reduce((acc, s) => acc + s.cost, 0) - discount + tipAmount;

    // ------------------------------------------------------------------
    //  2) Postgres Query #1: Insert userNotifications, find matching workers
    // ------------------------------------------------------------------
    const query1 = workerQueries.getNearbyWorkersStep1;

    const query1Params = [
      user_id, // $1
      created_at, // $2
      area, // $3
      pincode, // $4
      city, // $5
      alternateName, // $6
      alternatePhoneNumber, // $7
      serviceArray, // $8
      serviceNames, // $9 :: text[]
    ];

    const result1 = await client.query(query1, query1Params);
    if (result1.rows.length === 0) {
      return res
        .status(404)
        .json("No user found or no worker matches subservices");
    }

    const { user_notification_id, worker_ids, user_lat, user_lon } =
      result1.rows[0];

    if (!user_notification_id) {
      return res.status(404).json("Failed to insert user notification");
    }
    if (!worker_ids || worker_ids.length === 0) {
      return res.status(200).json("No workers match the requested subservices");
    }

    // ------------------------------------------------------------------
    //  3) Firestore: Get worker locations once, filter by 2km radius
    // ------------------------------------------------------------------
    const workerDb = await getAllLocations(worker_ids);
    if (!workerDb || workerDb.length === 0) {
      return res
        .status(200)
        .json("No Firestore location data for these workers");
    }

    const MAX_DISTANCE = 2; // 2km
    const nearbyWorkers = [];
    for (const doc of workerDb) {
      const dist = haversineDistance(
        user_lat,
        user_lon,
        doc.location._latitude,
        doc.location._longitude
      );
      if (dist <= MAX_DISTANCE) {
        nearbyWorkers.push(doc.worker_id);
      }
    }

    if (nearbyWorkers.length === 0) {
      return res.status(200).json("No workers found within 2 km radius");
    }

    // ------------------------------------------------------------------
    //  4) Postgres Query #2: Insert notifications & retrieve FCM tokens
    // ------------------------------------------------------------------
    const pin = generatePin(); // e.g. 4-6 digit pin
    const query2 = workerQueries.getNearbyWorkersStep2;

    const query2Params = [
      user_notification_id, // $1
      user_id, // $2
      user_lon, // $3
      user_lat, // $4
      created_at, // $5
      pin, // $6
      serviceArray, // $7
      nearbyWorkers, // $8 :: int[]
      discount, // $9
      totalCost, // $10
      tipAmount, // $11
      offer, // $12 (for coupons_applied)
    ];

    const result2 = await client.query(query2, query2Params);
    const tokens = result2.rows[0].tokens || [];

    // ------------------------------------------------------------------
    //  5) If Offer Provided, Update "offers_used" with 'status: applied'
    // ------------------------------------------------------------------
    if (offer) {
      const offerCodeValue = offer.offer_code;
      await client.query(workerQueries.updateOfferStatus, [offerCodeValue, user_id]);
    }

    // ------------------------------------------------------------------
    //  6) Send FCM notifications (if tokens exist)
    // ------------------------------------------------------------------
    const encodedUserNotificationId = Buffer.from(
      user_notification_id.toString()
    ).toString("base64");

    if (tokens.length > 0) {
      const normalNotificationMessage = {
        tokens,
        notification: {
          title: "🔔 ClickSolver Has a Job for You!",
          body: "💼 A user needs help! Accept now to support your ClickSolver family. 🤝",
        },
        data: {
          user_notification_id: encodedUserNotificationId,
          service: serviceArray,
          location: `${area}, ${city}, ${pincode}`,
          click_action: "FLUTTER_NOTIFICATION_CLICK",
          cost: totalCost.toString(),
          targetUrl: `/acceptance/${encodedUserNotificationId}`,
          screen: "Acceptance",
          date: formattedDate(),
          time: formattedTime(),
          type: "normal",
        },
        android: { priority: "high" },
      };

      try {
        const fcmResponse = await getMessaging().sendEachForMulticast(
          normalNotificationMessage
        );

        // Optional: track success/failure
        let successCount = 0;
        let failureCount = 0;
        fcmResponse.responses.forEach((resp, idx) => {
          if (resp.success) {
            successCount++;
          } else {
            failureCount++;
            console.error(
              `❌ Error sending to token ${tokens[idx]}:`,
              resp.error
            );
          }
        });
        console.log(
          `FCM Summary: ${successCount} success, ${failureCount} failures.`
        );
      } catch (err) {
        console.error("❌ Error sending FCM notifications:", err);
      }
    }

    // ------------------------------------------------------------------
    //  7) Return to Client
    // ------------------------------------------------------------------
    return res.status(200).json(encodedUserNotificationId);
  } catch (error) {
    console.error("Error in getWorkersNearby:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  storeWorkerLocation,
  updateWorkerLocation,
  getWorkerNavigationDetails,
  workerCancelNavigation,
  workerCancellationStatus,
  workerNavigationCancel,
  getWorkersNearby,
};
