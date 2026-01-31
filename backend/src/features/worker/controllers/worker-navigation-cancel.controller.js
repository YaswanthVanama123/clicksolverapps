const admin = require("../../../config/firebase.config.js");
const { getMessaging } = require("firebase-admin/messaging");
const client = require("../../../../connection.js");
const workerQueries = require("../../../database/queries/worker.queries");

// Worker Navigation Cancellation Functions

/**
 * Updates user background action to remove tracking entry
 * @param {number} user_id - User ID
 * @param {string} encodedUserNotificationId - Base64 encoded notification ID
 * @param {string} screen - Screen name
 * @param {string} service_booked - Service booked information
 */
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

/**
 * Updates worker action screen
 * @param {number} worker_id - Worker ID
 * @param {string} encodedUserNotificationId - Base64 encoded notification ID
 * @param {string} screen - Screen name
 */
const updateWorkerAction = async (worker_id, encodedUserNotificationId, screen) => {
  try {
    await client.query(workerQueries.updateWorkerActionScreen, [worker_id, screen]);
  } catch (error) {
    console.error("Error updating worker action:", error);
  }
};

/**
 * Simple worker cancellation - marks navigation as worker canceled
 *
 * This function updates the navigation_status to 'workercanceled' if:
 * - Notification exists
 * - Status is not already 'timeup'
 *
 * @requires req.body.notification_id - Notification ID to cancel
 */
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

/**
 * Retrieves navigation cancellation status
 *
 * @requires req.query.notification_id - Notification ID to check status
 */
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

/**
 * Complete worker navigation cancellation with service completion
 *
 * This function performs a comprehensive cancellation including:
 * 1. Updates accepted record with user_navigation_cancel_status = 'workercanceled'
 * 2. Inserts record into completenotifications with status 'workercanceled'
 * 3. Updates user's offers_used if coupon was applied (changes status to 'pending')
 * 4. Retrieves user FCM tokens
 * 5. Deletes the original accepted record
 * 6. Sends FCM notification to user
 * 7. Updates user and worker background actions
 *
 * Uses PostgreSQL transaction for data consistency.
 *
 * @requires req.body.notification_id - Notification ID to cancel
 * @requires req.body.offer_code - Offer code (if applicable)
 */
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

module.exports = {
  workerCancelNavigation,
  workerCancellationStatus,
  workerNavigationCancel,
};
