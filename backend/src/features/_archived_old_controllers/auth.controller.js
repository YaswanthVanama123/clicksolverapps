const admin = require("../../config/firebase.config.js");
const crypto = require("crypto");
const { encrypt, decrypt } = require("../../utils/encryption.util.js");
const { getMessaging } = require("firebase-admin/messaging");
const db = admin.firestore();
const client = require("../../database/connection");
const axios = require("axios");
var cron = require("node-cron");
const {
  generateToken,
  generateWorkerToken,
  generateAdminToken,
} = require("../../utils/token.util.js");
const request = require("request");

// Telesign API credentials
const customerId = "1D0C4D6D-48D8-40A2-BD9D-CE2160F6B3E9";
const apiKey =
  "BQXK2DGbESmYMvO0JC2sNAd9AtOTh48AwaPZIWL7bd8o8mB63TjwAJ/BhNxO3/YD6pjjZFQR5j6Ke1wEA1TCew==";
const smsEndpoint = `https://rest-api.telesign.com/v1/messaging`;

// ============================================================================
// CRON FUNCTIONS
// ============================================================================

const updateWorkerNoDueStatus = async () => {
  try {
    const updateQuery = `
      UPDATE workersverified wv
      SET no_due = CASE
        WHEN wl.balance_amount < -50 THEN FALSE  -- If balance is less than -50, set no_due to FALSE
        WHEN wl.balance_amount >= -50 THEN TRUE   -- If balance is -50 or higher, set no_due to TRUE
      END
      FROM workerlife wl
      WHERE wv.worker_id = wl.worker_id;
    `;

    const result = await client.query(updateQuery);
    console.log(`Updated ${result.rowCount} workers' no_due status at 10 AM.`);
  } catch (error) {
    console.error("Error updating no_due status:", error);
  }
};

cron.schedule(
  "0 10 * * *",
  () => {
    const now = new Date();
    console.log(
      `Job ran at ${now.toISOString()} (UTC) and ${now.toString()} (local time)`
    );
    updateWorkerNoDueStatus();
  },
  {
    timezone: "Asia/Kolkata",
  }
);

const sendDuePaymentNotifications = async () => {
  try {
    // Query to join workerlife and fcm to fetch workers having balance_amount < -50
    const query = `
      SELECT wl.worker_id, wl.balance_amount, f.fcm_token
      FROM workerlife wl
      INNER JOIN fcm f ON wl.worker_id = f.worker_id
      WHERE wl.balance_amount < -50;
    `;
    const result = await client.query(query);

    if (result.rows.length === 0) {
      console.log("No workers with due payments found.");
      return;
    }

    // Group rows by worker_id so that we can send one notification per worker
    const workerMap = new Map();
    for (const row of result.rows) {
      if (!workerMap.has(row.worker_id)) {
        workerMap.set(row.worker_id, {
          balance_amount: row.balance_amount,
          tokens: [row.fcm_token],
        });
      } else {
        workerMap.get(row.worker_id).tokens.push(row.fcm_token);
      }
    }

    // For each worker, build and send the notification message using sendEachForMulticast
    for (const [worker_id, data] of workerMap.entries()) {
      // Calculate the due amount (absolute value of negative balance)
      const dueAmount = Math.abs(data.balance_amount);

      // Build the notification message
      const message = {
        tokens: data.tokens,
        notification: {
          title: "Payment Due",
          body: `Hi, Your payment of ${dueAmount} rupees needs to be paid by 10 AM. If not, you will not receive services until you pay.`,
        },
        data: {
          worker_id: worker_id.toString(),
          dueAmount: dueAmount.toString(),
        },
      };

      try {
        // Send notification using sendEachForMulticast
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(
          `Notification sent to worker ${worker_id} (Tokens: ${data.tokens.join(
            ", "
          )})`
        );
        response.responses.forEach((resp, index) => {
          if (!resp.success) {
            console.error(
              `Error sending to token ${data.tokens[index]}: `,
              resp.error
            );
          }
        });
      } catch (error) {
        console.error(
          `Error sending notification to worker ${worker_id}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("Error fetching workers with due payments:", error);
  }
};

cron.schedule(
  "0 8 * * *",
  () => {
    console.log("Running due payment notification job at 8 AM");
    sendDuePaymentNotifications();
  },
  {
    timezone: "Asia/Kolkata",
  }
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const sendLogoutNotificationAndDeleteTokens = async (workerId) => {
  try {
    // Fetch all FCM tokens for the worker
    const fcmQuery = "SELECT fcm_token FROM fcm WHERE worker_id = $1";
    const fcmResult = await client.query(fcmQuery, [workerId]);

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
    await client.query("DELETE FROM fcm WHERE worker_id = $1", [workerId]);
    console.log(`Deleted all FCM tokens for worker_id: ${workerId}`);
  } catch (error) {
    console.error(
      "Error sending logout notification or deleting FCM tokens:",
      error
    );
  }
};

const getUserByPhoneNumber = async (phone_number) => {
  try {
    const query =
      'SELECT user_id, name, phone_number FROM "user" WHERE phone_number = $1';
    const result = await client.query(query, [phone_number]);

    return result.rows.length ? result.rows[0] : null;
  } catch (error) {
    console.error("Error fetching user by phone number:", error);
    throw new Error("Database query failed");
  }
};

// ============================================================================
// LOGOUT FUNCTIONS
// ============================================================================

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
    const result = await client.query("DELETE FROM fcm WHERE fcm_token = $1", [
      fcm_token,
    ]);

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
    const result = await client.query(
      "DELETE FROM userfcm WHERE fcm_token = $1",
      [fcm_token]
    );

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

// ============================================================================
// TOKEN VERIFICATION FUNCTIONS
// ============================================================================

const workerTokenVerification = async (req, res) => {
  try {
    const { pcsToken } = req.body;
    const worker_id = req.worker.id; // Ensure worker_id is being extracted correctly

    // Validate input
    if (!pcsToken || !worker_id) {
      return res.status(400).json({ message: "Missing pcsToken or worker_id" });
    }

    // Corrected SQL query with PostgreSQL syntax
    const query =
      "SELECT session_token FROM workersverified WHERE worker_id = $1";
    const result = await client.query(query, [worker_id]);

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
    const query = `
      WITH updated AS (
        UPDATE accepted
        SET
          verification_status = TRUE,
          time = jsonb_set(
            COALESCE(time, '{}'::jsonb),
            '{arrived}',
            to_jsonb(to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS'))
          )
        WHERE notification_id = $1
          AND pin = $2
        RETURNING
          user_id,
          user_navigation_cancel_status,
          service_booked,
          worker_id
      )
      SELECT
        u.user_navigation_cancel_status,
        u.user_id,
        u.service_booked,
        u.worker_id,
        COALESCE(ARRAY_AGG(f.fcm_token), '{}') AS fcm_tokens
      FROM updated u
      LEFT JOIN userfcm f
        ON f.user_id = u.user_id
      GROUP BY
        u.user_navigation_cancel_status,
        u.user_id,
        u.service_booked,
        u.worker_id;
    `;

    const { rows } = await client.query(query, [notification_id, otp]);

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
// ACCOUNT MANAGEMENT FUNCTIONS
// ============================================================================

const accountDelete = async (req, res) => {
  const workerId = req.user.id;
  console.log("worker", workerId);
  try {
    const query = `
      WITH track_data AS (
        SELECT COALESCE(
          (SELECT jsonb_array_length(track)
           FROM useraction
           WHERE user_id = $1
           LIMIT 1),
          0
        ) AS track_length
      ),
      update_query AS (
        UPDATE "user"
        SET phone_number = NULL
        WHERE user_id = $1
          AND (SELECT track_length FROM track_data) = 0
        RETURNING 1
      )
      SELECT json_build_object(
        'status', CASE WHEN EXISTS(SELECT 1 FROM update_query) THEN 200 ELSE 205 END,
        'message', CASE WHEN EXISTS(SELECT 1 FROM update_query)
                          THEN 'User phone number removed successfully.'
                          ELSE 'Account deletion not allowed due to existing track records.'
                     END
      ) AS result;
    `;

    const { rows } = await client.query(query, [workerId]);
    const result = rows[0].result;
    return res.status(result.status).json({ message: result.message });
  } catch (error) {
    console.error("Error in accountDelete:", error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
};

// ============================================================================
// LOGIN FUNCTIONS
// ============================================================================

const Partnerlogin = async (req, res) => {
  const { phone_number } = req.body;
  if (!phone_number) {
    return res.status(400).json({ message: "Phone number is required" });
  } else if (phone_number === "my name is veerappa") {
    return res.status(202).json({ message: "Internal server error" });
  }

  try {
    // Query to check for worker existence in verified and non-verified tables
    const query = `
      WITH workersverified_check AS (
        SELECT worker_id FROM workersverified WHERE phone_number = $1 LIMIT 1
      ),
      workers_check AS (
        SELECT worker_id FROM workers WHERE phone_number = $1 LIMIT 1
      )
      SELECT
        CASE
          WHEN EXISTS (SELECT 1 FROM workersverified_check) THEN 200
          WHEN EXISTS (SELECT 1 FROM workers_check) THEN 201
          ELSE 400
        END AS status_code,
        COALESCE(
          (SELECT worker_id FROM workersverified_check),
          (SELECT worker_id FROM workers_check)
        ) AS worker_id,
        EXISTS (SELECT 1 FROM workers_check) AS step1,
        EXISTS (SELECT 1 FROM workerskills WHERE worker_id = (SELECT worker_id FROM workers_check)) AS step2,
        EXISTS (SELECT 1 FROM bank_accounts WHERE worker_id = (SELECT worker_id FROM workers_check)) AS step3;
    `;
    const result = await client.query(query, [phone_number]);
    const statusCode = result.rows[0].status_code;
    const workerId = result.rows[0].worker_id;
    const stepsCompleted =
      result.rows[0].step1 && result.rows[0].step2 && result.rows[0].step3;

    if (workerId) {
      // Generate a new session token for the worker
      const token = generateWorkerToken({ worker_id: workerId });

      // Update the session token in the database
      await client.query(
        "UPDATE workersverified SET session_token = $1 WHERE worker_id = $2",
        [token, workerId]
      );

      // Optionally, send a logout notification and remove any existing FCM tokens
      await sendLogoutNotificationAndDeleteTokens(workerId);

      if (statusCode === 200) {
        res.cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "Strict",
        });
        return res.status(200).json({ token, workerId });
      } else if (statusCode === 201) {
        res.cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "Strict",
        });
        return res.status(201).json({
          message: "Phone number found in workers, please complete sign up",
          token,
          workerId,
          stepsCompleted,
        });
      }
    } else {
      return res
        .status(203)
        .json({ message: "Phone number not registered", phone_number });
    }
  } catch (error) {
    console.error("Error logging in worker:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const adminLogin = async (req, res) => {
  const { phone_number } = req.query;

  if (!phone_number) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  if (phone_number === "9392365494") {
    // Generate admin token
    const token = generateAdminToken();

    // Send the token in the response
    return res.status(200).json({ token });
  } else {
    return res.status(205).json({ message: "Invalid credentials" });
  }
};

const login = async (req, res) => {
  const { phone_number } = req.body;
  console.log("phonenumber", phone_number);
  if (!phone_number) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  try {
    // Find the user by phone number
    const user = await getUserByPhoneNumber(phone_number);
    console.log("user there are not ", user);
    if (user) {
      // Generate a token for the user
      const token = generateToken(user);
      // Set token as an HTTP-only cookie (for web) or return it in the JSON response
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
      });
      return res.status(200).json({ token });
    } else {
      console.log("user there are not there 205");
      // Use status 205 (or an alternative status) to indicate that the user does not exist
      return res.status(205).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ============================================================================
// AUTHENTICATION & STATUS FUNCTIONS
// ============================================================================

const workerAuthentication = async (req, res) => {
  const workerId = req.worker.id;
  try {
    if (workerId) {
      return res.status(200).json({ success: true });
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Worker not authenticated" });
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const loginStatus = async (req, res) => {
  const id = req.user.id;
  try {
    const result = await client.query(
      'SELECT * FROM "user" WHERE user_id = $1',
      [id]
    );

    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  } catch (err) {
    console.error(`Error fetching user with ID ${id}:`, err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const checkOnboardingStatus = async (req, res) => {
  const worker_id = req.worker.id;

  try {
    const { rows } = await client.query(
      "SELECT onboarding_status FROM workersverified WHERE worker_id = $1",
      [worker_id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Worker not found" });
    }

    res.status(200).json({ onboarding_status: rows[0].onboarding_status });
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const registrationStatus = async (req, res) => {
  const workerId = req.worker.id;

  try {
    const result = await client.query(
      "SELECT skill_id FROM workerskills WHERE worker_id = $1",
      [workerId]
    );
    // console.log(result.rows.length)
    if (result.rows.length === 0) {
      return res.status(204).json({ message: "worker not found" });
    } else {
      return res.status(200).json(result.rows);
    }
  } catch (error) {
    console.error("Error updating skill registration:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Cron functions
  updateWorkerNoDueStatus,
  sendDuePaymentNotifications,

  // Helper functions
  sendLogoutNotificationAndDeleteTokens,

  // Logout functions
  workerLogout,
  userLogout,

  // Token verification
  workerTokenVerification,

  // OTP functions
  WorkerSendOtp,
  WorkerValidateOtp,
  sendOtp,
  partnerSendOtp,
  partnerValidateOtp,
  validateOtp,
  workerVerifyOtp,
  verifyOTP,
  sendSMSVerification,

  // Account management
  accountDelete,

  // Login functions
  Partnerlogin,
  adminLogin,
  login,

  // Authentication & status
  workerAuthentication,
  loginStatus,
  checkOnboardingStatus,
  registrationStatus,
};
