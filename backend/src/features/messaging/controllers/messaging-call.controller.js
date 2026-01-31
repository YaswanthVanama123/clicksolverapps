const axios = require("axios");
const client = require("../../../database/connection");
const {
  getPhoneNumbersForWorkerCallQuery,
  getPhoneNumbersForUserCallQuery,
  getPhoneNumbersForUserTrackingCallQuery,
  getPhoneNumbersForWorkerTrackingCallQuery,
} = require("../../../database/queries/messaging.queries.js");

/**
 * Initiate phone call from worker to user (using notification_id)
 */
const phoneCall = async (req, res) => {
  try {
    const { decodedId } = req.body;

    if (!decodedId || typeof decodedId !== "string") {
      return res.status(400).json({ message: "Valid decodedId is required." });
    }

    // Fetch phone numbers using query
    const values = [decodedId];
    const result = await client.query(getPhoneNumbersForWorkerCallQuery, values);

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

    // Fetch phone numbers using query
    const values = [decodedId];
    const result = await client.query(getPhoneNumbersForUserCallQuery, values);

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

    // Fetch phone numbers using query
    const values = [tracking_id];
    const result = await client.query(getPhoneNumbersForUserTrackingCallQuery, values);

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

    // Fetch phone numbers using query
    const values = [tracking_id];
    const result = await client.query(getPhoneNumbersForWorkerTrackingCallQuery, values);

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

module.exports = {
  phoneCall,
  UserPhoneCall,
  userTrackingCall,
  workerTrackingCall,
  callMasking,
  initiateCall,
};
