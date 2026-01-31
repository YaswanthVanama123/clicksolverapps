const admin = require("../../../config/firebase.config.js");
const { getMessaging } = require("firebase-admin/messaging");
const db = admin.firestore();
const client = require("../../../database/connection");

/**
 * Updates worker action in the database
 * @param {string} workerId - The worker ID
 * @param {string} encodedId - Base64 encoded notification ID
 * @param {string} screen - Screen name to navigate to
 * @returns {Promise<Object>} Updated worker action record
 */
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
    throw error;
  }
};

/**
 * Creates a user background action (assuming this exists in codebase)
 * Note: This function is referenced but not defined in the service controllers
 * It should be imported from wherever it's actually defined
 */
// const createUserBackgroundAction = async (userId, encodedId, screen, serviceBooked) => {
//   // Implementation should be imported from actual location
// };

/**
 * Gets current timestamp in format: YYYY-MM-DD HH:mm:ss
 * @returns {string} Formatted timestamp
 */
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

/**
 * Formats seconds into HH:MM:SS string
 * @param {number} seconds - Total seconds
 * @returns {string} Formatted time string
 */
const formatTime = (seconds) => {
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
};

/**
 * Parses time string (HH:MM:SS) to seconds
 * @param {string} timeString - Time in HH:MM:SS format
 * @returns {number} Total seconds
 */
const parseTime = (timeString) => {
  if (!timeString) return 0;
  const parts = timeString.split(":");
  if (parts.length !== 3) return 0;

  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  const seconds = parseInt(parts[2], 10) || 0;

  return hours * 3600 + minutes * 60 + seconds;
};

/**
 * Calculates time difference between two timestamps in IST
 * @param {Date|string} startTime - Start timestamp
 * @param {Date|string} endTime - End timestamp
 * @returns {Object} Object with time_worked in HH:MM:SS format
 */
const getTimeDifferenceInIST = (startTime, endTime) => {
  // Parse input times
  const start = new Date(startTime);
  const end = new Date(endTime);

  // Calculate the difference in milliseconds
  const differenceInMillis = end - start;

  // Convert milliseconds to seconds
  const differenceInSeconds = Math.floor(differenceInMillis / 1000);

  // Calculate hours, minutes, and seconds
  const hours = Math.floor(differenceInSeconds / 3600);
  const minutes = Math.floor((differenceInSeconds % 3600) / 60);
  const seconds = differenceInSeconds % 60;

  // Format to hh:mm:ss with leading zeros
  const formatTimeValue = (value) => value.toString().padStart(2, "0");
  const time_worked = `${formatTimeValue(hours)}:${formatTimeValue(minutes)}:${formatTimeValue(seconds)}`;

  return { time_worked };
};

/**
 * Sends FCM notification to multiple tokens
 * @param {Array<string>} tokens - Array of FCM tokens
 * @param {Object} notification - Notification payload
 * @param {Object} data - Data payload
 * @returns {Promise<Object>} FCM response
 */
const sendFCMNotification = async (tokens, notification, data = {}) => {
  if (!tokens || tokens.length === 0) {
    console.warn("No FCM tokens provided");
    return { success: false, message: "No tokens provided" };
  }

  const multicastMessage = {
    tokens,
    notification,
    data,
  };

  try {
    const response = await getMessaging().sendEachForMulticast(multicastMessage);

    response.responses.forEach((res, index) => {
      if (!res.success) {
        console.error(`Error sending message to token ${tokens[index]}:`, res.error);
      }
    });

    return response;
  } catch (error) {
    console.error("Error sending FCM notifications:", error);
    throw error;
  }
};

module.exports = {
  updateWorkerAction,
  getCurrentTimestamp,
  formatTime,
  parseTime,
  getTimeDifferenceInIST,
  sendFCMNotification,
};
