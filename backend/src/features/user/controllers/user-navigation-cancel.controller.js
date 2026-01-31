const { getMessaging } = require("firebase-admin/messaging");
const client = require("../../../database/connection");
const { user: userQueries } = require("../../../database/queries");

const userCancelNavigation = async (req, res) => {
  const { notification_id } = req.body;

  if (!notification_id) {
    return res.status(400).json({ error: "Notification ID is required" });
  }

  try {
    const result = await client.query(
      userQueries.updateUserNavigationCancelStatusQuery,
      [notification_id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Cancellation time is up or Notification not found" });
    }

    const updatedStatus = result.rows[0].user_navigation_cancel_status;

    if (updatedStatus === "timeup") {
      return res.status(404).json({ error: "Cancellation time is up" });
    }

    return res.status(200).json({ message: "Cancellation successful" });
  } catch (error) {
    console.error("Error updating cancellation status:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

const userNavigationCancel = async (req, res) => {
  const { notification_id, offer_code } = req.body;
  const encodedUserNotificationId = Buffer.from(
    notification_id.toString()
  ).toString("base64");

  try {
    await client.query("BEGIN");
    console.log("Transaction started for notification_id:", notification_id);

    const combinedQuery = await client.query(
      userQueries.userNavigationCancelCombinedQuery,
      [notification_id, offer_code]
    );

    if (combinedQuery.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        error: "Cancellation not performed. Invalid ID or already canceled.",
      });
    }

    await client.query(userQueries.deleteAcceptedAfterCancelQuery, [
      notification_id,
    ]);

    await client.query("COMMIT");
    console.log(
      "Transaction committed successfully for notification_id:",
      notification_id
    );

    const { verified, worker_id, user_id, service_booked, fcm_token } =
      combinedQuery.rows[0];

    if (!verified) {
      if (fcm_token) {
        const message = {
          notification: {
            title: "Booking Cancelled",
            body: `User has cancelled the booking for ${service_booked}`,
          },
          token: fcm_token,
          data: {
            notification_id: encodedUserNotificationId,
          },
        };

        try {
          await getMessaging().send(message);
          console.log("FCM notification sent successfully");
        } catch (fcmError) {
          console.error("Error sending FCM notification:", fcmError);
        }
      }

      return res.status(200).json({
        message: "Cancellation successful",
        verified: false,
      });
    }

    return res.status(200).json({
      message: "Booking verified, cannot cancel",
      verified: true,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error during cancellation:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const userCancellationStatus = async (req, res) => {
  const { notification_id } = req.query;

  if (!notification_id) {
    return res.status(400).json({ error: "Notification ID is required" });
  }

  try {
    const result = await client.query(
      userQueries.checkUserCancellationStatusQuery,
      [notification_id]
    );

    if (result.rows.length > 0) {
      return res.status(200).json({ message: "Row found" });
    } else {
      return res.status(205).json({ message: "User cancelled" });
    }
  } catch (error) {
    console.error("Error checking cancellation status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  userCancelNavigation,
  userNavigationCancel,
  userCancellationStatus,
};
