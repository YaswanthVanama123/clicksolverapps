const client = require("../../../database/connection");
const { user: userQueries } = require("../../../database/queries");

const storeUserFcmToken = async (req, res) => {
  const { fcmToken } = req.body;
  const userId = req.user.id;

  try {
    const result = await client.query(
      userQueries.storeUserFcmTokenWithDeleteQuery,
      [userId, fcmToken]
    );

    if (result.rowCount > 0) {
      return res.status(200).json({ message: "FCM token stored successfully" });
    } else {
      return res
        .status(200)
        .json({ message: "FCM token already exists for this user" });
    }
  } catch (error) {
    console.error("Error storing FCM token:", error);
    return res.status(500).json({ error: "Failed to store FCM token" });
  }
};

const storeUserNotification = async (req, res) => {
  const userId = req.user.id;
  const { fcmToken, notification } = req.body;
  const { title, body, data, receivedAt, userNotificationId } = notification;
  try {
    const result = await client.query(
      userQueries.storeUserReceivedNotificationQuery,
      [
        title,
        body,
        JSON.stringify(data),
        receivedAt,
        userId,
        userNotificationId,
        fcmToken,
      ]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error storing notification:", err);
    res.status(500).send("Error storing notification");
  }
};

const getUserNotifications = async (req, res) => {
  const userId = req.user.id;
  const fcmToken = req.query.fcmToken;

  try {
    const result = await client.query(
      userQueries.getUserReceivedNotificationsQuery,
      [userId, fcmToken]
    );

    const notifications = result.rows;
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

module.exports = {
  storeUserFcmToken,
  storeUserNotification,
  getUserNotifications,
};
