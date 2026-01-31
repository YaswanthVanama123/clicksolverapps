const admin = require("../../../config/firebase.config.js");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const { encrypt, decrypt } = require("../../../utils/encrytion.js");
const { getMessaging } = require("firebase-admin/messaging");
const db = admin.firestore();
const client = require("../../../../connection.js");
const axios = require("axios");
var cron = require("node-cron");
const {
  generateToken,
  generateWorkerToken,
  generateAdminToken,
} = require("../../../utils/generateToken.js");
const { response } = require("express");
const request = require("request");
const { off, constrainedMemory } = require("process");
const { v4: uuidv4 } = require("uuid");

// Telesign API credentials
const customerId = "1D0C4D6D-48D8-40A2-BD9D-CE2160F6B3E9";
const apiKey =
  "BQXK2DGbESmYMvO0JC2sNAd9AtOTh48AwaPZIWL7bd8o8mB63TjwAJ/BhNxO3/YD6pjjZFQR5j6Ke1wEA1TCew==";
const smsEndpoint = `https://rest-api.telesign.com/v1/messaging`;

const subscriptionKey =
  "1rFYPImsvNSHdC4MqvEUBYCUdJNaiCOAObvtk2N6fGhJ3BtIItNxJQQJ99BCACGhslBXJ3w3AAAbACOGxFd0";
const region = "centralindia";
const endpoint = "https://api.cognitive.microsofttranslator.com";
const apiVersion = "3.0";

// Initialize Razorpay
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

// FCM Constants
const MAX_WORKER_IDS = 5000;
const MAX_TOTAL_TOKENS = 50000;
const DB_PAGE_SIZE = 1000;
const FCM_CHUNK_SIZE = 500;

// Helper function to chunk arrays
function toChunks(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

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

    console.log("Final Number (Masked or Worker’s):", responseData);

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

    console.log("Final Number (Masked or Worker’s):", responseData);

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

const workerCompleteSignUp = async (req, res) => {
  const { fullName, email = null, phoneNumber } = req.body; // Email defaults to null

  if (!phoneNumber) {
    return res.status(400).json({
      message: "No phone number found. Please start the login process again.",
    });
  }

  try {
    // Step 1: Create a contact in Razorpay
    const contactPayload = {
      name: fullName,
      email: email || undefined, // Avoid sending null to Razorpay
      contact: phoneNumber,
      type: "employee",
    };

    const razorpayResponse = await axios.post(
      "https://api.razorpay.com/v1/contacts",
      contactPayload,
      {
        auth: {
          username: process.env.RAZORPAY_KEY,
          password: process.env.RAZORPAY_SECRET,
        },
        headers: { "Content-Type": "application/json" },
      }
    );

    // Extract the contact_id from the Razorpay response
    const contact_id = razorpayResponse.data.id;

    // Step 2: Insert the worker and store the contact_id in the database
    const insertWorkerQuery = `
      INSERT INTO workers (phone_number, name, email, contact_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const result = await client.query(insertWorkerQuery, [
      phoneNumber,
      fullName,
      email,
      contact_id,
    ]);

    const worker = result.rows[0];
    const token = generateWorkerToken(worker);

    return res.status(200).json({
      token,
      contact_id,
      message: "Sign up complete",
    });
  } catch (error) {
    console.error(
      "Error completing sign up:",
      error.response?.data || error.message
    );
    return res.status(500).json({
      message: "Internal server error",
      error: error.response?.data || error.message,
    });
  }
};

const getServicesPhoneNumber = async (req, res) => {
  // Extract serviceTitle from the body of the POST request
  const worker_id = req.worker.id;

  try {
    // Query to select rows from "services" table where "service_title" matches the provided value
    const query = `
        SELECT sc.*, (
            SELECT array_agg(w.phone_number)
            FROM workers w
            WHERE w.worker_id = $1  -- Use parameterized query for security
        ) AS phone_numbers
        FROM "servicecategories" sc;
    `;
    const result = await client.query(query, [worker_id]);

    // Return the rows that match the query
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching services:", err);
    res.status(500).send("Internal Server Error");
  }
};

const getServicesRegisterPhoneNumber = async (req, res) => {
  // Extract serviceTitle from the body of the POST request
  const worker_id = req.worker.id;

  try {
    // Query to select rows from "services" table where "service_title" matches the provided value
    const query = `
        SELECT sc.*, (
            SELECT array_agg(w.phone_number)
            FROM workersverified w
            WHERE w.worker_id = $1  -- Use parameterized query for security
        ) AS phone_numbers
        FROM "servicecategories" sc;
    `;
    const result = await client.query(query, [worker_id]);

    // Return the rows that match the query
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching services:", err);
    res.status(500).send("Internal Server Error");
  }
};

const getWorkerDetails = async (req, res) => {
  const { notification_id } = req.body;
  try {
    const query = `
      SELECT 
          accepted.service_booked, 
          accepted.discount,
          accepted.total_cost,
          workersverified.name, 
          usernotifications.area, 
          usernotifications.city, 
          usernotifications.pincode,
          workerskills.profile -- Assuming 'profile' is the correct column name in 'workerskills'
      FROM 
          accepted
      INNER JOIN 
          workersverified ON accepted.worker_id = workersverified.worker_id
      INNER JOIN 
          usernotifications ON accepted.user_notification_id = usernotifications.user_notification_id
      INNER JOIN 
          workerskills ON accepted.worker_id = workerskills.worker_id
      WHERE 
          accepted.notification_id = $1;
    `;

    const result = await client.query(query, [notification_id]);

    if (result.rows.length === 0) {
      return res.json({
        error: "No worker details found for the provided notification ID.",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching worker details:", error);
    return res.json({
      error: "An error occurred while fetching worker details.",
    });
  }
};

const sendNotificationsToWorkers = async (req, res) => {
  let { worker_ids: workerIds, title, body, data } = req.body;

  // 1) Validate input early
  if (!Array.isArray(workerIds) || workerIds.length === 0) {
    return res
      .status(400)
      .json({ message: "worker_ids (non-empty array) is required." });
  }
  workerIds = [...new Set(workerIds.map(Number).filter(Number.isInteger))];
  if (workerIds.length === 0) {
    return res
      .status(400)
      .json({ message: "worker_ids must contain integers." });
  }
  if (workerIds.length > MAX_WORKER_IDS) {
    return res
      .status(413)
      .json({
        message: `Too many worker_ids. Max allowed is ${MAX_WORKER_IDS}.`,
      });
  }

  title = title ?? "New update from Click Solver";
  body = body ?? "You have a new notification.";
  data = Object.fromEntries(
    Object.entries(data ?? {}).map(([k, v]) => [String(k), String(v)])
  );

  // 2) Tight base payload (use data-only by removing "notification" block if desired)
  const basePayload = {
    notification: { title, body },
    data,
    android: { priority: "high" },
    apns: {
      headers: { "apns-priority": "10" },
      payload: { aps: { sound: "default" } },
    },
  };

  // 3) Page through tokens to keep memory low
  //    NOTE: Add this unique index in DB to avoid DISTINCT:
  //    CREATE UNIQUE INDEX IF NOT EXISTS ux_workerfcm_worker_token ON workerfcm(worker_id, fcm_token);
  const tokensSql = `
    SELECT fcm_token
    FROM workerfcm
    WHERE worker_id = ANY($1::int[])
      AND is_active = TRUE
      AND fcm_token IS NOT NULL
      AND fcm_token <> ''
    ORDER BY worker_id, fcm_token
    LIMIT $2 OFFSET $3
  `;

  let offset = 0;
  let grandTotal = 0;
  let successCount = 0;
  let failureCount = 0;
  const perPageSummaries = [];

  try {
    while (true) {
      const { rows } = await client.query(tokensSql, [
        workerIds,
        DB_PAGE_SIZE,
        offset,
      ]);
      if (rows.length === 0) break;

      const pageTokens = rows.map((r) => r.fcm_token);
      grandTotal += pageTokens.length;

      if (grandTotal > MAX_TOTAL_TOKENS) {
        return res.status(413).json({
          message: `Aborting: total tokens exceed cap (${MAX_TOTAL_TOKENS}).`,
          scannedTokens: grandTotal,
        });
      }

      // 4) FCM chunking per page
      let pageSuccess = 0;
      let pageFailure = 0;
      const pageErrors = [];

      for (const chunk of toChunks(pageTokens, FCM_CHUNK_SIZE)) {
        const resp = await getMessaging().sendEachForMulticast({
          ...basePayload,
          tokens: chunk,
        });

        pageSuccess += resp.successCount;
        pageFailure += resp.failureCount;

        // gather token-level errors (only when needed)
        resp.responses.forEach((r, idx) => {
          if (!r.success) {
            pageErrors.push({
              token: chunk[idx],
              code: r.error?.code,
              message: r.error?.message,
            });
          }
        });

        // yield event loop between bursts to keep server responsive
        await new Promise((r) => setImmediate(r));
      }

      successCount += pageSuccess;
      failureCount += pageFailure;
      perPageSummaries.push({
        pageSize: rows.length,
        success: pageSuccess,
        failure: pageFailure,
        errorsSample: pageErrors.slice(0, 10), // include a small sample to keep response light
      });

      offset += DB_PAGE_SIZE;
    }

    return res.status(200).json({
      message: "Notifications processed.",
      totalTokens: grandTotal,
      successCount,
      failureCount,
      pages: perPageSummaries.length,
      perPageSummaries,
    });
  } catch (err) {
    console.error("sendNotificationsToWorkers error:", err);
    return res
      .status(500)
      .json({
        message: "Internal Server Error.",
        error: err?.message ?? String(err),
      });
  }
};

const workerProfileScreenDetails = async (req, res) => {
  const workerId = req.worker.id;
  // console.log(userId);

  try {
    const query = `
    SELECT w.name, w.email, w.phone_number, ws.profile
    FROM workersverified w
    LEFT JOIN workerskills ws ON w.worker_id = ws.worker_id
    WHERE w.worker_id = $1;
  `;

    // Execute the query with the userId as a parameter
    const result = await client.query(query, [workerId]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({
          message: "No worker details found for the provided worker ID.",
        });
    }

    const { name, email, phone_number, profile } = result.rows[0];

    // Return the result
    return res.json({ name, email, phone_number, profile });
  } catch (error) {
    console.error("Error fetching worker details:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching worker details." });
  }
};

const profileChangesSubmit = async (req, res) => {
  const { formData, selectedStatus } = req.body;

  console.log("Received formData:", formData);
  console.log("Received selectedStatus:", selectedStatus);

  // Ensure we get a string value for selectedStatus
  const statusValue =
    typeof selectedStatus === "object" && selectedStatus.selectedStatus
      ? selectedStatus.selectedStatus
      : selectedStatus;
  console.log("Using selectedStatus value:", statusValue);

  // Extract data from formData
  const workerId = req.worker.id;
  console.log("Worker ID:", workerId);
  const profileImageUri = formData.profileImageUri;
  const proofImageUri = formData.proofImageUri;
  const serviceCategory = formData.skillCategory;
  const subskillArray = formData.subSkills; // Assuming this is an array
  const personalDetails = {
    lastName: formData.lastName,
    firstName: formData.firstName,
    gender: formData.gender,
    workExperience: formData.workExperience,
    dob: formData.dob,
    education: formData.education,
  };
  const address = {
    doorNo: formData.doorNo,
    landmark: formData.landmark,
    city: formData.city,
    district: formData.district,
    state: formData.state,
    pincode: formData.pincode,
  };

  try {
    // One multi-statement query using a CTE:
    // 1. Upsert the workerskills row and return worker_id.
    // 2. Update the workers table's issues array for matching category.
    const query = `
      WITH upsert AS (
        INSERT INTO workerskills 
          (worker_id, profile, proof, service, subservices, personalDetails, address)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (worker_id) DO UPDATE
          SET
            profile = EXCLUDED.profile,
            proof = EXCLUDED.proof,
            service = EXCLUDED.service,
            subservices = EXCLUDED.subservices,
            personalDetails = EXCLUDED.personalDetails,
            address = EXCLUDED.address
        RETURNING worker_id
      ),
      update_issues AS (
        UPDATE workers
        SET issues = (
          SELECT jsonb_agg(
            CASE
              WHEN i->>'category' = $8 THEN jsonb_set(i, '{status}', '"changed"')
              ELSE i
            END
          )
          FROM jsonb_array_elements(issues) AS i
        )
        WHERE worker_id = (SELECT worker_id FROM upsert)
        RETURNING *
      )
      SELECT * FROM update_issues;
    `;

    const values = [
      workerId,
      profileImageUri,
      proofImageUri,
      serviceCategory,
      subskillArray,
      personalDetails,
      address,
      statusValue, // Use the extracted string value here
    ];

    console.log("Executing query with values:", values);
    const result = await client.query(query, values);
    console.log(
      "CTE query executed successfully. Update result:",
      JSON.stringify(result.rows, null, 2)
    );

    // Send success response along with the updated data for debugging
    res
      .status(200)
      .json({ message: "Registration successful", updatedData: result.rows });
  } catch (error) {
    console.error(
      "Error inserting/updating workerskills or updating issues in workers table:",
      error
    );
    res.status(500).json({ message: "Error registering worker", error });
  }
};

const registrationSubmit = async (req, res) => {
  const formData = req.body;
  // Extract data from formData
  const workerId = req.worker.id;
  const profileImageUri = formData.profileImageUri;
  const proofImageUri = formData.proofImageUri;
  const serviceCategory = formData.skillCategory;
  // console.log(profileImageUri,proofImageUri,serviceCategory,formData)
  const subskillArray = formData.subSkills; // Assuming this is an array
  const personalDetails = {
    lastName: formData.lastName,
    firstName: formData.firstName,
    gender: formData.gender,
    workExperience: formData.workExperience,
    dob: formData.dob,
    education: formData.education,
  };
  const address = {
    doorNo: formData.doorNo,
    landmark: formData.landmark,
    city: formData.city,
    district: formData.district,
    state: formData.state,
    pincode: formData.pincode,
  };

  try {
    // SQL query to insert into workerskill table with conflict resolution
    const query = `
          INSERT INTO workerskills (worker_id, profile, proof, service, subservices, personalDetails, address)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (worker_id) DO UPDATE
          SET
              profile = EXCLUDED.profile,
              proof = EXCLUDED.proof,
              service = EXCLUDED.service,
              subservices = EXCLUDED.subservices,
              personalDetails = EXCLUDED.personalDetails,
              address = EXCLUDED.address
      `;

    const values = [
      workerId,
      profileImageUri,
      proofImageUri,
      serviceCategory,
      subskillArray, // Ensure this is compatible with your database schema
      personalDetails,
      address,
    ];

    // Execute the query
    await client.query(query, values);

    // Send success response
    res.status(200).json({ message: "Registration successful" });
  } catch (error) {
    console.error(
      "Error inserting or updating data in workerskill table:",
      error
    );
    res.status(500).json({ message: "Error registering worker", error });
  }
};

const addBankAccount = async (req, res) => {
  const bankAccountDetails = req.body;
  const workerId = req.worker.id;
  const bankName = bankAccountDetails.bank;
  const accountNumber = bankAccountDetails.accountNumber;
  const ifscCode = bankAccountDetails.ifscCode;
  const accountHolderName = bankAccountDetails.accountHolderName;

  if (!bankName || !accountNumber || !ifscCode || !accountHolderName) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Call Razorpay API to verify the bank account details.
    // Using the assumed correct endpoint: /v1/bank_accounts/validate
    const razorpayResponse = await axios.post(
      "https://api.razorpay.com/v1/bank_accounts/validate",
      { account_number: accountNumber, ifsc: ifscCode },
      {
        auth: {
          username: process.env.RAZORPAY_KEY,
          password: process.env.RAZORPAY_SECRET,
        },
      }
    );

    // If Razorpay returns a valid response, consider it verified.
    const verificationResult = razorpayResponse.data;
    console.log("Verification result:", verificationResult);

    // Encrypt sensitive fields
    const encryptedAccountNumber = encrypt(accountNumber);
    const encryptedIfscCode = encrypt(ifscCode);

    // Insert or update the bank account details in the database
    const query = `
      INSERT INTO bankaccounts (worker_id, bank_name, account_number, ifsc_code, account_holder_name, status)
      VALUES ($1, $2, $3, $4, $5, 'verified')
      ON CONFLICT (worker_id) DO UPDATE
      SET
        bank_name = EXCLUDED.bank_name,
        account_number = EXCLUDED.bank_name,  -- Ensure you update with the encrypted value
        ifsc_code = EXCLUDED.ifsc_code,
        account_holder_name = EXCLUDED.account_holder_name,
        status = 'verified',
        updated_at = NOW();
    `;

    const values = [
      workerId,
      bankName,
      encryptedAccountNumber,
      encryptedIfscCode,
      accountHolderName,
    ];

    await client.query(query, values);

    res.status(200).json({
      message: "Bank account verified and added successfully",
      bank_details: verificationResult,
    });
  } catch (error) {
    console.error(
      "Error inserting or updating bank account:",
      error.response?.data || error.message
    );
    res.status(500).json({
      message: "Error adding account",
      error: error.response?.data || error.message,
    });
  }
};

const createFundAccount = async (req, res) => {
  try {
    // Get worker id from authentication middleware (assumed to be set on req.worker)
    const { id: worker_id } = req.worker;
    // Get bank account details from the request body
    const { name, ifsc, account_number, bank_name } = req.body;

    // Validate required fields (you can add further validation as needed)
    if (!name || !ifsc || !account_number || !bank_name) {
      return res
        .status(400)
        .json({ message: "All bank account details are required." });
    }

    // Fetch the worker's Razorpay contact_id from your workers table.
    // (Assume that during signup, a contact_id was created and stored.)
    const contactQuery = "SELECT contact_id FROM workers WHERE worker_id = $1";
    const contactResult = await client.query(contactQuery, [worker_id]);
    if (contactResult.rows.length === 0 || !contactResult.rows[0].contact_id) {
      return res
        .status(400)
        .json({
          message: "Contact ID not found. Create a Razorpay contact first.",
        });
    }
    const contact_id = contactResult.rows[0].contact_id;

    // Build the payload as per Razorpay's Create Fund Account API
    const payload = {
      contact_id,
      account_type: "bank_account",
      bank_account: { name, ifsc, account_number },
    };

    // Call Razorpay's Fund Account API
    const razorpayResponse = await axios.post(
      "https://api.razorpay.com/v1/fund_accounts",
      payload,
      {
        auth: {
          username: process.env.RAZORPAY_KEY,
          password: process.env.RAZORPAY_SECRET,
        },
        headers: { "Content-Type": "application/json" },
      }
    );

    // Extract the fund_account_id from Razorpay's response
    const { id: fund_account_id } = razorpayResponse.data;

    // Encrypt sensitive data (e.g. account_number)
    const encryptedAccountNumber = encrypt(account_number);

    // Insert or update the fund account details in your bank_accounts table
    const query = `
      INSERT INTO bank_accounts (worker_id, contact_id, fund_account_id, bank_name, ifsc_code, account_number, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'verified')
      ON CONFLICT (worker_id) DO UPDATE
      SET contact_id = EXCLUDED.contact_id,
          fund_account_id = EXCLUDED.fund_account_id,
          bank_name = EXCLUDED.bank_name,
          ifsc_code = EXCLUDED.ifsc_code,
          account_number = EXCLUDED.account_number,
          status = 'verified',
          updated_at = NOW();
    `;
    const values = [
      worker_id,
      contact_id,
      fund_account_id,
      bank_name,
      ifsc,
      encryptedAccountNumber,
    ];
    await client.query(query, values);

    res.status(200).json({
      success: true,
      message: "Bank account verified and added successfully",
      fund_account_id,
      contact_id,
    });
  } catch (error) {
    console.error(
      "Error creating fund account:",
      error.response?.data || error.message
    );
    res.status(500).json({
      success: false,
      message: "Error adding bank account",
      error: error.response?.data || error.message,
    });
  }
};

const addUpiId = async (req, res) => {
  const workerId = req.worker.id;
  const upiId = req.body.upi_id; // Ensure you're extracting the upi_id from the request body
  // console.log(workerId,req.body)
  try {
    // SQL query to insert into bankaccounts table with conflict resolution
    const query = `
      INSERT INTO bankaccounts (worker_id, upi_id)
      VALUES ($1, $2)
      ON CONFLICT (worker_id) DO UPDATE
      SET
        upi_id = EXCLUDED.upi_id
    `; // Removed the trailing comma

    const values = [workerId, upiId];

    // Execute the query
    await client.query(query, values);

    // Send success response
    res.status(201).json({ message: "Bank account added successfully" });
  } catch (error) {
    console.error(
      "Error inserting or updating data in bank account table:",
      error
    );
    res.status(500).json({ message: "Error adding account", error });
  }
};

const onboardingSteps = async (req, res) => {
  const workerId = req.worker.id; // Get the worker ID from the request object
  try {
    // Query to check existence in workers, workerskills, bank_accounts, and upi_accounts
    const query = `
      SELECT 
        EXISTS (SELECT 1 FROM workers WHERE worker_id = $1) AS step1,
        EXISTS (SELECT 1 FROM workerskills WHERE worker_id = $1) AS step2,
        EXISTS (SELECT 1 FROM bank_accounts WHERE worker_id = $1) AS bankAccount,
        EXISTS (SELECT 1 FROM upi_accounts WHERE worker_id = $1) AS upiId
    `;

    const result = await client.query(query, [workerId]);

    // Extracting step results from the query response
    const { step1, step2, bankaccount, upiid } = result.rows[0];

    // Construct the response object
    const response = {
      step1,
      step2,
      bankAccount: bankaccount, // Step 3A: Bank Account
      upiId: upiid, // Step 3B: UPI ID
    };

    // Send response
    res.status(200).json({
      message: "Onboarding steps checked successfully",
      steps: response,
    });
  } catch (error) {
    console.error("Error checking onboarding steps:", error);
    res.status(500).json({ message: "Error checking onboarding steps", error });
  }
};

const validateAndSaveUPI = async (req, res) => {
  const { upi_id } = req.body;
  const workerId = req.worker.id;

  console.log("Received request with:", { workerId, upi_id });

  if (!upi_id) {
    return res.status(400).json({
      success: false,
      message: "UPI ID is required.",
    });
  }

  try {
    // Call Razorpay API to validate the UPI ID
    const razorpayResponse = await axios.post(
      "https://api.razorpay.com/v1/payments/validate/vpa",
      { vpa: upi_id },
      {
        auth: {
          username: process.env.RAZORPAY_KEY,
          password: process.env.RAZORPAY_SECRET,
        },
        headers: { "Content-Type": "application/json" },
      }
    );

    console.log("Razorpay Response:", razorpayResponse.data);

    const validationResponse = razorpayResponse.data;

    // Check if Razorpay validated the UPI ID successfully
    if (validationResponse.success) {
      // Save valid UPI ID to the database
      const query = `
        INSERT INTO upi_accounts (worker_id, upi_id, is_verified, razorpay_response)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (upi_id) DO UPDATE
        SET is_verified = EXCLUDED.is_verified, 
            razorpay_response = EXCLUDED.razorpay_response, 
            updated_at = CURRENT_TIMESTAMP
        RETURNING *;
      `;

      const values = [
        workerId,
        upi_id,
        true, // Mark as verified
        JSON.stringify(validationResponse), // Store Razorpay response as JSON
      ];

      const result = await client.query(query, values);
      console.log("UPI ID stored successfully:", result.rows[0]);

      return res.status(200).json({
        success: true,
        message: "UPI ID validated and stored successfully",
        data: result.rows[0],
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "UPI ID validation failed. Please check the UPI ID format.",
      });
    }
  } catch (error) {
    if (error.response) {
      console.error("Error response from Razorpay:", error.response.data);
      return res.status(error.response.status).json({
        success: false,
        message: "UPI ID validation failed",
        error: error.response.data,
      });
    } else {
      console.error("Error message:", error.message);
      return res.status(500).json({
        success: false,
        message: "UPI ID validation or storage failed",
        error: error.message,
      });
    }
  }
};

const getWorkerProfileDetails = async (req, res) => {
  const workerId = req.worker.id; // Assuming worker ID is passed as a URL parameter

  try {
    // Query to get worker profile details from workerskills and worker tables
    const query = `
    SELECT 
      ws.worker_id,
      ws.service,
      ws.proof,
      ws.profile,
      ws.subservices,
      COALESCE(wv.phone_number, w.phone_number) AS phone_number,
      ws.personaldetails,
      ws.address
    FROM 
      workerskills ws
    LEFT JOIN 
      workersverified wv ON ws.worker_id = wv.worker_id
    LEFT JOIN 
      workers w ON ws.worker_id = w.worker_id
    WHERE 
      ws.worker_id = $1;
  `;

    const result = await client.query(query, [workerId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Worker not found" });
    }

    // Send the response with worker details
    res.status(200).json(result.rows[0]); // Return a single worker's details
  } catch (error) {
    console.error("Error fetching worker profile details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const balanceAmmountToPay = async (req, res) => {
  const worker_id = req.worker.id; // Assuming worker_id is passed in the request parameters
  // console.log(worker_id)

  try {
    const result = await client.query(
      `
      SELECT 
        servicecall.payment, 
        servicecall.payment_type, 
        servicecall.notification_id, 
        servicecall.end_time, 
        "user".name,
        workerlife.balance_amount,
        workerlife.balance_payment_history
      FROM servicecall
      LEFT JOIN completenotifications 
        ON servicecall.notification_id = completenotifications.notification_id
      LEFT JOIN "user" 
        ON completenotifications.user_id = "user".user_id
      LEFT JOIN workerlife
        ON servicecall.worker_id = workerlife.worker_id
      WHERE servicecall.worker_id = $1 
        AND servicecall.payment IS NOT NULL
      `,
      [worker_id]
    );

    // If there are no records, return a message
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No payments found for this worker" });
    }

    // Return the found records
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching balance amount to pay:", err);
    res
      .status(500)
      .json({ error: "An error occurred while retrieving payments" });
  }
};

const getWorkerCashbackDetails = async (req, res) => {
  try {
    const { worker_id } = req.body; // Get worker_id from the request body
    console.log(worker_id);

    const query = `
      SELECT 
        servicecall.payment, 
        servicecall.payment_type, 
        servicecall.notification_id, 
        servicecall.end_time, 
        completenotifications.*, 
        "user".name,
        workerlife.cashback_history,
        workerlife.cashback_approved_times,
        workerlife.cashback_gain,
        (
          SELECT jsonb_agg(history)
          FROM jsonb_array_elements(workerlife.cashback_history) AS history
        ) AS cashback_history
      FROM servicecall
      LEFT JOIN completenotifications 
        ON servicecall.notification_id = completenotifications.notification_id
      LEFT JOIN "user" 
        ON completenotifications.user_id = "user".user_id
      LEFT JOIN workerlife 
        ON servicecall.worker_id = workerlife.worker_id
      WHERE servicecall.worker_id = $1 
        AND servicecall.payment IS NOT NULL;
    `;

    const values = [worker_id];
    const result = await client.query(query, values);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching worker cashback details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getWorkerBalanceDetails = async (req, res) => {
  try {
    const { worker_id } = req.body; // Get worker_id from the request body
    console.log(worker_id);

    const query = `
    SELECT 
      servicecall.payment, 
      servicecall.payment_type, 
      servicecall.notification_id, 
      "user".name,
      "user".phone_number,
      workerlife.cashback_history,
      workerlife.balance_payment_history  -- Updated field name (if applicable)
    FROM servicecall
    LEFT JOIN completenotifications 
      ON servicecall.notification_id = completenotifications.notification_id
    LEFT JOIN "user" 
      ON completenotifications.user_id = "user".user_id
    LEFT JOIN workerlife 
      ON servicecall.worker_id = workerlife.worker_id
    WHERE servicecall.worker_id = $1 
      AND servicecall.payment IS NOT NULL;
  `;

    const values = [worker_id];
    const result = await client.query(query, values);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching worker cashback details:", error);
    res.status(500).json({ error: "Internal Server Error" });
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

const workerApprove = async (req, res) => {
  const { workerId } = req.body;

  if (!workerId) {
    return res.status(400).json({ error: "workerId is required." });
  }

  try {
    // Single query with multiple CTEs:
    // 1. Delete from workers, returning worker details
    // 2. Insert the returned row into workersverified
    // 3. Insert the same worker_id into workerlife
    // 4. Finally, select fcm_token for that worker
    const query = `
      WITH moved_worker AS (
        DELETE FROM workers
        WHERE worker_id = $1
        RETURNING worker_id, name, email, phone_number, contact_id
      ),
      inserted_worker AS (
        INSERT INTO workersverified (worker_id, name, email, phone_number, contact_id)
        SELECT worker_id, name, email, phone_number, contact_id 
        FROM moved_worker
        RETURNING worker_id
      ),
      life_insert AS (
        INSERT INTO workerlife (worker_id)
        SELECT worker_id
        FROM inserted_worker
        RETURNING worker_id
      )
      SELECT fcm_token 
      FROM fcm
      WHERE worker_id IN (SELECT worker_id FROM inserted_worker);
    `;

    const result = await client.query(query, [workerId]);

    // If no rows returned, the worker wasn't found or is already verified
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Worker not found or already verified" });
    }

    // Extract tokens from the result
    const tokens = result.rows.map((row) => row.fcm_token);

    // If tokens exist, send a notification to the worker
    if (tokens.length > 0) {
      const message = {
        notification: {
          title: "Account Approved",
          body: "Your account is approved and now you are a family in ClickSolver!",
        },
        data: {
          screen: "ApprovalScreen",
          type: "account_approved",
          timestamp: new Date().toISOString(),
        },
        tokens: tokens,
      };

      try {
        // Using Firebase Admin SDK's sendEachForMulticast
        const response = await admin.messaging().sendEachForMulticast(message);
        response.responses.forEach((resp, index) => {
          if (!resp.success) {
            console.error(
              `Error sending to token ${tokens[index]}: `,
              resp.error
            );
          }
        });
        console.log("Notifications sent to user");
      } catch (err) {
        console.error("Error sending user notification:", err);
      }
    }

    return res
      .status(200)
      .json({
        message:
          "Worker approved, moved to workersverified, and added to workerlife.",
      });
  } catch (error) {
    console.error("Error in workerApprove:", error.message);
    return res
      .status(500)
      .json({ error: "An error occurred while approving the worker" });
  }
};

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

const workerCashbackPayed = async (req, res) => {
  const { worker_id, cashbackCount, cashbackPayed } = req.body;
  console.log(worker_id, cashbackPayed, cashbackCount);
  try {
    const currentTime = new Date().toISOString();

    const query = `
      WITH updated_worker AS (
        UPDATE workerlife
        SET cashback_gain = cashback_gain + $1,
            cashback_history = cashback_history || $2::jsonb
        WHERE worker_id = $3
        RETURNING cashback_gain, cashback_history
      )
      SELECT * FROM updated_worker;
    `;

    // Construct the new cashback history entry as a JSON object
    const newHistoryEntry = JSON.stringify([
      {
        amount: cashbackPayed,
        time: currentTime,
        paid: "Paid by Click Solver",
        count: cashbackCount,
        status: "success",
      },
    ]);

    // Execute the query with parameters
    const { rows } = await client.query(query, [
      cashbackCount,
      newHistoryEntry,
      worker_id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Worker not found" });
    }

    // Send the updated cashback information as response
    res.status(200).json({
      message: "Cashback updated successfully",
      cashback_gain: rows[0].cashback_gain,
      cashback_history: rows[0].cashback_history,
    });
  } catch (error) {
    console.error("Error updating cashback:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getWorkerProfleDetails = async (req, res) => {
  const workerId = req.worker.id;
  try {
    const query = `
      SELECT 
        w.phone_number, w.name, w.created_at,
        ws.profile, ws.proof, ws.service, ws.subservices
      FROM workerskills ws
      JOIN workersverified w ON ws.worker_id = w.worker_id
      WHERE ws.worker_id = $1
`;

    const { rows } = await client.query(query, [workerId]);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching worker profile:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching worker profile" });
  }
};

const getWorkerReviewDetails = async (req, res) => {
  const workerId = req.worker.id;
  try {
    const query = `
      SELECT 
        f.rating, 
        f.comment, 
        f.created_at, 
        ws.profile, 
        ws.service,
        w.name,
        u.name AS username,
        u.profile AS userImage,
        wl.average_rating
      FROM 
        feedback f
      JOIN 
        workersverified w ON f.worker_id = w.worker_id
      JOIN 
        workerskills ws ON ws.worker_id = w.worker_id
      JOIN 
        "user" u ON u.user_id = f.user_id
      JOIN 
        workerlife wl ON wl.worker_id = w.worker_id
      WHERE 
        f.worker_id = $1
      ORDER BY 
        f.created_at DESC;
    `;

    const { rows } = await client.query(query, [workerId]);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching worker reviews:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching worker reviews" });
  }
};

const getWorkerBookings = async (req, res) => {
  const workerId = req.worker.id;

  try {
    const query = `
    SELECT 
        n.notification_id,
        n.service_booked,
        n.created_at,
        n.total_cost,
        n.complete_status,
        w.name AS provider,
        ws.profile AS worker_profile
    FROM completenotifications n
    JOIN workersverified w ON n.worker_id = w.worker_id
    JOIN workerskills ws ON w.worker_id = ws.worker_id
    WHERE n.worker_id = $1
    ORDER BY n.created_at DESC
`;

    const { rows } = await client.query(query, [workerId]);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching user bookings" });
  }
};

const getWorkerOngoingBookings = async (req, res) => {
  console.log("called id");
  const workerId = req.worker.id;

  try {
    const query = `
    SELECT 
        n.notification_id,
        n.service_booked,
        n.created_at,
        n.total_cost,
        w.name AS provider
    FROM accepted n
    JOIN workersverified w ON n.worker_id = w.worker_id
    WHERE n.worker_id = $1
    ORDER BY n.created_at DESC
    `;

    const { rows } = await client.query(query, [workerId]);
    console.log("=roes ", rows[0]);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching user bookings" });
  }
};

const getWorkerNotifications = async (req, res) => {
  const workerId = req.worker.id;
  const fcmToken = req.query.fcmToken; // Access fcmToken from query parameters

  try {
    const result = await client.query(
      `
      SELECT title, body, encodedId, data, receivedat
      FROM workernotifications
      WHERE worker_id = $1 AND fcm_token = $2
      ORDER BY receivedat DESC
      LIMIT 10;
    `,
      [workerId, fcmToken]
    ); // Pass fcmToken as the second parameter

    const notifications = result.rows;
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

const storeNotification = async (req, res) => {
  const workerId = req.worker.id;
  const { fcmToken, notification } = req.body;
  const { title, body, data, receivedAt, userNotificationId } = notification;
  const { cost } = data;
  try {
    const result = await client.query(
      "INSERT INTO workernotifications (title, body, data, receivedat, worker_id, encodedid, fcm_token) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [title, body, cost, receivedAt, workerId, userNotificationId, fcmToken]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error storing notification:", err);
    res.status(500).send("Error storing notification");
  }
};

const createWorkerAction = async (req, res) => {
  const workerId = req.worker.id; // Assuming req.user contains the authenticated user's information
  const { encodedId, screen } = req.body;

  try {
    // Create the params object and convert it to JSON string
    const params = JSON.stringify({ encodedId });

    // Define the SQL query
    const query = `
      INSERT INTO workeraction (worker_id, screen_name, params)
      VALUES ($1, $2, $3)
      ON CONFLICT (worker_id) DO UPDATE
      SET params = $3, screen_name = $2
      RETURNING *;
    `;

    // Execute the query with the provided parameters
    const result = await client.query(query, [workerId, screen, params]);

    // The result should contain the updated or inserted row
    const userAction = result.rows[0];

    // Respond with the user action data
    res.json(userAction);
  } catch (error) {
    console.error("Error inserting user action:", error);
    res.status(500).json({ message: "Error inserting user action" });
  }
};

const getWorkerTrackRoute = async (req, res) => {
  const id = req.worker.id;
  try {
    // Query to select route and parameters based on user_id
    const query = `
    SELECT wv.name, wv.no_due, wa.screen_name, wa.params
    FROM workeraction wa
    JOIN workersverified wv ON wa.worker_id = wv.worker_id
    WHERE wa.worker_id = $1
  `;

    const result = await client.query(query, [id]);

    if (result.rows.length > 0) {
      const route = result.rows[0].screen_name;
      const parameter = result.rows[0].params;
      const name = result.rows[0].name;
      const no_due = result.rows[0].no_due;
      res.status(200).json({ route, parameter, name, no_due });
    } else {
      res
        .status(200)
        .json({ error: "No action found for the specified worker_id" });
    }
  } catch (err) {
    console.error(`Error fetching user with ID ${id}:`, err);
    throw err;
  }
};

const storeWorkerLocation = async (req, res) => {
  const { longitude, latitude, workerId } = req.body;

  try {
    const query = `
      INSERT INTO workerLocation (longitude, latitude, worker_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (worker_id)
      DO UPDATE SET longitude = EXCLUDED.longitude, latitude = EXCLUDED.latitude
    `;
    await client.query(query, [longitude, latitude, workerId]);

    res.status(200).json({ message: "User location stored successfully" });
  } catch (error) {
    console.error("Error storing user location:", error);
    res.status(500).json({ error: "Failed to store user location" });
  }
};

const updateWorkerLocation = async (req, res) => {
  const workerId = req.worker.id;
  const { longitude, latitude } = req.body;

  try {
    const query = `
      INSERT INTO workerLocation (longitude, latitude, worker_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (worker_id)
      DO UPDATE SET longitude = EXCLUDED.longitude, latitude = EXCLUDED.latitude
    `;
    await client.query(query, [longitude, latitude, workerId]);

    res.status(200).json({ message: "User location stored successfully" });
  } catch (error) {
    console.error("Error storing user location:", error);
    res.status(500).json({ error: "Failed to store user location" });
  }
};

const storeFcmToken = async (req, res) => {
  const { fcmToken } = req.body;
  const workerId = req.worker.id;

  try {
    // Single query using CTE:
    // 1) Delete any row with the same fcm_token (to avoid duplicates across workers)
    // 2) Insert new row with (worker_id, fcm_token).
    // 3) ON CONFLICT DO NOTHING if the same row (worker_id + fcm_token) already exists.
    // 4) Return the newly inserted row (if any).
    const upsertQuery = `
      WITH delete_matched AS (
        DELETE FROM fcm
        WHERE fcm_token = $2
      )
      INSERT INTO fcm (worker_id, fcm_token)
      VALUES ($1, $2)
      ON CONFLICT (worker_id, fcm_token)
      DO NOTHING
      RETURNING worker_id, fcm_token;
    `;

    const result = await client.query(upsertQuery, [workerId, fcmToken]);

    if (result.rowCount > 0) {
      // Successfully inserted a new row
      res.status(200).json({ message: "FCM token stored successfully" });
    } else {
      // The row already existed for this worker, or ON CONFLICT prevented insert
      res
        .status(200)
        .json({ message: "FCM token already exists for this worker" });
    }
  } catch (error) {
    console.error("Error storing FCM token:", error);
    res.status(500).json({ error: "Failed to store FCM token" });
  }
};

const workerProfileUpdate = async (req, res) => {
  const worker_id = req.worker.id;
  console.log("called");
  const { profileImage } = req.body;

  // Check if both parameters are provided
  if (!worker_id || !profileImage) {
    return res
      .status(400)
      .json({ error: "user_id and profileImage are required." });
  }

  try {
    // Update the user's profile image
    const query = `
      UPDATE workerskills
      SET profile = $1
      WHERE worker_id = $2
      RETURNING *;
  `;

    const values = [profileImage, worker_id];

    const result = await client.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({
      message: "Profile updated successfully.",
      updatedUser: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const workerCancellationStatus = async (req, res) => {
  const { notification_id } = req.query;

  if (!notification_id) {
    return res.status(400).json({ error: "notification_id is required" });
  }

  try {
    const result = await client.query(
      "SELECT navigation_status FROM accepted WHERE notification_id = $1",
      [notification_id]
    );

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

const workerNavigationCancel = async (req, res) => {
  const { notification_id, offer_code } = req.body;
  const encodedUserNotificationId = Buffer.from(
    notification_id.toString()
  ).toString("base64");

  try {
    await client.query("BEGIN");
    console.log("Transaction started for notification_id:", notification_id);

    const combinedQuery = await client.query(
      `
      WITH updated AS (
        UPDATE accepted
        SET user_navigation_cancel_status = 'workercanceled'
        WHERE notification_id = $1
        RETURNING
          accepted_id,
          user_id,
          user_notification_id,
          longitude,
          latitude,
          created_at,
          worker_id,
          service_booked,
          time,
          discount,
          total_cost,
          tip_amount,
          coupons_applied
      ),
      inserted AS (
        INSERT INTO completenotifications (
          accepted_id,
          notification_id,
          user_id,
          user_notification_id,
          longitude,
          latitude,
          created_at,
          worker_id,
          complete_status,
          service_booked,
          time,
          discount,
          total_cost,
          tip_amount
        )
        SELECT
          accepted_id,
          $1,
          user_id,
          user_notification_id,
          longitude,
          latitude,
          created_at,
          worker_id,
          'workercanceled',
          service_booked,
          time,
          discount,
          total_cost,
          tip_amount
        FROM updated
        RETURNING
          user_id,
          service_booked,
          worker_id
      ),
      user_updated AS (
        UPDATE "user" AS u
        SET offers_used = (
          SELECT jsonb_agg(
            CASE
              WHEN elem->>'offer_code' = $2 THEN elem || '{"status":"pending"}'
              ELSE elem
            END
          )
          FROM jsonb_array_elements(u.offers_used) AS elem
        )
        WHERE u.user_id IN (SELECT user_id FROM updated)
          AND EXISTS (
            SELECT 1
            FROM updated a
            WHERE a.user_id = u.user_id
              AND a.coupons_applied IS NOT NULL
              AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(a.coupons_applied) AS ac
                WHERE ac->>'offer_code' = $2
              )
          )
        RETURNING u.user_id
      )
      SELECT
        i.user_id,
        f.fcm_token,
        i.service_booked,
        i.worker_id
      FROM inserted i
      JOIN userfcm f ON f.user_id = i.user_id;
      `,
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
    await client.query(`DELETE FROM accepted WHERE notification_id = $1`, [
      notification_id,
    ]);

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

const addWorker = async (worker) => {
  const { name, phone_number } = worker;
  const created_at = getCurrentTimestamp();
  try {
    const result = await client.query(
      'INSERT INTO "workersverified" ( name, phone_number, created_at) VALUES ( $1, $2, $3) RETURNING *',
      [name, phone_number, created_at]
    );
    return result.rows[0];
  } catch (err) {
    console.error("Error adding user:", err);
    throw err;
  }
};

const workerCancelNavigation = async (req, res) => {
  const { notification_id } = req.body;

  if (!notification_id) {
    return res.status(400).json({ error: "Notification ID is required" });
  }

  try {
    // Combine status check and update in one query
    const query = `
      UPDATE accepted
      SET navigation_status = 'workercanceled'
      WHERE notification_id = $1
      AND (navigation_status IS NULL OR navigation_status != 'timeup')
      RETURNING navigation_status;
    `;

    const result = await client.query(query, [notification_id]);

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

const getWorkersNearby = async (req, res) => {
  try {
    // ------------------------------------------------------------------
    //  1) Extract request data
    // ------------------------------------------------------------------
    const user_id = req.user.id;
    const {
      area,
      pincode,
      city,
      alternateName,
      alternatePhoneNumber,
      serviceBooked, // array of { serviceName, cost }
      discount,
      tipAmount,
      offer,
    } = req.body;

    console.log("req.body", req.body);

    const created_at = getCurrentTimestamp();
    const serviceArray = JSON.stringify(serviceBooked); // e.g. '[{"serviceName":"...","cost": 250}, ...]'
    const serviceNames = serviceBooked.map((s) => s.serviceName);
    const totalCost =
      serviceBooked.reduce((acc, s) => acc + s.cost, 0) - discount + tipAmount;

    // ------------------------------------------------------------------
    //  2) Postgres Query #1: Insert userNotifications, find matching workers
    // ------------------------------------------------------------------
    const query1 = `
      WITH user_loc AS (
        SELECT u.user_id, ul.longitude, ul.latitude
        FROM "user" u
        JOIN userlocation ul ON u.user_id = ul.user_id
        WHERE u.user_id = $1
      ),
      inserted_user_notifications AS (
        INSERT INTO userNotifications (
          user_id, longitude, latitude, created_at,
          area, pincode, city, alternate_name,
          alternate_phone_number, service_booked
        )
        SELECT
          user_loc.user_id,
          user_loc.longitude,
          user_loc.latitude,
          $2,  -- created_at
          $3,  -- area
          $4,  -- pincode
          $5,  -- city
          $6,  -- alternateName
          $7,  -- alternatePhoneNumber
          $8   -- serviceArray
        FROM user_loc
        RETURNING user_notification_id
      ),
      matching_workers AS (
        SELECT ws.worker_id
        FROM workerskills ws
        JOIN workersverified wv ON ws.worker_id = wv.worker_id
        WHERE $9::text[] <@ ws.subservices
          AND wv.no_due = TRUE  -- Ensure workers have no due payments
        GROUP BY ws.worker_id
      )
      SELECT
        (SELECT user_notification_id FROM inserted_user_notifications) AS user_notification_id,
        array_agg(mw.worker_id) AS worker_ids,
        (SELECT latitude FROM user_loc) AS user_lat,
        (SELECT longitude FROM user_loc) AS user_lon
      FROM matching_workers mw;
    `;

    const query1Params = [
      user_id, // $1
      created_at, // $2
      area, // $3
      pincode, // $4
      city, // $5
      alternateName, // $6
      alternatePhoneNumber, // $7
      serviceArray, // $8
      serviceNames, // $9 :: text[]
    ];

    const result1 = await client.query(query1, query1Params);
    if (result1.rows.length === 0) {
      return res
        .status(404)
        .json("No user found or no worker matches subservices");
    }

    const { user_notification_id, worker_ids, user_lat, user_lon } =
      result1.rows[0];

    if (!user_notification_id) {
      return res.status(404).json("Failed to insert user notification");
    }
    if (!worker_ids || worker_ids.length === 0) {
      return res.status(200).json("No workers match the requested subservices");
    }

    // ------------------------------------------------------------------
    //  3) Firestore: Get worker locations once, filter by 2km radius
    // ------------------------------------------------------------------
    const workerDb = await getAllLocations(worker_ids);
    if (!workerDb || workerDb.length === 0) {
      return res
        .status(200)
        .json("No Firestore location data for these workers");
    }

    const MAX_DISTANCE = 2; // 2km
    const nearbyWorkers = [];
    for (const doc of workerDb) {
      const dist = haversineDistance(
        user_lat,
        user_lon,
        doc.location._latitude,
        doc.location._longitude
      );
      if (dist <= MAX_DISTANCE) {
        nearbyWorkers.push(doc.worker_id);
      }
    }

    if (nearbyWorkers.length === 0) {
      return res.status(200).json("No workers found within 2 km radius");
    }

    // ------------------------------------------------------------------
    //  4) Postgres Query #2: Insert notifications & retrieve FCM tokens
    // ------------------------------------------------------------------
    const pin = generatePin(); // e.g. 4-6 digit pin
    const query2 = `
      WITH insert_notifications AS (
        INSERT INTO notifications (
          user_notification_id, user_id, worker_id,
          longitude, latitude, created_at, pin, service_booked,
          discount, coupons_applied, total_cost, tip_amount
        )
        SELECT
          $1,  -- user_notification_id
          $2,  -- user_id
          w.worker_id,
          $3,  -- user_lon
          $4,  -- user_lat
          $5,  -- created_at
          $6,  -- pin
          $7,  -- serviceArray
          $9,  -- discount
          $12, -- coupons_applied
          $10, -- totalCost
          $11  -- tipAmount
        FROM UNNEST($8::int[]) AS w(worker_id)
        RETURNING worker_id
      ),
      fcm_tokens AS (
        SELECT fcm_token
        FROM fcm
        WHERE worker_id IN (SELECT worker_id FROM insert_notifications)
      )
      SELECT array_agg(fcm_token) AS tokens 
      FROM fcm_tokens;
    `;

    const query2Params = [
      user_notification_id, // $1
      user_id, // $2
      user_lon, // $3
      user_lat, // $4
      created_at, // $5
      pin, // $6
      serviceArray, // $7
      nearbyWorkers, // $8 :: int[]
      discount, // $9
      totalCost, // $10
      tipAmount, // $11
      offer, // $12 (for coupons_applied)
    ];

    const result2 = await client.query(query2, query2Params);
    const tokens = result2.rows[0].tokens || [];

    // ------------------------------------------------------------------
    //  5) If Offer Provided, Update "offers_used" with 'status: applied'
    // ------------------------------------------------------------------
    if (offer) {
      const offerCodeValue = offer.offer_code;
      const queryText = `
        UPDATE "user"
        SET offers_used = (
          SELECT jsonb_agg(
            CASE
              WHEN elem->>'offer_code' = $1
                THEN elem || '{"status":"applied"}'
              ELSE elem
            END
          )
          FROM jsonb_array_elements("user".offers_used) elem
        )
        WHERE user_id = $2
      `;
      await client.query(queryText, [offerCodeValue, user_id]);
    }

    // ------------------------------------------------------------------
    //  6) Send FCM notifications (if tokens exist)
    // ------------------------------------------------------------------
    const encodedUserNotificationId = Buffer.from(
      user_notification_id.toString()
    ).toString("base64");

    if (tokens.length > 0) {
      const normalNotificationMessage = {
        tokens,
        notification: {
          title: "🔔 ClickSolver Has a Job for You!",
          body: "💼 A user needs help! Accept now to support your ClickSolver family. 🤝",
        },
        data: {
          user_notification_id: encodedUserNotificationId,
          service: serviceArray,
          location: `${area}, ${city}, ${pincode}`,
          click_action: "FLUTTER_NOTIFICATION_CLICK",
          cost: totalCost.toString(),
          targetUrl: `/acceptance/${encodedUserNotificationId}`,
          screen: "Acceptance",
          date: formattedDate(),
          time: formattedTime(),
          type: "normal",
        },
        android: { priority: "high" },
      };

      try {
        const fcmResponse = await getMessaging().sendEachForMulticast(
          normalNotificationMessage
        );

        // Optional: track success/failure
        let successCount = 0;
        let failureCount = 0;
        fcmResponse.responses.forEach((resp, idx) => {
          if (resp.success) {
            successCount++;
          } else {
            failureCount++;
            console.error(
              `❌ Error sending to token ${tokens[idx]}:`,
              resp.error
            );
          }
        });
        console.log(
          `FCM Summary: ${successCount} success, ${failureCount} failures.`
        );
      } catch (err) {
        console.error("❌ Error sending FCM notifications:", err);
      }
    }

    // ------------------------------------------------------------------
    //  7) Return to Client
    // ------------------------------------------------------------------
    return res.status(200).json(encodedUserNotificationId);
  } catch (error) {
    console.error("Error in getWorkersNearby:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

const updateWorkerLifeDetails = async (workerId, totalAmount) => {
  try {
    // Ensure totalAmount is an integer
    const integerAmount = Math.round(totalAmount); // Use Math.floor(totalAmount) to truncate instead

    const query = `
      UPDATE workerlife
      SET 
        money_earned = money_earned + $1,
        service_counts = service_counts + 1
      WHERE worker_id = $2
      RETURNING money_earned, service_counts;
    `;
    const values = [integerAmount, workerId];

    const result = await client.query(query, values);

    if (result.rowCount === 0) {
      throw new Error("No worker found with the given worker_id");
    }

    return result.rows[0];
  } catch (error) {
    console.error("Error updating workerlife details:", error);
    throw new Error("Internal server error");
  }
};

const skillWorkerRegistration = async (req, res) => {
  const workerId = req.worker.id;
  const { selectedService, checkedServices, profilePic, proofPic, agree } =
    req.body;
  try {
    const query = `
      INSERT INTO workerskills (worker_id, service, subservices, profile, proof, agree)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (worker_id) DO UPDATE
      SET service = EXCLUDED.service, subservices = EXCLUDED.subservices, profile = EXCLUDED.profile, proof = EXCLUDED.proof, agree = EXCLUDED.agree
    `;
    await client.query(query, [
      workerId,
      selectedService,
      checkedServices,
      profilePic,
      proofPic,
      agree,
    ]);

    const workerLife = `
    INSERT INTO workerlife (worker_id, service_counts, money_earned)
    VALUES ($1, $2, $3)
    ON CONFLICT (worker_id) DO UPDATE
    SET service_counts = 0, money_earned = 0
  `;
    await client.query(workerLife, [workerId, 0, 0]);
    res
      .status(200)
      .json({ message: "Skilled worker registration stored successfully" });
  } catch (error) {
    console.error("Error storing user location:", error);
    res
      .status(500)
      .json({ error: "Failed to store Skilled worker registration" });
  }
};

const workerLifeDetails = async (req, res) => {
  const workerId = req.worker.id;

  try {
    const result = await client.query(
      `
        SELECT 
          wl.service_counts, 
          wl.money_earned, 
          wl.average_rating, 
          ws.profile,
          un.area,
          un.city,
          un.pincode,
          n.notification_id,
          sc.time_worked,
          u.name AS user_name,
          f.name AS feedback_name,
          f.rating AS feedback_rating,
          f.comment,
          f.created_at,
          (SELECT AVG(rating) FROM feedback WHERE worker_id = $1) AS average_rating
        FROM workerlife wl
        INNER JOIN workerskills ws ON wl.worker_id = ws.worker_id
        INNER JOIN servicecall sc ON wl.worker_id = sc.worker_id
        INNER JOIN notifications n ON sc.notification_id = n.notification_id
        INNER JOIN usernotifications un ON n.user_notification_id = un.user_notification_id
        INNER JOIN "user" u ON n.user_id = u.user_id
        INNER JOIN feedback f ON n.notification_id = f.notification_id
        WHERE wl.worker_id = $1
        ORDER BY n.notification_id DESC
        LIMIT 5
      `,
      [workerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Worker not found" });
    }

    const workerProfile = {
      profileDetails: result.rows,
      workerId,
    };

    // Since the average_rating is included in each row, you can take it from the first result.
    workerProfile.averageRating = result.rows[0].average_rating;

    return res.status(200).json(workerProfile);
  } catch (error) {
    console.error("Error getting worker life details:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const workerProfileDetails = async (req, res) => {
  const workerId = req.worker.id;

  try {
    const profileResult = await client.query(
      `
        SELECT 
          w.name AS worker_name, 
          w.created_at, 
          ws.profile, 
          ws.service, 
          ws.subservices,
          f.name AS feedback_name,
          f.rating,
          f.comment,
          (SELECT AVG(rating) FROM feedback WHERE worker_id = $1) AS average_rating
        FROM workersverified w
        INNER JOIN workerskills ws ON w.worker_id = ws.worker_id
        LEFT JOIN feedback f ON w.worker_id = f.worker_id
        WHERE w.worker_id = $1
      `,
      [workerId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: "Worker profile not found" });
    }

    // Extract average rating from the result
    const averageRating = profileResult.rows[0].average_rating;

    const workerProfile = {
      profileDetails: profileResult.rows,
      averageRating,
    };

    return res.status(200).json(workerProfile);
  } catch (error) {
    console.error("Error getting worker profile details:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getWorkerNavigationDetails = async (req, res) => {
  const { notificationId } = req.body;

  if (!notificationId) {
    return res.status(400).json({ error: "Notification ID is required" });
  }

  try {
    // Query to fetch worker_id, pin from notifications and name, phone_number from workersverified using JOIN
    const query = `
    SELECT 
      n.pin, 
      n.service_booked,
      w.name, 
      w.phone_number,
      un.area,
      ws.profile,
      wl.average_rating, -- Fetch average rating from workerlife
      wl.service_counts  -- Fetch service counts from workerlife
    FROM 
      accepted n
    JOIN 
      workersverified w ON n.worker_id = w.worker_id
    JOIN 
      usernotifications un ON n.user_notification_id = un.user_notification_id
    JOIN 
      workerskills ws ON n.worker_id = ws.worker_id
    JOIN 
      workerlife wl ON n.worker_id = wl.worker_id -- Joining workerlife table to get ratings and service counts
    WHERE 
      n.notification_id = $1;
  `;

    const result = await client.query(query, [notificationId]);

    // If no results, return 404
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Notification or worker not found" });
    }

    const {
      pin,
      name,
      phone_number,
      profile,
      pincode,
      area,
      city,
      service_booked,
      average_rating,
      service_counts,
    } = result.rows[0];

    // Send the response
    return res.status(200).json({
      pin,
      name,
      phone_number,
      profile,
      pincode,
      area,
      city,
      service_booked,
      average_rating,
      service_counts,
    });
  } catch (error) {
    console.error("Error getting worker navigation details:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const workerDetails = async (req, res, notification_id) => {
  try {
    // Combine queries using JOIN
    const query = `
      SELECT 
        w.name AS worker_name, 
        u.service AS service 
      FROM 
        accepted n
      JOIN 
        workersverified w ON n.worker_id = w.worker_id
      JOIN 
        usernotifications u ON n.user_notification_id = u.user_notification_id
      WHERE 
        n.notification_id = $1
    `;

    const result = await client.query(query, [notification_id]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Notification or related data not found" });
    }

    const { worker_name, service } = result.rows[0];

    // Return the worker's name and service
    res.json({ name: worker_name, service });
  } catch (error) {
    console.error("Error checking worker details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getWorkerEarnings = async (req, res) => {
  const { date, startDate, endDate } = req.body;
  const workerId = req.worker.id;

  let selectStartDate, selectEndDate;

  // 1) Parse incoming dates
  if (startDate && endDate) {
    selectStartDate = convertToDateString(startDate);
    selectEndDate = convertToDateString(endDate);

    if (!selectStartDate || !selectEndDate) {
      console.log("❌ Invalid start/end format:", startDate, endDate);
      return res
        .status(400)
        .json({ error: "Invalid startDate or endDate format" });
    }
    if (new Date(selectStartDate) > new Date(selectEndDate)) {
      console.log("❌ startDate > endDate:", selectStartDate, selectEndDate);
      return res
        .status(400)
        .json({ error: "startDate cannot be after endDate" });
    }
  } else if (date) {
    selectStartDate = convertToDateString(date);
    selectEndDate = selectStartDate;
    if (!selectStartDate) {
      console.log("❌ Invalid single date:", date);
      return res.status(400).json({ error: "Invalid date format" });
    }
  } else {
    console.log("❌ No date provided in request");
    return res.status(400).json({ error: "No date provided" });
  }

  // 2) Trim to YYYY-MM-DD only
  const start = selectStartDate.slice(0, 10);
  const end = selectEndDate.slice(0, 10);

  console.log("🕵️ getWorkerEarnings params:", { workerId, start, end });

  try {
    const query = `
      SELECT
        COALESCE(sc.total_payment,0)           AS total_payment,
        COALESCE(sc.cash_payment,0)            AS cash_payment,
        COALESCE(sc.payment_count,0)           AS payment_count,
        COALESCE(sc.total_time_worked_hours,0) AS total_time_worked_hours,
        sc.life_earnings,

        wl.average_rating                     AS avg_rating,

        COALESCE(cn.rejected_count,0)         AS rejected_count,
        COALESCE(pn.pending_count,0)          AS pending_count,

        wl.service_counts,
        wl.cashback_approved_times,
        wl.cashback_gain

      FROM workerlife wl

      LEFT JOIN LATERAL (
        SELECT
          SUM(s.payment)                                     AS total_payment,
          SUM(CASE WHEN s.payment_type='cash' THEN s.payment ELSE 0 END)
                                                             AS cash_payment,
          COUNT(*)                                           AS payment_count,
          (EXTRACT(
             EPOCH FROM SUM(
               CASE
                 WHEN s.time_worked ~ '^\\d{2}:\\d{2}:\\d{2}$'
                   AND split_part(s.time_worked, ':', 2)::int < 60
                   AND split_part(s.time_worked, ':', 3)::int < 60
                 THEN s.time_worked::interval
                 ELSE INTERVAL '0'
               END
             )
           ) / 3600)                                          AS total_time_worked_hours,
          (SELECT COALESCE(SUM(payment),0)
             FROM servicecall
            WHERE worker_id = wl.worker_id
              AND payment IS NOT NULL
          )                                                   AS life_earnings
        FROM servicecall s
        WHERE s.worker_id = wl.worker_id
          AND s.payment    IS NOT NULL
          AND DATE(s.end_time) BETWEEN DATE($2) AND DATE($3)
      ) sc ON TRUE

      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS rejected_count
        FROM completenotifications cn
        WHERE cn.worker_id       = wl.worker_id
          AND cn.complete_status = 'workercanceled'
          AND DATE(cn.created_at) BETWEEN DATE($2) AND DATE($3)
      ) cn ON TRUE

      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS pending_count
        FROM notifications n
        WHERE n.worker_id = wl.worker_id
          AND n.status    = 'pending'
          AND DATE(n.created_at) BETWEEN DATE($2) AND DATE($3)
      ) pn ON TRUE

      WHERE wl.worker_id = $1;
    `;

    const values = [workerId, start, end];
    console.log("🛠️ Executing SQL with values:", values);

    const { rows } = await client.query(query, values);
    console.log("🏷️  SQL returned rows:", rows);

    if (rows.length === 0) {
      console.log("⚠️ No rows for workerlife—no earnings data");
      return res.status(404).json({ error: "No earnings data found" });
    }

    const {
      total_payment,
      cash_payment,
      payment_count,
      life_earnings,
      avg_rating,
      rejected_count,
      pending_count,
      total_time_worked_hours,
      service_counts,
      cashback_approved_times,
      cashback_gain,
    } = rows[0];

    console.log("📊 Computed metrics:", {
      total_payment,
      cash_payment,
      payment_count,
      life_earnings,
      avg_rating,
      rejected_count,
      pending_count,
      total_time_worked_hours,
      service_counts,
      cashback_approved_times,
      cashback_gain,
    });

    return res.json({
      total_payment: Number(total_payment) || 0,
      cash_payment: Number(cash_payment) || 0,
      payment_count: Number(payment_count) || 0,
      life_earnings: Number(life_earnings) || 0,
      avg_rating: Number(avg_rating) || 0,
      rejected_count: Number(rejected_count) || 0,
      pending_count: Number(pending_count) || 0,
      total_time_worked_hours: Number(total_time_worked_hours) || 0,
      service_counts: Number(service_counts) || 0,
      cashback_approved_times: Number(cashback_approved_times) || 0,
      cashback_gain: Number(cashback_gain) || 0,
    });
  } catch (error) {
    console.error("🔥 Error fetching worker earnings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const workerWorkingStatusUpdated = async (req, res) => {
  const { serviceName, statusKey, currentTime, decodedId } = req.body;

  try {
    // Update the accepted table's service_status column and return only necessary fields.
    const query = `
      WITH updated AS (
        UPDATE accepted
        SET service_status = (
          SELECT jsonb_agg(
            CASE
              WHEN item ->> 'serviceName' = $1 THEN
                jsonb_set(item, '{${statusKey}}', to_jsonb($2::text))
              ELSE item
            END
          )
          FROM jsonb_array_elements(service_status) AS item
        )
        WHERE notification_id = $3
        RETURNING notification_id, service_status, user_id
      )
      SELECT updated.notification_id, updated.service_status, uf.fcm_token
      FROM updated
      JOIN userfcm uf ON updated.user_id = uf.user_id;
    `;

    const values = [serviceName, currentTime, decodedId];
    const { rows } = await client.query(query, values);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Record not found or update failed." });
    }

    // Extract FCM tokens from the result (if multiple rows, there might be duplicates)
    const tokens = rows.map((row) => row.fcm_token);

    // Prepare the multicast message payload with a data payload.
    const multicastMessage = {
      tokens,
      data: {
        status: currentTime.toString(),
        statusKey,
        message: "Status updated",
      },
      android: {
        priority: "high",
      },
      apns: {
        payload: {
          aps: {
            contentAvailable: true,
          },
        },
      },
    };

    // Send notifications using sendEachForMulticast
    try {
      const fcmResponse = await getMessaging().sendEachForMulticast(
        multicastMessage
      );
      fcmResponse.responses.forEach((resp, index) => {
        if (!resp.success) {
          console.error(
            `Error sending message to token ${tokens[index]}:`,
            resp.error
          );
        }
      });

      return res.status(200).json({
        message: "Service status updated successfully and FCM message sent.",
        data: rows[0],
        fcmResponse,
      });
    } catch (fcmError) {
      console.error("Error sending notifications:", fcmError);
      return res
        .status(500)
        .json({ message: "Internal server error", error: fcmError });
    }
  } catch (error) {
    console.error("Error updating service status:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

const WorkerWorkInProgressDetails = async (req, res) => {
  const { decodedId } = req.body;
  console.log(decodedId);
  try {
    const query = `
    SELECT 
        a.service_booked, 
        a.time, 
        a.created_at, 
        a.service_status,
        u.area
    FROM 
        accepted a
    JOIN 
        usernotifications u ON a.user_notification_id = u.user_notification_id
    WHERE 
        a.notification_id = $1
`;

    const result = await client.query(query, [decodedId]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No details found for the given notification_id" });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching user worker in-progress details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const workerSearch = async (req, res) => {
  try {
    const { phone_number } = req.query;

    if (!phone_number) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Query to fetch worker details, skills, and life stats
    const query = `
      SELECT 
        w.worker_id,
        w.name,
        w.email,
        ws.profile,
        ws.service,
        ws.subservices,
        ws.personaldetails,
        ws.address,
        wl.balance_amount,
        wl.service_counts,
        wl.money_earned,
        wl.average_rating
      FROM workersverified w
      LEFT JOIN workerskills ws ON w.worker_id = ws.worker_id
      LEFT JOIN workerlife wl ON w.worker_id = wl.worker_id
      WHERE w.phone_number = $1;
    `;

    const { rows } = await client.query(query, [phone_number]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Worker not found" });
    }

    // Return the first result (assuming phone_number is unique)
    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error searching worker:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const cashbackHistory = async (req, res) => {
  const { worker_id } = req.query;

  // Validate input
  if (!worker_id) {
    return res.status(400).json({ error: "worker_id is required" });
  }

  try {
    // Query to fetch cashback-related data for the worker
    const query = `
      SELECT 
        cashback_history,
        cashback_gain,
        cashback_approved_times
      FROM workerlife
      WHERE worker_id = $1;
    `;

    const { rows } = await client.query(query, [worker_id]);

    // Check if worker exists
    if (rows.length === 0) {
      return res.status(404).json({ error: "Worker not found" });
    }

    // Return the cashback data
    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error fetching cashback history:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const balanceHistory = async (req, res) => {
  const { worker_id } = req.query;

  if (!worker_id) {
    return res.status(400).json({ error: "worker_id is required" });
  }

  try {
    const query = `
      SELECT balance_payment_history
      FROM workerlife
      WHERE worker_id = $1;
    `;
    const { rows } = await client.query(query, [worker_id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Worker not found" });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error fetching balance history:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getWorkerServiceHistory = async (req, res) => {
  try {
    const { worker_id } = req.query; // Get worker_id from the request body
    console.log(worker_id);

    const query = `
    SELECT 
      payment, 
      payment_type, 
      end_time
    FROM servicecall
    WHERE worker_id = $1 
      AND payment IS NOT NULL;
  `;
    const values = [worker_id];
    const result = await client.query(query, values);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching WorkerServiceHistory:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const currentService = async (req, res) => {
  const { worker_id } = req.query;

  // Validate input
  if (!worker_id) {
    return res.status(400).json({ error: "worker_id is required" });
  }

  try {
    // Query to fetch the current service details
    const query = `
      SELECT 
        screen_name, 
        params
      FROM workeraction
      WHERE worker_id = $1;
    `;

    const { rows } = await client.query(query, [worker_id]);

    // Check if any data is found
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No current service found for the worker" });
    }

    // Respond with the fetched data
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error fetching current service:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const workerScreenChange = async (req, res) => {
  try {
    let { worker_id, params, screen } = req.body;
    console.log("req.body is", req.body);

    // If params is a string, parse it into JSON.
    if (typeof params === "string") {
      try {
        params = JSON.parse(params);
      } catch (parseError) {
        console.warn("Failed to parse params string:", params);
        return res.status(400).json({
          success: false,
          message:
            "Params should be a valid JSON object or a stringified JSON object.",
        });
      }
    }

    // Validate params and check for encodedId.
    if (!params || typeof params !== "object" || !params.encodedId) {
      console.warn("Invalid params structure:", params);
      return res.status(400).json({
        success: false,
        message:
          "Invalid params format. Expected { encodedId: <Base64String> }",
      });
    }

    // Use the provided encodedId.
    const encodedId = params.encodedId;

    // SQL Query with CTEs
    const query = `
      WITH updated_worker AS (
        UPDATE workeraction
        SET screen_name = CASE WHEN $2 = '' THEN '' ELSE $2 END
        WHERE worker_id = $1
        RETURNING worker_id
      ),
      updated_useraction AS (
        UPDATE useraction
        SET track = COALESCE((
          SELECT jsonb_agg(new_elem)
          FROM (
            SELECT 
              CASE 
                WHEN elem->>'encodedId' = $3 THEN 
                  CASE 
                    WHEN $2 = '' THEN NULL  -- Mark for deletion
                    ELSE jsonb_set(elem, '{screen}', to_jsonb($2)) -- Update screen
                  END
                ELSE elem
              END AS new_elem
            FROM jsonb_array_elements(track) AS elem
          ) AS sub
          WHERE new_elem IS NOT NULL
        ), '[]'::jsonb) -- Ensure empty array instead of NULL
        WHERE user_id IN (
          SELECT user_id FROM accepted WHERE worker_id = $1
        )
        RETURNING user_id, track
      )
      SELECT * FROM updated_useraction;
    `;

    // Execute the query
    const result = await client.query(query, [worker_id, screen, encodedId]);

    console.log("rows", result.rows);

    return res.status(200).json({
      success: true,
      message: "Worker screen updated successfully",
      data: result.rows,
    });
  } catch (error) {
    console.error("Error updating worker screen:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
module.exports = {
  workerTrackingCall,
  phoneCall,
  workerCompleteSignUp,
  getServicesPhoneNumber,
  getServicesRegisterPhoneNumber,
  getWorkerDetails,
  sendNotificationsToWorkers,
  workerProfileScreenDetails,
  profileChangesSubmit,
  registrationSubmit,
  addBankAccount,
  createFundAccount,
  addUpiId,
  onboardingSteps,
  validateAndSaveUPI,
  getWorkerProfileDetails,
  balanceAmmountToPay,
  getWorkerCashbackDetails,
  getWorkerBalanceDetails,
  workerMessage,
  workerApprove,
  workerGetMessage,
  workerCashbackPayed,
  getWorkerProfleDetails,
  getWorkerReviewDetails,
  getWorkerBookings,
  getWorkerOngoingBookings,
  getWorkerNotifications,
  storeNotification,
  createWorkerAction,
  getWorkerTrackRoute,
  storeWorkerLocation,
  updateWorkerLocation,
  storeFcmToken,
  workerProfileUpdate,
  workerCancellationStatus,
  workerNavigationCancel,
  addWorker,
  workerCancelNavigation,
  getWorkersNearby,
  updateWorkerLifeDetails,
  skillWorkerRegistration,
  workerLifeDetails,
  workerProfileDetails,
  getWorkerNavigationDetails,
  workerDetails,
  getWorkerEarnings,
  workerWorkingStatusUpdated,
  WorkerWorkInProgressDetails,
  workerSearch,
  cashbackHistory,
  balanceHistory,
  getWorkerServiceHistory,
  currentService,
  workerScreenChange,
};
