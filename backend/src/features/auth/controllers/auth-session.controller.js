const admin = require("../../../config/firebase.config.js");
const client = require("../../../database/connection");
const authQueries = require("../../../database/queries/auth.queries");

// ============================================================================
// SESSION & LOGOUT FUNCTIONS
// ============================================================================

const sendLogoutNotificationAndDeleteTokens = async (workerId) => {
  try {
    // Fetch all FCM tokens for the worker
    const fcmResult = await client.query(authQueries.GET_WORKER_FCM_TOKENS, [workerId]);

    if (fcmResult.rows.length === 0) return; // No active devices

    const tokens = fcmResult.rows.map((row) => row.fcm_token);

    // Send FCM logout notification
    const message = {
      tokens,
      notification: {
        title: "Logged Out",
        body: "You have been logged out due to a login on another device.",
      },
      data: { action: "FORCE_LOGOUT" },
    };

    await admin.messaging().sendEachForMulticast(message);
    console.log("Logout notification sent to all previous devices.");

    // Delete all FCM tokens from the fcm table for this worker
    await client.query(authQueries.DELETE_WORKER_FCM_TOKENS, [workerId]);
    console.log(`Deleted all FCM tokens for worker_id: ${workerId}`);
  } catch (error) {
    console.error(
      "Error sending logout notification or deleting FCM tokens:",
      error
    );
  }
};

const workerLogout = async (req, res) => {
  try {
    const { fcm_token } = req.body;

    console.log("workerlogout", fcm_token);

    if (!fcm_token) {
      return res
        .status(400)
        .json({ success: false, message: "FCM token is required" });
    }

    // Delete FCM token from the `fcm` table
    const result = await client.query(authQueries.DELETE_WORKER_FCM_TOKEN, [fcm_token]);

    if (result.rowCount > 0) {
      return res
        .status(200)
        .json({
          success: true,
          message: "Worker logged out and FCM token deleted",
        });
    } else {
      return res
        .status(200)
        .json({ success: false, message: "worker already logout" });
    }
  } catch (error) {
    console.error("Error in workerLogout:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const userLogout = async (req, res) => {
  try {
    const { fcm_token } = req.body;

    if (!fcm_token) {
      return res
        .status(400)
        .json({ success: false, message: "FCM token is required" });
    }

    // Delete FCM token from the `userfcm` table
    const result = await client.query(authQueries.DELETE_USER_FCM_TOKEN, [fcm_token]);

    if (result.rowCount > 0) {
      return res
        .status(200)
        .json({
          success: true,
          message: "User logged out and FCM token deleted",
        });
    } else {
      return res
        .status(200)
        .json({ success: false, message: "FCM token not found" });
    }
  } catch (error) {
    console.error("Error in userLogout:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const workerTokenVerification = async (req, res) => {
  try {
    const { pcsToken } = req.body;
    const worker_id = req.worker.id; // Ensure worker_id is being extracted correctly

    // Validate input
    if (!pcsToken || !worker_id) {
      return res.status(400).json({ message: "Missing pcsToken or worker_id" });
    }

    // Query to get session token
    const result = await client.query(authQueries.GET_WORKER_SESSION_TOKEN, [worker_id]);

    // If worker_id is found in the table
    if (result.rows.length > 0) {
      const { session_token } = result.rows[0];

      // Check if the session token matches the provided pcsToken
      if (session_token !== pcsToken) {
        return res.status(205).json({ message: "Session token mismatch" });
      } else {
        return res.status(200).json({ message: "Token verified" });
      }
    } else {
      return res
        .status(200)
        .json({ message: "Worker not verified, proceeding with verification" });
    }
  } catch (error) {
    console.error("Error in workerTokenVerification:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  sendLogoutNotificationAndDeleteTokens,
  workerLogout,
  userLogout,
  workerTokenVerification,
};
