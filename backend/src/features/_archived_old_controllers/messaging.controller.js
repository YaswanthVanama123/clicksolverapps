const axios = require("axios");
const { getMessaging } = require("firebase-admin/messaging");
const client = require("../../../connection.js");
const { v4: uuidv4 } = require("uuid");

// Azure Translator API configuration
const subscriptionKey =
  "1rFYPImsvNSHdC4MqvEUBYCUdJNaiCOAObvtk2N6fGhJ3BtIItNxJQQJ99BCACGhslBXJ3w3AAAbACOGxFd0";
const region = "centralindia";
const endpoint = "https://api.cognitive.microsofttranslator.com";
const apiVersion = "3.0";

// Messaging Functions

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

    /*
      This query performs the following in one step:
      1. In the CTE "accepted_data": Joins the "accepted" and "fcm" tables to retrieve the worker_id,
         current messages, and aggregates the FCM tokens.
      2. In the CTE "updated": Updates the "accepted" table by appending the new message (as JSONB)
         to the messages column.
      3. Finally, selects the updated messages and tokens.
    */
    const query = `
      WITH accepted_data AS (
        SELECT a.worker_id, a.messages, array_agg(f.fcm_token) AS tokens
        FROM accepted a
        JOIN fcm f ON a.worker_id = f.worker_id
        WHERE a.notification_id = $1
        GROUP BY a.worker_id, a.messages
      ),
      updated AS (
        UPDATE accepted
        SET messages = COALESCE(messages, '[]'::jsonb) || $2::jsonb
        WHERE notification_id = $1
        RETURNING messages
      )
      SELECT updated.messages, accepted_data.tokens
      FROM updated
      JOIN accepted_data ON true;
    `;

    const values = [request_id, newMessageJSON];
    const result = await client.query(query, values);

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

    /*
      This query performs the following in one step:
      1. In the CTE "accepted_data": Joins the "accepted" and "fcm" tables to retrieve the worker_id,
         current messages, and aggregates the FCM tokens.
      2. In the CTE "updated": Updates the "accepted" table by appending the new message (as JSONB)
         to the messages column.
      3. Finally, selects the updated messages and tokens.
    */
    const query = `
      WITH accepted_data AS (
        SELECT a.user_id, a.messages, array_agg(f.fcm_token) AS tokens
        FROM accepted a
        JOIN userfcm f ON a.user_id = f.user_id
        WHERE a.notification_id = $1
        GROUP BY a.user_id, a.messages
      ),
      updated AS (
        UPDATE accepted
        SET messages = COALESCE(messages, '[]'::jsonb) || $2::jsonb
        WHERE notification_id = $1
        RETURNING messages
      )
      SELECT updated.messages, accepted_data.tokens
      FROM updated
      JOIN accepted_data ON true;
    `;

    const values = [request_id, newMessageJSON];
    const result = await client.query(query, values);

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
    const query = `
      SELECT messages
      FROM accepted
      WHERE notification_id = $1
    `;

    const values = [request_id];

    const result = await client.query(query, values);

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
    const fcmQuery = `SELECT fcm_token FROM fcm WHERE worker_id = $1;`;
    const { rows } = await client.query(fcmQuery, [worker_id]);

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

// Call-Related Functions

/**
 * Initiate phone call from worker to user (using notification_id)
 */
const phoneCall = async (req, res) => {
  try {
    const { decodedId } = req.body;

    if (!decodedId || typeof decodedId !== "string") {
      return res.status(400).json({ message: "Valid decodedId is required." });
    }

    // Fetch `from_number` from accepted table by joining with user and workersverified tables
    const query = `
      SELECT
        u.phone_number AS from_number,
        w.phone_number AS mobile_number
      FROM accepted a
      JOIN "user" u ON a.user_id = u.user_id
      JOIN workersverified w ON a.worker_id = w.worker_id
      WHERE a.notification_id = $1
    `;

    const values = [decodedId];
    const result = await client.query(query, values);

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

/**
 * Initiate phone call from user to worker (using notification_id)
 */
const UserPhoneCall = async (req, res) => {
  try {
    const { decodedId } = req.body;

    if (!decodedId || typeof decodedId !== "string") {
      return res.status(400).json({ message: "Valid decodedId is required." });
    }

    // Fetch `from_number` from accepted table by joining with user and workersverified tables
    const query = `
      SELECT
        u.phone_number AS mobile_number,  -- User's phone number
        w.phone_number AS from_number    -- Worker's phone number
      FROM accepted a
      JOIN "user" u ON a.user_id = u.user_id
      JOIN workersverified w ON a.worker_id = w.worker_id
      WHERE a.notification_id = $1
    `;

    const values = [decodedId];
    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No matching data found." });
    }

    const { from_number, mobile_number } = result.rows[0];

    // Ensure these are valid strings
    if (typeof from_number !== "string" || typeof mobile_number !== "string") {
      return res.status(500).json({ message: "Invalid phone number format." });
    }

    console.log(
      "From Number:",
      from_number,
      "User's Mobile Number:",
      mobile_number
    );

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

    // Extract mobile from response, fallback to user's number if missing
    const responseData = apiResponse.data?.data?.mobile || mobile_number;

    console.log("Final Number (Masked or User's):", responseData);

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

/**
 * Initiate tracking call from user to worker (using tracking_id)
 */
const userTrackingCall = async (req, res) => {
  try {
    const { tracking_id } = req.body;

    if (!tracking_id) {
      return res
        .status(400)
        .json({ message: "Valid tracking_id is required." });
    }

    // Fetch `from_number` from servicetracking table by joining with user and workersverified tables
    const query = `
      SELECT
        u.phone_number AS mobile_number,  -- User's phone number
        w.phone_number AS from_number    -- Worker's phone number
      FROM servicetracking s
      JOIN "user" u ON s.user_id = u.user_id
      JOIN workersverified w ON s.worker_id = w.worker_id
      WHERE s.tracking_id = $1
    `;

    const values = [tracking_id];
    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No matching data found." });
    }

    const { from_number, mobile_number } = result.rows[0];

    // Ensure these are valid strings
    if (typeof from_number !== "string" || typeof mobile_number !== "string") {
      return res.status(500).json({ message: "Invalid phone number format." });
    }

    console.log(
      "From Number:",
      from_number,
      "User's Mobile Number:",
      mobile_number
    );

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

    // Extract mobile from response, fallback to user's number if missing
    const responseData = apiResponse.data?.data?.mobile || mobile_number;

    console.log("Final Number (Masked or User's):", responseData);

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

/**
 * Initiate tracking call from worker to user (using tracking_id)
 */
const workerTrackingCall = async (req, res) => {
  try {
    const { tracking_id } = req.body;

    if (!tracking_id) {
      return res.status(400).json({ message: "Valid decodedId is required." });
    }

    // Fetch `from_number` from accepted table by joining with user and workersverified tables
    const query = `
      SELECT
        u.phone_number AS from_number,
        w.phone_number AS mobile_number
      FROM servicetracking s
      JOIN "user" u ON s.user_id = u.user_id
      JOIN workersverified w ON s.worker_id = w.worker_id
      WHERE s.tracking_id = $1
    `;

    const values = [tracking_id];
    const result = await client.query(query, values);

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

/**
 * Call masking using Bonvoice AutoCall API
 */
const callMasking = async (req, res) => {
  try {
    // Dummy data for demonstration
    const workerNumber = "9392365494"; // Worker's actual phone number
    const customerNumber = "7981793632"; // Customer's actual phone number
    const virtualDID = "8071500945"; // Virtual DID (provided DID)
    const channelID = "3"; // Channel id for the given DID
    const eventID = "uniqueEventID_" + Date.now(); // Unique event ID for tracking

    // Build the payload according to Bonvoice AutoCall API
    const payload = {
      autocallType: "3", // Dial single number mode
      destination: workerNumber, // Call is initiated to the worker
      ringStrategy: "ringall", // Ring strategy
      legACallerID: virtualDID, // Virtual number to mask caller's real number (worker)
      legAChannelID: channelID,
      legADialAttempts: "1",
      legBDestination: customerNumber, // Customer number to be called once worker picks up
      legBCallerID: virtualDID, // Virtual number to mask customer's real number
      legBChannelID: channelID,
      legBDialAttempts: "1",
      eventID: eventID, // Unique identifier for the call
    };

    // API endpoint for Bonvoice AutoCall API
    const url =
      "https://backend.pbx.bonvoice.com/autoDialManagement/autoCallBridging/";

    // HTTP headers including the provided token
    const headers = {
      "Content-Type": "application/json",
      Authorization: "Token ff7f0eb0ed9bc1295ac7e0d7b7a643e0a2348b37",
    };

    // Make the POST request to initiate the call
    const response = await axios.post(url, payload, { headers });

    // If successful, return the virtual DID which the worker should call
    return res.status(200).json({
      message:
        "Call masking initiated successfully. Please dial the virtual DID.",
      dialNumber: virtualDID,
      data: response.data,
    });
  } catch (error) {
    console.error("Error in callMasking:", error.message);
    return res.status(500).json({
      message: "Error initiating call masking",
      error: error.message,
    });
  }
};

/**
 * Initiate IVR call with call masking
 */
const initiateCall = async (req, res) => {
  try {
    const { from, to, scheduled, timezone_id, scheduled_datetime } = req.body;

    console.log("Request Body:", req.body);

    if (!from || !to) {
      return res
        .status(400)
        .json({ error: 'Both "from" and "to" numbers are required.' });
    }

    // Build the payload.
    // Note: Set dial to "agent" so that the system expects the from person to dial the IVR number manually.
    const payload = {
      api_id: "APIMQSArLJl140228",
      api_password: "W2tbf56h",
      ivr_number: "1732351343", // Replace with your active IVR number.
      dial: "agent", // "agent" means the system will not automatically call the from number.
      receiver_number: to, // The number to connect when the IVR is dialed.
      agent_number: from, // The from person's number.
      scheduled: scheduled || 0,
      timezone_id: timezone_id || "",
      scheduled_datetime: scheduled_datetime || "",
    };

    // Make the API call.
    const apiResponse = await axios.post(
      "https://www.bulksmsplans.com/api/ivr/makeACall",
      payload,
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    console.log("API Response:", apiResponse.data);
    const { code, message, data } = apiResponse.data;

    if (code !== 200) {
      return res.status(500).json({ error: message, details: data });
    }

    // Construct an instructional message.
    const instruction = `Call initiated successfully. The IVR number ${payload.ivr_number} is now active. Please call this number from your phone to connect with ${to}.`;

    return res.json({
      message: instruction,
      callMaskingNumber: payload.ivr_number,
      details: data,
    });
  } catch (err) {
    console.error("Error in initiateCall:", err.message);
    return res
      .status(500)
      .json({ error: "Internal server error.", details: err.message });
  }
};

// Translation Service

/**
 * Translate text using Azure Translator API
 */
const translateText = async (req, res) => {
  const { text, fromLang, toLang } = req.body;

  console.log(req.body);

  if (!text || !fromLang || !toLang) {
    return res
      .status(400)
      .json({ error: "Missing required fields: text, fromLang, toLang" });
  }

  try {
    // Construct the API URL with query parameters
    const url = `${endpoint}/translate?api-version=${apiVersion}&from=${fromLang}&to=${toLang}`;

    // Set up headers for authentication and content type
    const headers = {
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      "Ocp-Apim-Subscription-Region": region,
      "Content-Type": "application/json",
      "X-ClientTraceId": uuidv4().toString(),
    };

    // Request body must be an array of objects with a "Text" property
    const body = [{ Text: text }];

    // Send POST request to Azure Translator API
    const response = await axios.post(url, body, { headers });

    // Extract the translated text from response
    const translatedText =
      response.data[0]?.translations[0]?.text || "Translation not available";

    res.json({ translatedText });
  } catch (error) {
    console.error(
      "Error in translation:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Translation failed" });
  }
};

module.exports = {
  sendMessageWorker,
  sendMessageUser,
  workerGetMessage,
  workerMessage,
  phoneCall,
  UserPhoneCall,
  userTrackingCall,
  workerTrackingCall,
  callMasking,
  initiateCall,
  translateText,
};
