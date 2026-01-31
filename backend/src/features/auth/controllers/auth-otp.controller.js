const admin = require("../../../config/firebase.config.js");
const { getMessaging } = require("firebase-admin/messaging");
const client = require("../../../database/connection");
const axios = require("axios");
const request = require("request");
const { TimeStart } = require("../../service/controllers/service-timer.controller.js");
const authQueries = require("../../../database/queries/auth.queries");

// Telesign API credentials
const customerId = "1D0C4D6D-48D8-40A2-BD9D-CE2160F6B3E9";
const apiKey =
  "BQXK2DGbESmYMvO0JC2sNAd9AtOTh48AwaPZIWL7bd8o8mB63TjwAJ/BhNxO3/YD6pjjZFQR5j6Ke1wEA1TCew==";
const smsEndpoint = `https://rest-api.telesign.com/v1/messaging`;

// ============================================================================
// HELPER FUNCTIONS (from tracking-service.controller.js)
// ============================================================================

// Helper function to update worker action
const updateWorkerAction = async (workerId, encodedId, screen) => {
  try {
    console.log("updateWorkerAction called with:", {
      workerId,
      encodedId,
      screen,
    });

    const params = JSON.stringify({ encodedId });
    console.log("Constructed params:", params);

    console.log("Executing SQL query:", authQueries.UPSERT_WORKER_ACTION);
    const result = await client.query(authQueries.UPSERT_WORKER_ACTION, [workerId, screen, params]);
    console.log("Query executed successfully. Result:", result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error("Error inserting worker action:", error);
  }
};

// Helper function to create user background action
const createUserBackgroundAction = async (
  userId,
  encodedId,
  screen,
  serviceBooked,
  userNotificationEncodedId = null
) => {
  try {
    // Prepare the new action object if 'screen' is provided
    const newAction = screen
      ? {
          screen,
          encodedId,
          serviceBooked,
        }
      : null;

    // Convert newAction to JSON string if it exists
    const newActionJson = newAction ? JSON.stringify(newAction) : null;

    // Prepare the initial track array for insertion
    const initialTrack = newAction
      ? JSON.stringify([newAction])
      : JSON.stringify([]);

    // Parameters for the query
    const params = [
      userId, // $1: user_id
      initialTrack, // $2: initial track array (JSONB)
      encodedId, // $3: encodedId to remove
      userNotificationEncodedId, // $4: userNotificationEncodedId to remove (can be null)
      newActionJson, // $5: newActionJson to check if not null
      newActionJson ? `[${newActionJson}]` : null, // $6: new action array to append
    ];

    console.log("Executing upsert query:", authQueries.UPSERT_USER_BACKGROUND_ACTION);
    console.log("With params:", params);

    // Execute the upsert query
    const result = await client.query(authQueries.UPSERT_USER_BACKGROUND_ACTION, params);
    console.log("Upsert successful:", result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error("Error creating/updating user background action:", error);
    throw error;
  }
};

// ============================================================================
// OTP FUNCTIONS
// ============================================================================

const WorkerSendOtp = (req, res) => {
  const { mobileNumber } = req.body;
  if (!mobileNumber) {
    return res.status(400).json({ message: "Mobile number is required" });
  }

  const options = {
    method: "POST",
    url: `https://cpaas.messagecentral.com/verification/v3/send?countryCode=91&customerId=${process.env.WORKER_CUSTOMER_ID}&flowType=SMS&mobileNumber=${mobileNumber}`,
    headers: {
      authToken:
        "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLTI0OEY5ODhBOUQ5QzQzOCIsImlhdCI6MTc0NTY4Mjk3NywiZXhwIjoxOTAzMzYyOTc3fQ.9-y_44egQuG0MuLs08d7gLWKxkSGW8ldsceKotcrTzP8Dl2XqrSXZGpVtkPJQAL-LJ-HCTPnab1FVHn-A_IJRA",
    },
  };

  request(options, (error, response, body) => {
    if (error) {
      console.error("Error sending OTP:", error);
      return res.status(500).json({ message: "Error sending OTP", error });
    }
    try {
      const data = JSON.parse(body);
      if (data && data.data && data.data.verificationId) {
        return res.status(200).json({
          message: "OTP sent successfully",
          verificationId: data.data.verificationId,
        });
      } else {
        return res.status(500).json({
          message: "Failed to retrieve verificationId",
          error: data,
        });
      }
    } catch (parseError) {
      console.error("Error parsing OTP response:", parseError);
      return res
        .status(500)
        .json({ message: "Failed to parse response", error: parseError });
    }
  });
};

const WorkerValidateOtp = (req, res) => {
  const { mobileNumber, verificationId, otpCode } = req.query;
  if (!mobileNumber || !verificationId || !otpCode) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  const options = {
    method: "GET",
    url: `https://cpaas.messagecentral.com/verification/v3/validateOtp?countryCode=91&mobileNumber=${mobileNumber}&verificationId=${verificationId}&customerId=${process.env.CUSTOMER_ID}&code=${otpCode}`,
    headers: {
      authToken:
        "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLUIzNzUzRUNBNDNCRDQzNSIsImlhdCI6MTcyNjI1OTQwNiwiZXhwIjoxODgzOTM5NDA2fQ.Gme6ijpbtUge-n9NpEgJR7lIsNQTqH4kDWkoe9Wp6Nnd6AE0jaAKCuuGuYtkilkBrcC1wCj8GrlMNQodR-Gelg",
    },
  };

  request(options, (error, response, body) => {
    if (error) {
      console.error("Error validating OTP:", error);
      return res.status(500).json({ message: "Error validating OTP", error });
    }
    try {
      const data = JSON.parse(body);
      if (
        data &&
        data.data &&
        data.data.verificationStatus === "VERIFICATION_COMPLETED"
      ) {
        return res.status(200).json({ message: "OTP Verified" });
      } else {
        return res.status(200).json({ message: "Invalid OTP" });
      }
    } catch (parseError) {
      console.error("Error parsing OTP validation response:", parseError);
      return res
        .status(500)
        .json({ message: "Failed to parse response", error: parseError });
    }
  });
};

const sendOtp = (req, res) => {
  const { mobileNumber } = req.body;
  if (!mobileNumber) {
    return res.status(400).json({ message: "Mobile number is required" });
  }

  const options = {
    method: "POST",
    url: `https://cpaas.messagecentral.com/verification/v3/send?countryCode=91&customerId=${process.env.CUSTOMER_ID}&flowType=SMS&mobileNumber=${mobileNumber}`,
    headers: {
      authToken:
        "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLUIzNzUzRUNBNDNCRDQzNSIsImlhdCI6MTcyNjI1OTQwNiwiZXhwIjoxODgzOTM5NDA2fQ.Gme6ijpbtUge-n9NpEgJR7lIsNQTqH4kDWkoe9Wp6Nnd6AE0jaAKCuuGuYtkilkBrcC1wCj8GrlMNQodR-Gelg",
    },
  };

  request(options, (error, response, body) => {
    if (error) {
      console.error("Error sending OTP:", error);
      return res.status(500).json({ message: "Error sending OTP", error });
    }
    try {
      const data = JSON.parse(body);
      if (data && data.data && data.data.verificationId) {
        return res.status(200).json({
          message: "OTP sent successfully",
          verificationId: data.data.verificationId,
        });
      } else {
        return res.status(500).json({
          message: "Failed to retrieve verificationId",
          error: data,
        });
      }
    } catch (parseError) {
      console.error("Error parsing OTP response:", parseError);
      return res
        .status(500)
        .json({ message: "Failed to parse response", error: parseError });
    }
  });
};

const partnerSendOtp = (req, res) => {
  const { mobileNumber } = req.body;
  if (!mobileNumber) {
    return res.status(400).json({ message: "Mobile number is required" });
  }

  const options = {
    method: "POST",
    url: `https://cpaas.messagecentral.com/verification/v3/send?countryCode=91&customerId=${process.env.WORKER_CUSTOMER_ID}&flowType=SMS&mobileNumber=${mobileNumber}`,
    headers: {
      authToken:
        "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLTI0OEY5ODhBOUQ5QzQzOCIsImlhdCI6MTc0NTY4Mjk3NywiZXhwIjoxOTAzMzYyOTc3fQ.9-y_44egQuG0MuLs08d7gLWKxkSGW8ldsceKotcrTzP8Dl2XqrSXZGpVtkPJQAL-LJ-HCTPnab1FVHn-A_IJRA",
    },
  };

  request(options, (error, response, body) => {
    if (error) {
      console.error("Error sending OTP:", error);
      return res.status(500).json({ message: "Error sending OTP", error });
    }
    try {
      const data = JSON.parse(body);
      if (data && data.data && data.data.verificationId) {
        return res.status(200).json({
          message: "OTP sent successfully",
          verificationId: data.data.verificationId,
        });
      } else {
        return res.status(500).json({
          message: "Failed to retrieve verificationId",
          error: data,
        });
      }
    } catch (parseError) {
      console.error("Error parsing OTP response:", parseError);
      return res
        .status(500)
        .json({ message: "Failed to parse response", error: parseError });
    }
  });
};

const partnerValidateOtp = (req, res) => {
  // Expecting mobileNumber, verificationId, and otpCode as query parameters
  const { mobileNumber, verificationId, otpCode } = req.query;
  if (!mobileNumber || !verificationId || !otpCode) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  const options = {
    method: "GET",
    url: `https://cpaas.messagecentral.com/verification/v3/validateOtp?countryCode=91&mobileNumber=${mobileNumber}&verificationId=${verificationId}&customerId=${process.env.WORKER_CUSTOMER_ID}&code=${otpCode}`,
    headers: {
      authToken:
        "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLTI0OEY5ODhBOUQ5QzQzOCIsImlhdCI6MTc0NTY4Mjk3NywiZXhwIjoxOTAzMzYyOTc3fQ.9-y_44egQuG0MuLs08d7gLWKxkSGW8ldsceKotcrTzP8Dl2XqrSXZGpVtkPJQAL-LJ-HCTPnab1FVHn-A_IJRA",
    },
  };

  request(options, (error, response, body) => {
    if (error) {
      console.error("Error validating OTP:", error);
      return res.status(500).json({ message: "Error validating OTP", error });
    }
    try {
      const data = JSON.parse(body);
      if (
        data &&
        data.data &&
        data.data.verificationStatus === "VERIFICATION_COMPLETED"
      ) {
        return res.status(200).json({ message: "OTP Verified" });
      } else {
        return res.status(200).json({ message: "Invalid OTP" });
      }
    } catch (parseError) {
      console.error("Error parsing OTP validation response:", parseError);
      return res
        .status(500)
        .json({ message: "Failed to parse response", error: parseError });
    }
  });
};

const validateOtp = (req, res) => {
  // Expecting mobileNumber, verificationId, and otpCode as query parameters
  const { mobileNumber, verificationId, otpCode } = req.query;
  if (!mobileNumber || !verificationId || !otpCode) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  const options = {
    method: "GET",
    url: `https://cpaas.messagecentral.com/verification/v3/validateOtp?countryCode=91&mobileNumber=${mobileNumber}&verificationId=${verificationId}&customerId=${process.env.CUSTOMER_ID}&code=${otpCode}`,
    headers: {
      authToken:
        "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLUIzNzUzRUNBNDNCRDQzNSIsImlhdCI6MTcyNjI1OTQwNiwiZXhwIjoxODgzOTM5NDA2fQ.Gme6ijpbtUge-n9NpEgJR7lIsNQTqH4kDWkoe9Wp6Nnd6AE0jaAKCuuGuYtkilkBrcC1wCj8GrlMNQodR-Gelg",
    },
  };

  request(options, (error, response, body) => {
    if (error) {
      console.error("Error validating OTP:", error);
      return res.status(500).json({ message: "Error validating OTP", error });
    }
    try {
      const data = JSON.parse(body);
      if (
        data &&
        data.data &&
        data.data.verificationStatus === "VERIFICATION_COMPLETED"
      ) {
        return res.status(200).json({ message: "OTP Verified" });
      } else {
        return res.status(200).json({ message: "Invalid OTP" });
      }
    } catch (parseError) {
      console.error("Error parsing OTP validation response:", parseError);
      return res
        .status(500)
        .json({ message: "Failed to parse response", error: parseError });
    }
  });
};

const workerVerifyOtp = async (req, res) => {
  const { notification_id, otp } = req.body;

  try {
    const { rows } = await client.query(authQueries.VERIFY_WORKER_OTP_AND_UPDATE, [notification_id, otp]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "OTP is incorrect or notification not found." });
    }

    const {
      user_navigation_cancel_status,
      user_id,
      service_booked,
      worker_id,
      fcm_tokens,
    } = rows[0];

    // If the user cancelled navigation, return HTTP 205
    if (user_navigation_cancel_status === "usercanceled") {
      return res
        .status(205)
        .json({ message: "User cancelled the navigation." });
    }

    // Kick off the timer
    await TimeStart(notification_id);

    // Send notifications if tokens exist
    const validTokens = fcm_tokens.filter(Boolean);
    if (validTokens.length) {
      try {
        const multicastMessage = {
          tokens: validTokens,
          notification: {
            title: "Click Solver",
            body: "The Commander has successfully verified the work. The time has started.",
          },
          data: {
            notification_id: notification_id.toString(),
            screen: "worktimescreen",
          },
        };
        const resp = await getMessaging().sendEachForMulticast(
          multicastMessage
        );
        resp.responses.forEach((r, i) => {
          if (!r.success) {
            console.error(`FCM error for ${validTokens[i]}:`, r.error);
          }
        });
      } catch (err) {
        console.error("Error sending notifications:", err);
      }
    } else {
      console.warn("No FCM tokens to send the message to.");
    }

    // Record background actions
    const screen = "worktimescreen";
    const encodedId = Buffer.from(notification_id.toString()).toString(
      "base64"
    );
    await createUserBackgroundAction(
      user_id,
      encodedId,
      screen,
      service_booked
    );
    await updateWorkerAction(worker_id, encodedId, screen);

    return res.status(200).json({ status: "Verification successful" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const verifyOTP = async (req, res) => {
  const { verificationCode } = req.body;
  // console.log(verificationCode)
  try {
    const sessionInfo = await admin.auth().verifyIdToken(verificationCode);

    res.status(200).send({ success: true, sessionInfo });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).send({ success: false, error: error.message });
  }
};

const sendSMSVerification = async (req, res) => {
  const { phoneNumber } = req.body;

  // Generate a random 6-digit verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000);
  const message = `Your verification code is ${verificationCode}`;

  const authString = Buffer.from(`${customerId}:${apiKey}`).toString("base64");

  try {
    // Send SMS using Telesign API
    const response = await axios.post(
      smsEndpoint,
      {
        phone_number: phoneNumber,
        message: message,
        message_type: "OTP",
      },
      {
        headers: {
          Authorization: `Basic ${authString}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // On success, return the verification code (for testing purposes)
    res.status(200).json({ success: true, verificationCode });
  } catch (error) {
    // On failure, log and return the error
    console.error(
      "Error sending SMS:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ success: false, message: "Error sending SMS" });
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  WorkerSendOtp,
  WorkerValidateOtp,
  sendOtp,
  partnerSendOtp,
  partnerValidateOtp,
  validateOtp,
  workerVerifyOtp,
  verifyOTP,
  sendSMSVerification,
};
