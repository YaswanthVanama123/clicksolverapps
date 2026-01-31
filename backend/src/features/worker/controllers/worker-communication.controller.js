const axios = require("axios");
const { getMessaging } = require("firebase-admin/messaging");
const client = require("../../../../connection.js");
const workerQueries = require("../../../database/queries/worker.queries");

// Communication Functions (Messages and Calls)

const workerTrackingCall = async (req, res) => {
  try {
    const { tracking_id } = req.body;

    if (!tracking_id) {
      return res.status(400).json({ message: "Valid decodedId is required." });
    }

    // Fetch `from_number` from accepted table by joining with user and workersverified tables
    const values = [tracking_id];
    const result = await client.query(workerQueries.getTrackingCallNumbers, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No matching data found." });
    }

    const { from_number, mobile_number } = result.rows[0];

    // Ensure these are strings (avoiding JSON structure issues)
    if (typeof from_number !== "string" || typeof mobile_number !== "string") {
      return res.status(500).json({ message: "Invalid phone number format." });
    }

    console.log("From Number:", from_number, "Mobile Number:", mobile_number);

    // Call the external API
    const apiResponse = await axios.post(
      "https://apiv1.cloudshope.com/api/outboundCall",
      { from_number, mobile_number },
      {
        headers: {
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEwMzgzLCJ1c2VybmFtZSI6Illhc2h3YW50NjU0OTQiLCJtYWluX3VzZXIiOjEwMzgzLCJpYXQiOjE3Mzk3NzIzOTB9.HKURS7DdnYsizBBDgeTn6E5JpkKk1C8qkuRDL3l3qDE`,
        },
      }
    );

    // Extract mobile from response, fallback to worker's number if missing
    const responseData = apiResponse.data?.data?.mobile || mobile_number;

    console.log("Final Number (Masked or Worker's):", responseData);

    res.status(200).json({
      message: "Call initiated successfully.",
      mobile: responseData,
    });
  } catch (error) {
    console.error("Error initiating call:", error.message);

    res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};

const phoneCall = async (req, res) => {
  try {
    const { decodedId } = req.body;

    if (!decodedId || typeof decodedId !== "string") {
      return res.status(400).json({ message: "Valid decodedId is required." });
    }

    // Fetch `from_number` from accepted table by joining with user and workersverified tables
    const values = [decodedId];
    const result = await client.query(workerQueries.getCallNumbers, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No matching data found." });
    }

    const { from_number, mobile_number } = result.rows[0];

    // Ensure these are strings (avoiding JSON structure issues)
    if (typeof from_number !== "string" || typeof mobile_number !== "string") {
      return res.status(500).json({ message: "Invalid phone number format." });
    }

    console.log("From Number:", from_number, "Mobile Number:", mobile_number);

    // Call the external API
    const apiResponse = await axios.post(
      "https://apiv1.cloudshope.com/api/outboundCall",
      { from_number, mobile_number },
      {
        headers: {
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEwMzgzLCJ1c2VybmFtZSI6Illhc2h3YW50NjU0OTQiLCJtYWluX3VzZXIiOjEwMzgzLCJpYXQiOjE3Mzk3NzIzOTB9.HKURS7DdnYsizBBDgeTn6E5JpkKk1C8qkuRDL3l3qDE`,
        },
      }
    );

    // Extract mobile from response, fallback to worker's number if missing
    const responseData = apiResponse.data?.data?.mobile || mobile_number;

    console.log("Final Number (Masked or Worker's):", responseData);

    res.status(200).json({
      message: "Call initiated successfully.",
      mobile: responseData,
    });
  } catch (error) {
    console.error("Error initiating call:", error.message);

    res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};

const workerMessage = async (req, res) => {
  try {
    const { worker_id, message } = req.body;

    if (!worker_id || !message) {
      return res
        .status(400)
        .json({ error: "worker_id and message are required" });
    }

    // Fetch FCM tokens for the worker
    const { rows } = await client.query(workerQueries.getWorkerFcmTokens, [worker_id]);

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

const workerGetMessage = async (req, res) => {
  const { request_id } = req.query;

  try {
    const values = [request_id];
    const result = await client.query(workerQueries.getWorkerMessages, values);

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

module.exports = {
  workerTrackingCall,
  phoneCall,
  workerMessage,
  workerGetMessage,
};
