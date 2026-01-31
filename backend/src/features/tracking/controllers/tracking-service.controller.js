const admin = require("../../../config/firebase.config.js");
const db = admin.firestore();
const client = require("../../../database/connection");
const { getMessaging } = require("firebase-admin/messaging");
const {
  UPDATE_WORKER_ACTION,
  UPSERT_USER_BACKGROUND_ACTION,
  INSERT_SERVICE_TRACKING,
  GET_WORKER_TRACKING_SERVICES,
  GET_ALL_TRACKING_SERVICES,
  GET_USER_TRACKING_SERVICES,
} = require("../../../database/queries/tracking.queries.js");

/**
 * TRACKING SERVICE CONTROLLER
 * Handles service tracking operations including creating tracking entries
 * and retrieving tracking information for users, workers, and admin
 *
 * Functions:
 * - insertTracking: Create tracking entry for a service
 * - getWorkerTrackingServices: Get tracking services for a worker
 * - getAllTrackingServices: Get all tracking services (admin)
 * - getUserTrackingServices: Get tracking services for a user
 */

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

    console.log("Executing SQL query:", UPDATE_WORKER_ACTION);
    const result = await client.query(UPDATE_WORKER_ACTION, [
      workerId,
      screen,
      params,
    ]);
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
    const result = await client.query(UPSERT_USER_BACKGROUND_ACTION, params);

    // The result will contain the inserted or updated row
    const updatedTrackScreen = result.rows[0];

    // Return the updated user action data
    return updatedTrackScreen;
  } catch (error) {
    console.error("Error inserting or updating user background action:", error);
    throw error; // Re-throw the error after logging
  }
};

/**
 * Insert tracking information for a service
 * @route POST /add/tracking
 * @param {string} notification_id - Notification ID
 * @param {object} details - Additional tracking details
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

    const values = [
      notification_id,
      trackingPin,
      trackingKey,
      serviceStatus,
      details, // This should be a valid JSON string/object
    ];

    const result = await client.query(INSERT_SERVICE_TRACKING, values);

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
 * @route GET /worker/tracking/services
 * @requires Authentication - req.worker.id from authenticateWorkerToken middleware
 */
const getWorkerTrackingServices = async (req, res) => {
  try {
    const workerId = req.worker.id;

    const values = [workerId];

    // Execute the query
    const result = await client.query(GET_WORKER_TRACKING_SERVICES, values);

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
 * Get all tracking services (Admin function)
 * @route GET /all/tracking/services
 */
const getAllTrackingServices = async (req, res) => {
  try {
    console.log("Hi");
    // Execute the query
    const result = await client.query(GET_ALL_TRACKING_SERVICES);

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
 * @route GET /user/tracking/services
 * @requires Authentication - req.user.id from authenticateToken middleware
 */
const getUserTrackingServices = async (req, res) => {
  try {
    const userId = req.user.id;

    const values = [userId];

    // Execute the query
    const result = await client.query(GET_USER_TRACKING_SERVICES, values);

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

module.exports = {
  insertTracking,
  getWorkerTrackingServices,
  getAllTrackingServices,
  getUserTrackingServices,
};
