const admin = require("../../../config/firebase.config.js");
const { getMessaging } = require("firebase-admin/messaging");
const db = admin.firestore();
const client = require("../../../database/connection");
const {
  getCurrentTimestamp,
  formatTime,
  parseTime,
  sendFCMNotification,
} = require("./service.helpers.js");

// Global state for stopwatch management
// Note: In production, consider using Redis or similar for distributed systems
const activeNotifications = new Set();
let stopwatchInterval = null;

/**
 * Starts the stopwatch timer for a service
 * @param {number} notificationId - Notification ID to track time for
 * @returns {Promise<string>} Current worked time
 */
const startStopwatch = async (notificationId) => {
  // Check if stopwatch is already running for this notificationId
  if (activeNotifications.has(notificationId)) {
    // Return the current worked time if it's already running
    const result = await client.query(
      "SELECT time_worked FROM ServiceCall WHERE notification_id = $1",
      [notificationId]
    );
    if (result.rows.length > 0 && result.rows[0].time_worked !== null) {
      const workedTimeString = result.rows[0].time_worked;
      return workedTimeString;
    }
  }

  try {
    // Query the database to get worker_id from notifications table
    const workerResult = await client.query(
      "SELECT worker_id FROM accepted WHERE notification_id = $1",
      [notificationId]
    );

    if (workerResult.rows.length === 0) {
      throw new Error("No worker found for the given notification ID");
    }

    const workerId = workerResult.rows[0].worker_id;

    // Query the database to check if there's already time worked for this notificationId
    const result = await client.query(
      "SELECT time_worked FROM ServiceCall WHERE notification_id = $1",
      [notificationId]
    );

    let workedTime = 0;

    if (result.rows.length > 0 && result.rows[0].time_worked !== null) {
      // If time worked exists, parse it from the database
      const workedTimeString = result.rows[0].time_worked;
      workedTime = parseTime(workedTimeString);
    } else {
      // If no time worked exists, initialize it to 0 in the database and insert worker_id
      workedTime = 0;
      await client.query(
        "INSERT INTO ServiceCall (notification_id, start_time, time_worked, worker_id) VALUES ($1, $2, $3, $4)",
        [notificationId, new Date(), formatTime(workedTime), workerId]
      );
    }

    // Add the notificationId to activeNotifications to indicate it's running
    activeNotifications.add(notificationId);

    // Set up the interval to update time worked every second
    if (!stopwatchInterval) {
      stopwatchInterval = setInterval(async () => {
        workedTime += 1;

        try {
          const formattedTime = formatTime(workedTime);

          // Update the time worked in the database
          await client.query(
            "UPDATE ServiceCall SET time_worked = $1 WHERE notification_id = $2",
            [formattedTime, notificationId]
          );
        } catch (error) {
          console.error("Error formatting or updating worked time:", error);
        }
      }, 1000);
    }
  } catch (error) {
    console.error("Error starting stopwatch:", error);
    throw error;
  }
};

/**
 * Stops the stopwatch timer for a service
 * @param {number} notificationId - Notification ID to stop timer for
 * @returns {Promise<number>} Worker ID associated with the notification
 */
const stopStopwatch = async (notificationId) => {
  if (stopwatchInterval) {
    clearInterval(stopwatchInterval);
    stopwatchInterval = null;

    try {
      const endTime = new Date();

      // SQL query to join servicecall and notifications
      const query = `
        UPDATE servicecall
        SET end_time = $1
        WHERE notification_id = $2
        RETURNING (
          SELECT notifications.worker_id
          FROM notifications
          WHERE notifications.notification_id = servicecall.notification_id
        ) AS worker_id;
      `;
      const values = [endTime, notificationId];

      const result = await client.query(query, values);

      if (result.rowCount === 0) {
        throw new Error("No service call found with the given notification_id");
      }

      const userIdDetails = await client.query(
        "SELECT user_id FROM notifications WHERE notification_id = $1",
        [notificationId]
      );

      const userId = userIdDetails.rows[0].user_id;

      const fcmTokenResult = await client.query(
        "SELECT fcm_token FROM userfcm WHERE user_id = $1",
        [userId]
      );

      const fcmTokens = fcmTokenResult.rows.map((row) => row.fcm_token);

      if (fcmTokens.length > 0) {
        try {
          await sendFCMNotification(
            fcmTokens,
            {
              title: "Click Solver",
              body: `Commander has completed your work. Great to hear!`,
            },
            {
              user_notification_id: notificationId.toString(),
            }
          );
        } catch (error) {
          console.error("Error sending notifications:", error);
        }
      } else {
        console.error("No FCM tokens to send the message to.");
      }

      return result.rows[0].worker_id;
    } catch (error) {
      console.error("Error updating end_time:", error);
      throw new Error("Internal server error");
    }
  } else {
    throw new Error("Stopwatch is not running");
  }
};

/**
 * Gets the current timer value for a notification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTimerValue = async (req, res) => {
  const { notification_id } = req.body;
  try {
    const result = await client.query(
      "SELECT time_worked FROM ServiceCall WHERE notification_id = $1",
      [notification_id]
    );

    if (result.rows.length > 0) {
      const workedTime = result.rows[0].time_worked;
      if (workedTime) {
        res.status(200).json(workedTime);
      } else {
        res.status(200).json("00:00:00");
      }
    } else {
      res.status(404).json({ error: "Notification ID not found" });
    }
  } catch (error) {
    console.error("Error fetching timer value:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Checks if start time exists, creates it if not
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const CheckStartTime = async (req, res) => {
  const { notification_id } = req.body;

  try {
    // Use LEFT JOIN to get start_time, worker_id, and payment in a single query
    const result = await client.query(
      `SELECT sc.start_time,
              COALESCE(sc.worker_id, a.worker_id) AS worker_id,
              COALESCE(sc.payment, a.total_cost) AS payment
       FROM ServiceCall sc
       LEFT JOIN accepted a
       ON sc.notification_id = a.notification_id
       WHERE sc.notification_id = $1 OR a.notification_id = $1`,
      [notification_id]
    );

    if (result.rows.length > 0) {
      const { start_time, worker_id, payment } = result.rows[0];

      if (start_time) {
        // If start_time exists, return it
        return res
          .status(200)
          .json({ worked_time: start_time, worker_id, payment });
      } else if (worker_id) {
        // If start_time doesn't exist, insert current timestamp into ServiceCall
        const currentTime = getCurrentTimestamp();
        await client.query(
          "INSERT INTO ServiceCall (notification_id, worker_id, start_time, payment) VALUES ($1, $2, $3, $4)",
          [notification_id, worker_id, currentTime, payment]
        );

        return res
          .status(200)
          .json({ worked_time: currentTime, worker_id, payment });
      }
    }

    // If no worker_id is found in both tables, return a 404
    return res.status(404).json({
      error: "Notification ID not found in ServiceCall or accepted table",
    });
  } catch (error) {
    console.error("Error fetching or inserting start time:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Starts timer by inserting start time into database
 * @param {number} notificationId - Notification ID to start timer for
 * @returns {Promise<Date|string>} Start time or error message
 */
const TimeStart = async (notificationId) => {
  try {
    // Query to insert into servicecall and get the worker_id in one step,
    // while also inserting the payment value from accepted.total_cost
    const result = await client.query(
      `
      INSERT INTO servicecall (notification_id, start_time, worker_id, payment)
      SELECT $1, $2, worker_id, total_cost
      FROM accepted
      WHERE notification_id = $1
      RETURNING start_time
      `,
      [notificationId, new Date()]
    );

    if (result.rows.length > 0) {
      return result.rows[0].start_time;
    } else {
      return "Insertion failed";
    }
  } catch (error) {
    console.error("Error in TimeStart:", error);
    return "Error occurred";
  }
};

module.exports = {
  startStopwatch,
  stopStopwatch,
  getTimerValue,
  CheckStartTime,
  TimeStart,
};
