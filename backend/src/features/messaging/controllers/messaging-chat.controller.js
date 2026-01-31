const { getMessaging } = require("firebase-admin/messaging");
const client = require("../../../database/connection");
const {
  sendMessageToWorkerQuery,
  sendMessageToUserQuery,
  getMessagesFromAcceptedQuery,
  getWorkerFcmTokensQuery,
} = require("../../../database/queries/messaging.queries.js");

/**
 * Send message to worker and update the accepted table
 */
const sendMessageWorker = async (req, res) => {
  const { request_id, senderType, message } = req.body;

  try {
    // Prepare the new message object as a JSON string wrapped in an array
    const newMessageJSON = JSON.stringify([
      {
        key: senderType,
        message,
        timestamp: new Date().toISOString(),
      },
    ]);

    const values = [request_id, newMessageJSON];
    const result = await client.query(sendMessageToWorkerQuery, values);

    console.log("Rows updated:", result.rowCount);

    if (result.rowCount === 0) {
      return res
        .status(205)
        .json({ error: "Request not found or update failed" });
    }

    const updatedMessages = result.rows[0].messages;
    const fcmTokens = result.rows[0].tokens; // array of FCM tokens

    // Prepare multicast payload
    const multicastMessage = {
      tokens: fcmTokens,
      notification: {
        title:
          senderType === "user"
            ? "User sent a message"
            : "Worker sent a message",
        body: message,
      },
      data: {
        request_id: String(request_id),
        senderType,
        message,
      },
    };

    // Send notifications using sendEachForMulticast
    const response = await getMessaging().sendEachForMulticast(
      multicastMessage
    );
    response.responses.forEach((resp, index) => {
      if (!resp.success) {
        console.error(
          `Error sending message to token ${fcmTokens[index]}:`,
          resp.error
        );
      }
    });

    return res.status(200).json({
      message: "Message stored and FCM notification sent successfully!",
      messages: updatedMessages,
      fcmResponse: response,
    });
  } catch (error) {
    console.error("Error in sendMessageWorker:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Send message to user and update the accepted table
 */
const sendMessageUser = async (req, res) => {
  const { request_id, senderType, message } = req.body;
  console.log("Received request:", req.body);

  try {
    // Prepare the new message object as a JSON string wrapped in an array
    const newMessageJSON = JSON.stringify([
      {
        key: senderType,
        message,
        timestamp: new Date().toISOString(),
      },
    ]);

    const values = [request_id, newMessageJSON];
    const result = await client.query(sendMessageToUserQuery, values);

    console.log("Rows updated:", result.rowCount);

    if (result.rowCount === 0) {
      return res
        .status(205)
        .json({ error: "Request not found or update failed" });
    }

    const updatedMessages = result.rows[0].messages;
    const fcmTokens = result.rows[0].tokens; // array of FCM tokens

    // Prepare multicast payload
    const multicastMessage = {
      tokens: fcmTokens,
      notification: {
        title:
          senderType === "user"
            ? "User sent a message"
            : "Worker sent a message",
        body: message,
      },
      data: {
        request_id: String(request_id),
        senderType,
        message,
      },
    };

    // Send notifications using sendEachForMulticast
    const response = await getMessaging().sendEachForMulticast(
      multicastMessage
    );
    response.responses.forEach((resp, index) => {
      if (!resp.success) {
        console.error(
          `Error sending message to token ${fcmTokens[index]}:`,
          resp.error
        );
      }
    });

    return res.status(200).json({
      message: "Message stored and FCM notification sent successfully!",
      messages: updatedMessages,
      fcmResponse: response,
    });
  } catch (error) {
    console.error("Error in sendMessageWorker:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Get messages for a worker by request_id
 */
const workerGetMessage = async (req, res) => {
  const { request_id } = req.query;

  try {
    const values = [request_id];
    const result = await client.query(getMessagesFromAcceptedQuery, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    const messages = result.rows[0].messages;
    return res.status(200).json({ messages });
  } catch (error) {
    console.error("Error in workerGetMessage:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Send notification message to worker
 */
const workerMessage = async (req, res) => {
  try {
    const { worker_id, message } = req.body;

    if (!worker_id || !message) {
      return res
        .status(400)
        .json({ error: "worker_id and message are required" });
    }

    // Fetch FCM tokens for the worker
    const { rows } = await client.query(getWorkerFcmTokensQuery, [worker_id]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No FCM tokens found for this worker." });
    }

    // Extract FCM tokens
    const fcmTokens = rows.map((row) => row.fcm_token);

    // Construct the FCM multicast message
    const multicastMessage = {
      tokens: fcmTokens, // Sending to multiple tokens
      notification: {
        title: "Payment Reminder",
        body: message,
      },
      android: {
        priority: "high",
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    };

    // Send message using Firebase Admin SDK
    try {
      const response = await getMessaging().sendEachForMulticast(
        multicastMessage
      );

      // Log failures if any
      response.responses.forEach((res, index) => {
        if (!res.success) {
          console.error(
            `Error sending message to token ${fcmTokens[index]}:`,
            res.error
          );
        }
      });

      return res.status(200).json({
        success: true,
        message: "Message sent successfully",
        response: response.responses,
      });
    } catch (error) {
      console.error("Error sending notifications:", error);
      return res.status(500).json({ error: "Failed to send message" });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  sendMessageWorker,
  sendMessageUser,
  workerGetMessage,
  workerMessage,
};
