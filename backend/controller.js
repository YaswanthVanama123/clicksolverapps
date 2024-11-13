const admin = require("./firebaseAdmin.js");
const {encrypt,decrypt} = require("./src/utils/encrytion.js")
const { getMessaging } = require("firebase-admin/messaging"); // Import Firebase Admin SDK
const db = admin.firestore();
const client = require("./connection.js");
const axios = require('axios')
var cron = require('node-cron');
const {
  generateToken,
  generateWorkerToken,
} = require("./src/utils/generateToken.js");
const { response } = require("express");
const request = require('request');

// Telesign API credentials
const customerId = '1D0C4D6D-48D8-40A2-BD9D-CE2160F6B3E9';
const apiKey = 'BQXK2DGbESmYMvO0JC2sNAd9AtOTh48AwaPZIWL7bd8o8mB63TjwAJ/BhNxO3/YD6pjjZFQR5j6Ke1wEA1TCew==';
const smsEndpoint = `https://rest-api.telesign.com/v1/messaging`;

// newly functions 

// const Partnerlogin = async (req, res) => {
//   const { phone_number } = req.body;
//   if (!phone_number) {
//     return res.status(400).json({ message: "Phone number is required" });
//   }
//   try {
//     // Query the database to find the worker by phone number
//     const worker = await getWorkerByPhoneNumber(phone_number);
//     if (worker) {
//       // Worker is found, generate and send the token
//       const token = generateWorkerToken(worker);
//       const workerId = worker.worker_id
//       // Set token in cookie with secure options
//       res.cookie("token", token, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "Strict",
//       });
//       // Return token in response
//       return res.status(200).json({ token,workerId });
//     } else {
//       // Worker is not found, send a response indicating the need for signup
//       // Temporarily store the phone number in session or pass it back
//       return res.status(205).json({ message: "Phone number not found, please complete sign up", phone_number });
//     }
//   } catch (error) {
//     console.error("Error logging in worker:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

const Partnerlogin = async (req, res) => {
  const { phone_number } = req.body;
  if (!phone_number) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  try {
    // Query to check the existence of phone_number in both tables and get signup step details
    const query = `
      WITH workersverified_check AS (
        SELECT worker_id
        FROM workersverified
        WHERE phone_number = $1
        LIMIT 1
      ),
      workers_check AS (
        SELECT worker_id
        FROM workers
        WHERE phone_number = $1
        LIMIT 1
      )
      SELECT 
        CASE 
          WHEN EXISTS (SELECT 1 FROM workersverified_check) THEN 200
          WHEN EXISTS (SELECT 1 FROM workers_check) THEN 201
          ELSE 400
        END AS status_code,
        (SELECT worker_id FROM workersverified_check) AS verified_worker_id,
        (SELECT worker_id FROM workers_check) AS worker_id,
        EXISTS (SELECT 1 FROM workers_check) AS step1,
        EXISTS (SELECT 1 FROM workerskills WHERE worker_id = (SELECT worker_id FROM workers_check)) AS step2,
        EXISTS (SELECT 1 FROM bankaccounts WHERE worker_id = (SELECT worker_id FROM workers_check)) AS step3
    `;

    const result = await client.query(query, [phone_number]);
    const statusCode = result.rows[0].status_code;
    const workerId = result.rows[0].verified_worker_id || result.rows[0].worker_id;
    const stepsCompleted = result.rows[0].step1 && result.rows[0].step2 && result.rows[0].step3;

    if (statusCode === 200) {
      // Worker found in workersverified table
      const token = generateWorkerToken({ worker_id: workerId });
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
      });
      return res.status(200).json({ token, workerId });
    } else if (statusCode === 201) {
  const token = generateWorkerToken({ worker_id: workerId });
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });
  console.log('Backend Response for status 201:', { token, workerId, stepsCompleted });

  return res.status(201).json({
    message: "Phone number found in workers, please complete sign up",
    token,
    workerId,
    stepsCompleted
  });
}
 else {
      // Phone number not found in both tables
      return res.status(203).json({ message: "Phone number not registered", phone_number });
    }
  } catch (error) {
    console.error("Error logging in worker:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};



const accountDetailsUpdate = async (req, res) => {
  const userId = req.user.id; // Get user ID from the request
  const { name, email, phone } = req.body; // Get name, email, phone from the request body
  // console.log(userId,name,email,phone)
  try {
    // SQL query to update user details
    const query = `
      UPDATE "user"
      SET name = $1,
          email = $2,
          phone_number = $3
      WHERE user_id = $4
    `;

    // Execute the query and get the result
    const result = await client.query(query, [name, email, phone, userId]);

    // Check if any row was updated
    if (result.rowCount > 0) {
      return res.status(200).json({ message: 'Account details updated successfully' });
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error("Error updating account details:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const userCompleteSignUp = async (req, res) => {
  const { fullName, email, phoneNumber } = req.body;

  if (!fullName || !email || !phoneNumber) {
    return res.status(400).json({ message: "Full name, email, and phone number are required" });
  }

  try {
    // Insert the data into the `user` table
    const insertQuery = `
      INSERT INTO "user" (name, phone_number, email)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [fullName, phoneNumber, email];

    const result = await client.query(insertQuery, values);
    const user = result.rows[0];

    // Generate a token for the new user
    const token = generateToken(user);

    // Set the token as an HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    // Send the token in the response
    return res.json({ token });
  } catch (error) {
    console.error('Error in userCompleteSignUp:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
};



// const workerCompleteSignUp = async (req, res) => {
//   const { fullName, email = null, phoneNumber } = req.body; // Set default value of email to null
//   // console.log(fullName);

//   // Check for the presence of the phone number
//   if (!phoneNumber) {
//     return res.status(400).json({ message: "No phone number found. Please start the login process again." });
//   }

//   try {
//     // Prepare the insert query
//     const insertWorkerQuery = `
//       INSERT INTO workersverified (phone_number, name, email)
//       VALUES ($1, $2, $3)
//       RETURNING *;
//     `;

//     // Insert the new worker into the database
//     const result = await client.query(insertWorkerQuery, [phoneNumber, fullName, email]);

//     const worker = result.rows[0];

//     // Generate token for the newly registered worker
//     const token = generateWorkerToken(worker);
//     // console.log(token)
//     // Set token in cookie with secure options
//     res.cookie("token", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "Strict",
//     });

//     // Return token in response
//     return res.status(200).json({ token, message: "Sign up complete" });
//   } catch (error) {
//     console.error("Error completing sign up:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

const workerCompleteSignUp = async (req, res) => {
  const { fullName, email = null, phoneNumber } = req.body; // Set default value of email to null
  // console.log(fullName);

  // Check for the presence of the phone number
  if (!phoneNumber) {
    return res.status(400).json({ message: "No phone number found. Please start the login process again." });
  }

  try {
    // Prepare the insert query
    const insertWorkerQuery = `
      INSERT INTO workers (phone_number, name, email)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

    // Insert the new worker into the database
    const result = await client.query(insertWorkerQuery, [phoneNumber, fullName, email]);

    const worker = result.rows[0];

    // Return token in response
    return res.status(200).json({ worker, message: "Sign up complete" });
  } catch (error) {
    console.error("Error completing sign up:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getServicesPhoneNumber = async (req, res) => {
  // Extract serviceTitle from the body of the POST request
  const worker_id = req.worker.id
 
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
    console.log(worker_id,result.rows)
    // Return the rows that match the query
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching services:", err);
    res.status(500).send("Internal Server Error");
  }
};


const getServiceTrackingWorkerItemDetails = async (req, res) => {
  try {
    const { tracking_id } = req.body;
    const query = `
      SELECT
        st.service_booked,
        st.service_status,
        st.created_at,
        st.longitude,
        st.latitude,
        u.name,
        u.phone_number,
        un.area
      FROM servicetracking st
      JOIN "user" u ON st.user_id = u.user_id
      JOIN usernotifications un ON st.user_notification_id = un.user_notification_id
      WHERE st.tracking_id = $1;
    `;

    const values = [tracking_id];

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No service tracking details found for the given accepted ID" });
    }

    const { service_booked } = result.rows[0];

    if (!service_booked || !Array.isArray(service_booked)) {
      return res.status(400).json({ message: "Invalid service_booked data format" });
    }

    const gstRate = 0.05;
    const discountRate = 0.05;

    const fetchedTotalAmount = service_booked.reduce((total, service) => total + (service.cost || 0), 0);

    const gstAmount = fetchedTotalAmount * gstRate;
    const cgstAmount = fetchedTotalAmount * gstRate;
    const discountAmount = fetchedTotalAmount * discountRate;
    const fetchedFinalTotalAmount = fetchedTotalAmount + gstAmount + cgstAmount - discountAmount;

    const paymentDetails = {
      gstAmount,
      cgstAmount,
      discountAmount,
      fetchedFinalTotalAmount,
    };

    res.status(200).json({ data: result.rows[0], paymentDetails });
  } catch (error) {
    console.error("Error fetching service tracking worker item details: ", error);
    res.status(500).json({ message: "Failed to fetch service tracking worker item details", error: error.message });
  }
};

const getServiceTrackingUserItemDetails = async (req, res) => {
  try {
    const { tracking_id } = req.body;
    // console.log(tracking_id)
    const query = `
    SELECT
      st.service_booked,
      st.service_status,
      st.created_at,
      st.tracking_pin,
      w.name,
      w.phone_number,
      un.area,
      ws.profile,
      ws.service
    FROM servicetracking st
    JOIN workersverified w ON st.worker_id = w.worker_id
    JOIN usernotifications un ON st.user_notification_id = un.user_notification_id
    JOIN workerskills ws ON w.worker_id = ws.worker_id
    WHERE st.tracking_id = $1;
  `;
  

    const values = [tracking_id];

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No service tracking details found for the given accepted ID" });
    }

    const { service_booked } = result.rows[0];

    if (!service_booked || !Array.isArray(service_booked)) {
      return res.status(400).json({ message: "Invalid service_booked data format" });
    }

    const gstRate = 0.05;
    const discountRate = 0.05;

    const fetchedTotalAmount = service_booked.reduce((total, service) => total + (service.cost || 0), 0);

    const gstAmount = fetchedTotalAmount * gstRate;
    const cgstAmount = fetchedTotalAmount * gstRate;
    const discountAmount = fetchedTotalAmount * discountRate;
    const fetchedFinalTotalAmount = fetchedTotalAmount + gstAmount + cgstAmount - discountAmount;

    const paymentDetails = {
      gstAmount,
      cgstAmount,
      discountAmount,
      fetchedFinalTotalAmount,
    };

    res.status(200).json({ data: result.rows[0], paymentDetails });
  } catch (error) {
    console.error("Error fetching service tracking worker item details: ", error);
    res.status(500).json({ message: "Failed to fetch service tracking worker item details", error: error.message });
  }
};

const getServiceBookingItemDetails = async (req, res) => {
  try {
    const { tracking_id } = req.body;
    console.log(tracking_id)
    // console.log(tracking_id)
    const query = `
    SELECT
      st.service_booked,
      st.time,
      st.created_at,
      w.name,
      w.phone_number,
      un.area,
      ws.profile,
      ws.service
    FROM completenotifications st
    JOIN workersverified w ON st.worker_id = w.worker_id
    JOIN usernotifications un ON st.user_notification_id = un.user_notification_id
    JOIN workerskills ws ON w.worker_id = ws.worker_id
    WHERE st.notification_id = $1;
  `;
  

    const values = [tracking_id];

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No service tracking details found for the given accepted ID" });
    }

    const { service_booked } = result.rows[0];

    if (!service_booked || !Array.isArray(service_booked)) {
      return res.status(400).json({ message: "Invalid service_booked data format" });
    }

    const gstRate = 0.05;
    const discountRate = 0.05;

    const fetchedTotalAmount = service_booked.reduce((total, service) => total + (service.cost || 0), 0);

    const gstAmount = fetchedTotalAmount * gstRate;
    const cgstAmount = fetchedTotalAmount * gstRate;
    const discountAmount = fetchedTotalAmount * discountRate;
    const fetchedFinalTotalAmount = fetchedTotalAmount + gstAmount + cgstAmount - discountAmount;

    const paymentDetails = {
      gstAmount,
      cgstAmount,
      discountAmount,
      fetchedFinalTotalAmount,
    };

    res.status(200).json({ data: result.rows[0], paymentDetails });
  } catch (error) {
    console.error("Error fetching service tracking worker item details: ", error);
    res.status(500).json({ message: "Failed to fetch service tracking worker item details", error: error.message });
  }
};


const serviceTrackingUpdateStatus = async (req, res) => {
  const { tracking_id, newStatus } = req.body;

  try {
      // Check if tracking_id and status are provided
      if (!tracking_id || !newStatus) {
          return res.status(400).json({ message: "tracking_id and status are required." });
      }

      // Update query
      const updateQuery = `
          UPDATE servicetracking 
          SET service_status = $1 
          WHERE tracking_id = $2
      `;

      // Execute the query
      const result = await client.query(updateQuery, [newStatus, tracking_id]);

      // Check if any rows were updated
      if (result.rowCount === 0) {
          return res.status(404).json({ message: "Service tracking not found." });
      }

      // Success response
      res.status(200).json({ message: "Service status updated successfully." });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error." });
  }
};


const getWorkerDetails = async (notificationId) => {
  try {
    const query = `
    SELECT 
        accepted.service_booked, 
        workersverified.name, 
        usernotifications.area, 
        usernotifications.city, 
        usernotifications.pincode,
        workerskills.profile -- Assuming 'skill_name' is a column in 'workskills' for skill description
    FROM 
        accepted
    INNER JOIN 
        workersverified ON accepted.worker_id = workersverified.worker_id
    INNER JOIN 
        usernotifications ON accepted.user_notification_id = usernotifications.user_notification_id
    INNER JOIN 
        workerskills ON accepted.worker_id = workerskills.worker_id -- Join workerskills table on worker_id
    WHERE 
        accepted.notification_id = $1;
`;

      const result = await client.query(query, [notificationId]);

      if (result.rows.length === 0) {
          return { error: "No worker details found for the provided notification ID." };
      }

      const { service_booked, name, area, city, pincode, profile } = result.rows[0];
      let gstAmount = 0;
      let cgstAmount = 0;
      let discountAmount = 0;

      const calculatePayment = (baseAmount) => {
          const gst = (baseAmount * 5) / 100;  
          const cgst = (baseAmount * 5) / 100;
          const discount = (baseAmount * 5) / 100;
          const finalAmount = baseAmount + gst + cgst - discount;
          gstAmount = gst;
          cgstAmount = cgst;
          discountAmount = discount;
          return finalAmount;
      };

      const fetchedTotalAmount = service_booked.reduce((total, service) => {
          return total + (service.cost || 0);
      }, 0);

      const fetchedFinalTotalAmount = calculatePayment(fetchedTotalAmount);
      console.log(profile)
      return { 
          service_booked, 
          name, 
          area, 
          profile,
          city, 
          pincode,
          gstAmount, 
          cgstAmount, 
          discountAmount, 
          fetchedFinalTotalAmount 
      };
  } catch (error) {
      console.error("Error fetching worker details:", error);
      return { error: "An error occurred while fetching worker details." };
  }
};


const userProfileDetails = async (req, res) => {
  const userId = req.user.id;
  // console.log(userId);

  try {
    const query = `
      SELECT name, email, phone_number
      FROM "user"
      WHERE user_id = $1;  -- Use $1 as a placeholder for the userId
    `;

    // Execute the query with the userId as a parameter
    const result = await client.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No worker details found for the provided user ID." });
    }

    const { name, email, phone_number } = result.rows[0];

    // Return the result
    return res.json({ name, email, phone_number });
  } catch (error) {
    console.error("Error fetching worker details:", error);
    res.status(500).json({ message: "An error occurred while fetching worker details." });
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
      res.status(200).json({ message: 'Registration successful' });
  } catch (error) {
      console.error('Error inserting or updating data in workerskill table:', error);
      res.status(500).json({ message: 'Error registering worker', error });
  }
};

const addBankAccount = async (req, res) => {
  const bankAccountDetails = req.body;
  // Extract data from formData
  const workerId = req.worker.id; 
  const bankName = bankAccountDetails.bank;
  const accountNumber = bankAccountDetails.accountNumber;
  const ifscCode = bankAccountDetails.ifscCode;
  const accountHolderName = bankAccountDetails.accountHolderName;

  // Encrypt sensitive data
  const encryptedAccountNumber = encrypt(accountNumber);
  const encryptedIfscCode = encrypt(ifscCode);

  try {
    // SQL query to insert into workerskills table with conflict resolution
    const query = `
      INSERT INTO bankaccounts (worker_id, bank_name, account_number, ifsc_code, account_holder_name)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (worker_id) DO UPDATE
      SET
        bank_name = EXCLUDED.bank_name,
        account_number = EXCLUDED.account_number,
        ifsc_code = EXCLUDED.ifsc_code,
        account_holder_name = EXCLUDED.account_holder_name;
    `;

    const values = [
      workerId,
      bankName,
      encryptedAccountNumber,
      encryptedIfscCode,
      accountHolderName,
    ];

    // Execute the query
    await client.query(query, values);

    // Send success response
    res.status(200).json({ message: 'Bank account added successfully' });
  } catch (error) {
    console.error('Error inserting or updating data in bank account table:', error);
    res.status(500).json({ message: 'Error adding account', error });
  }
};

const addUpiId = async (req, res) => {
  const workerId = req.worker.id;
  const upiId = req.body.upi_id;  // Ensure you're extracting the upi_id from the request body
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
    res.status(201).json({ message: 'Bank account added successfully' });
  } catch (error) {
    console.error('Error inserting or updating data in bank account table:', error);
    res.status(500).json({ message: 'Error adding account', error });
  }
};

const onboardingSteps = async (req, res) => {
  const workerId = req.worker.id; // Get the worker ID from the request object
  try {
    // Combined query to check existence in workersverified, workerskills, and bankaccounts
    const query = `
      SELECT 
        EXISTS (SELECT 1 FROM workers WHERE worker_id = $1) AS step1,
        EXISTS (SELECT 1 FROM workerskills WHERE worker_id = $1) AS step2,
        EXISTS (SELECT 1 FROM bankaccounts WHERE worker_id = $1) AS step3
    `;

    const result = await client.query(query, [workerId]);
    
    // Extracting step results from the query response
    const { step1, step2, step3 } = result.rows[0];

    // Construct the response object
    const response = {
      step1,
      step2,
      step3,
    };

    // Send response
    res.status(200).json({ message: 'Onboarding steps checked successfully', steps: response });
  } catch (error) {
    console.error('Error checking onboarding steps:', error);
    res.status(500).json({ message: 'Error checking onboarding steps', error });
  }
};

const getAllBankAccounts = async (req, res) => {
  try {
    // SQL query to select all rows from the bankaccounts table
    const query = 'SELECT * FROM bankaccounts';
    const result = await client.query(query);

    // Decrypt the sensitive fields in the retrieved data
    const bankAccounts = result.rows.map(account => ({
      ...account,
      account_number: decrypt(account.account_number),
      ifsc_code: decrypt(account.ifsc_code),
    }));
    // console.log(bankAccounts) 

    // res.status(200).json(bankAccounts);
  } catch (error) {
    console.error('Error retrieving bank accounts:', error);
    // res.status(500).json({ message: 'Error retrieving bank accounts', error });
  }
};

// Function to get worker profile details
// Controller function to get worker profile details
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
        w.phone_number,
        ws.personaldetails,
        ws.address
      FROM 
        workerskills ws
      JOIN 
        workersverified w ON ws.worker_id = w.worker_id
      WHERE 
        ws.worker_id = $1
    `;

    const result = await client.query(query, [workerId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    // Send the response with worker details
    res.status(200).json(result.rows[0]); // Return a single worker's details
  } catch (error) {
    console.error('Error fetching worker profile details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Optimized function to check worker's onboarding status
const checkOnboardingStatus = async (req, res) => {
  const worker_id = req.worker.id;

  try {
    const { rows } = await client.query('SELECT onboarding_status FROM workersverified WHERE worker_id = $1', [worker_id]);

    if (!rows.length) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    res.status(200).json({ onboarding_status: rows[0].onboarding_status });
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// balanceAmmountToPay function
const balanceAmmountToPay = async (req, res) => {
  const  worker_id  = req.worker.id; // Assuming worker_id is passed in the request parameters
  // console.log(worker_id)
  try {
    // Query to select payment, payment_type, notification_id, and end_time where worker_id matches and payment is not null
    const result = await client.query(
      `SELECT servicecall.payment, 
              servicecall.payment_type, 
              servicecall.notification_id, 
              servicecall.end_time, 
              completenotifications.*, 
              "user".name
       FROM servicecall
       LEFT JOIN completenotifications 
         ON servicecall.notification_id = completenotifications.notification_id
       LEFT JOIN "user" 
         ON completenotifications.user_id = "user".user_id
       WHERE servicecall.worker_id = $1 AND servicecall.payment IS NOT NULL`,
      [worker_id]
    );
    
    

    // If there are no records, return a message
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No payments found for this worker' });
    }

    
    // Return the found records
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching balance amount to pay:', err);
    res.status(500).json({ error: 'An error occurred while retrieving payments' });
  }
};

const getWorkerCashbackDetails = async (req, res) => {
  try {
    const { worker_id } = req.body; // Get worker_id from the request body
    console.log(worker_id)
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
        workerlife.cashback_gain
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
    console.error('Error fetching worker cashback details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Function to insert data into the 'relatedservices' table
const insertRelatedService = async (req, res) => {
  const { service, service_category, related_services } = req.body;

  // SQL query to insert data into the 'relatedservices' table
  const query = `
    INSERT INTO relatedservices (service, service_category, related_services)
    VALUES ($1, $2, $3) RETURNING *;
  `;

  // Values to be inserted into the query
  const values = [service, service_category, related_services];

  try {
    // Execute the query
    const result = await client.query(query, values);
    
    // Send a success response with the inserted row details
    res.status(201).json({
      message: 'Related service added successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error inserting related service:', error);
    
    // Send an error response if something goes wrong
    res.status(500).json({
      message: 'Error adding related service',
      error: error.message,
    });
  }
};



// const insertTracking = async (req, res) => {
//   try {
//     const { notification_id,  } = req.body;
//     // console.log("inserting tracking",notification_id)

//     // Generate a 4-digit random number for tracking_pin
//     const trackingPin = Math.floor(1000 + Math.random() * 9000);

//     // Generate a tracking_key: #cs followed by 13 random digits
//     const trackingKey = `#cs${Math.floor(1000000000000 + Math.random() * 9000000000000)}`;

//     // Set service_status as "Commander collected the service item"
//     const serviceStatus = "Collected Item";

//     const query = `
//       WITH selected AS (
//         SELECT
//           a.accepted_id,
//           a.notification_id,
//           a.user_notification_id,
//           a.longitude,
//           a.latitude,
//           a.worker_id,
//           a.service_booked,
//           a.user_id,
//           u.fcm_token
//         FROM accepted a
//         JOIN userfcm u ON a.user_id = u.user_id
//         WHERE a.notification_id = $1
//       )
//       INSERT INTO servicetracking (
//         accepted_id,
//         notification_id,
//         user_notification_id,
//         longitude,
//         latitude,
//         worker_id,
//         service_booked,
//         user_id,
//         created_at,
//         tracking_pin,
//         tracking_key,
//         service_status
//       )
//       SELECT
//         selected.accepted_id,
//         selected.notification_id,
//         selected.user_notification_id,
//         selected.longitude,
//         selected.latitude,
//         selected.worker_id,
//         selected.service_booked,
//         selected.user_id,
//         NOW(),
//         $2,
//         $3,
//         $4
//       FROM selected
//       RETURNING *,
//         (SELECT fcm_token FROM selected);

//     `;
    
    
  
//     const values = [notification_id, trackingPin, trackingKey, serviceStatus];

//     const result = await client.query(query, values);

//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: "Accepted record not found" });
//     }

//     const {user_id,service_booked,worker_id} = result.rows[0];
//     const screen = ""
//     const encodedId = Buffer.from(notification_id.toString()).toString("base64")

//     await createUserBackgroundAction(user_id, encodedId, screen, service_booked);
//     await updateWorkerAction(worker_id,screen,screen)

//     const fcmTokens = result.rows.map(row => row.fcm_token).filter(token => token); // Filter out any undefined tokens
    
//     if (fcmTokens.length > 0) {
//       // Create a multicast message object for all tokens
//       const multicastMessage = {
//         tokens: fcmTokens, // An array of tokens to send the same message to
//         notification: {
//           title: "Click Solver",
//           body: `Commander collected your Item to repair in his location.`,
//         },
//         data: {
//           notification_id: notification_id.toString(),
//           screen: 'Home'
//         },
//       };

//       try {
//         // Use sendEachForMulticast to send the same message to multiple tokens
//         const response = await getMessaging().sendEachForMulticast(multicastMessage);

//         // Log the responses for each token
//         response.responses.forEach((res, index) => {
//           if (res.success) {
//             // console.log(`Message sent successfully to token ${fcmTokens[index]}`);
//           } else {
//             console.error(`Error sending message to token ${fcmTokens[index]}:`, res.error);
//           }
//         });

//         // console.log('Success Count:', response.successCount);
//         // console.log('Failure Count:', response.failureCount);
//       } catch (error) {
//         console.error('Error sending notifications:', error);
//       }
//     } else {
//       console.error('No FCM tokens to send the message to.');
//     }




//     res.status(201).json({ message: "Tracking inserted successfully", data: result.rows[0] });
//   } catch (error) {
//     console.error("Error inserting tracking: ", error);
//     res.status(500).json({ message: "Failed to insert tracking", error: error.message });
//   }
// };

const insertTracking = async (req, res) => {
  try {
    const { notification_id, details } = req.body; // Add details to the request body

    // Generate a 4-digit random number for tracking_pin
    const trackingPin = Math.floor(1000 + Math.random() * 9000);

    // Generate a tracking_key: #cs followed by 13 random digits
    const trackingKey = `#cs${Math.floor(1000000000000 + Math.random() * 9000000000000)}`;

    // Set service_status as "Commander collected the service item"
    const serviceStatus = "Collected Item";

    const query = `
      WITH selected AS (
        SELECT
          a.accepted_id,
          a.notification_id,
          a.user_notification_id,
          a.longitude,
          a.latitude,
          a.worker_id,
          a.service_booked,
          a.user_id,
          u.fcm_token
        FROM accepted a
        JOIN userfcm u ON a.user_id = u.user_id
        WHERE a.notification_id = $1
      )
      INSERT INTO servicetracking (
        accepted_id,
        notification_id,
        user_notification_id,
        longitude,
        latitude,
        worker_id,
        service_booked,
        user_id,
        created_at,
        tracking_pin,
        tracking_key,
        service_status,
        details
      )
      SELECT
        selected.accepted_id,
        selected.notification_id,
        selected.user_notification_id,
        selected.longitude,
        selected.latitude,
        selected.worker_id,
        selected.service_booked,
        selected.user_id,
        NOW(),
        $2,
        $3,
        $4,
        $5
      FROM selected
      RETURNING *,
        (SELECT fcm_token FROM selected);
    `;

    const values = [notification_id, trackingPin, trackingKey, serviceStatus, details];

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Accepted record not found" });
    }

    const { user_id, service_booked, worker_id } = result.rows[0];
    const screen = "";
    const encodedId = Buffer.from(notification_id.toString()).toString("base64");

    await createUserBackgroundAction(user_id, encodedId, screen, service_booked);
    await updateWorkerAction(worker_id, screen, screen);

    const fcmTokens = result.rows.map(row => row.fcm_token).filter(token => token);

    if (fcmTokens.length > 0) {
      const multicastMessage = {
        tokens: fcmTokens,
        notification: {
          title: "Click Solver",
          body: `Commander collected your Item to repair in his location.`,
        },
        data: {
          notification_id: notification_id.toString(),
          screen: 'Home',
        },
      };

      try {
        const response = await getMessaging().sendEachForMulticast(multicastMessage);
        response.responses.forEach((res, index) => {
          if (!res.success) {
            console.error(`Error sending message to token ${fcmTokens[index]}:`, res.error);
          }
        });
      } catch (error) {
        console.error('Error sending notifications:', error);
      }
    } else {
      console.error('No FCM tokens to send the message to.');
    }

    res.status(201).json({ message: "Tracking inserted successfully", data: result.rows[0] });
  } catch (error) {
    console.error("Error inserting tracking: ", error);
    res.status(500).json({ message: "Failed to insert tracking", error: error.message });
  }
};


const getWorkerTrackingServices = async (req, res) => {
  try {
    const workerId = req.worker.id;

    // SQL query to fetch service_status, created_at, tracking_id from servicetracking
    // and join with workerskills table to get service
    const query = `
      SELECT
        st.service_status,
        st.created_at,
        st.tracking_id,
        ws.service
      FROM servicetracking st
      JOIN workerskills ws ON st.worker_id = ws.worker_id
      WHERE st.worker_id = $1;
    `;

    const values = [workerId];

    // Execute the query
    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No tracking services found for the given notification ID" });
    }

    res.status(200).json(result.rows );
  } catch (error) {
    console.error("Error fetching worker tracking services: ", error);
    res.status(500).json({ message: "Failed to fetch worker tracking services", error: error.message });
  }
};

const serviceDeliveryVerification = async (req, res) => {
  const { trackingId, enteredOtp } = req.body;
  // console.log(trackingId,enteredOtp)

  try {
    
    const result = await client.query(
      'SELECT tracking_pin, notification_id FROM servicetracking WHERE tracking_id = $1',
      [trackingId]
    );

   
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Tracking ID not found' });
    }

   
    const { tracking_pin, notification_id } = result.rows[0];

    const NotificationEncodedId = Buffer.from(notification_id.toString()).toString("base64")
    if (enteredOtp === tracking_pin) {
      // If OTP matches, send a success response with notification_id
      return res.status(200).json({
        message: 'OTP verified successfully',
        encodedId: NotificationEncodedId
      });
    } else {
      // If OTP does not match, send an error response
      return res.status(400).json({ message: 'Invalid OTP' });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getUserTrackingServices = async (req, res) => {
  try {
    const userId = req.user.id;

    // SQL query to fetch service_status, created_at, tracking_id from servicetracking
    // and join with workerskills table to get service
    const query = `
      SELECT
        st.service_status,
        st.created_at,
        st.tracking_id,
        ws.service
      FROM servicetracking st
      JOIN workerskills ws ON st.worker_id = ws.worker_id
      WHERE st.user_id = $1;
    `;

    const values = [userId];

    // Execute the query
    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No tracking services found for the given notification ID" });
    }

    res.status(200).json(result.rows );
  } catch (error) {
    console.error("Error fetching worker tracking services: ", error);
    res.status(500).json({ message: "Failed to fetch worker tracking services", error: error.message });
  }
};

const getPendingWorkers = async (req, res) => {
  try {
    const query = `
      SELECT 
        w.worker_id,
        w.name,
        w.phone_number,
        w.verification_status,
        w.created_at,
        w.issues,
        w.email,
        ws.profile,
        ws.proof,
        ws.service,
        ws.subservices,
        ws.personaldetails,
        ws.address,
        ba.bank_name,
        ba.account_number,
        ba.ifsc_code,
        ba.account_holder_name
      FROM workers w
      INNER JOIN workerskills ws ON w.worker_id = ws.worker_id
      INNER JOIN bankaccounts ba ON w.worker_id = ba.worker_id
      WHERE w.worker_id IS NOT NULL;
    `;

    const { rows } = await client.query(query);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching pending workers:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getPendingWorkerDetails = async (req, res) => {
  try {
    const { workerId } = req.body;

    const query = `
      SELECT 
        w.worker_id,
        w.name,
        w.phone_number,
        w.verification_status,
        w.created_at,
        w.issues,
        w.email,
        ws.profile,
        ws.proof,
        ws.service,
        ws.subservices,
        ws.personaldetails,
        ws.address,
        ba.bank_name,
        ba.account_number,
        ba.ifsc_code,
        ba.account_holder_name
      FROM workers w
      INNER JOIN workerskills ws ON w.worker_id = ws.worker_id
      INNER JOIN bankaccounts ba ON w.worker_id = ba.worker_id
      WHERE w.worker_id = $1;
    `;

    const { rows } = await client.query(query, [workerId]);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching pending worker details:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


const updateIssues = async (req, res) => {
  const { workerId, issues } = req.body;

  if (!workerId || !issues) {
      return res.status(400).json({ message: 'workerId and issues are required.' });
  }

  try {
      // Update or insert worker's issues
        const query = `
        UPDATE workers
        SET issues = $2::jsonb
        WHERE worker_id = $1
    `;

      // Execute the query
      await client.query(query, [workerId, JSON.stringify(issues)]);

      return res.status(200).json({ message: 'Issues updated successfully.' });
  } catch (error) {
      console.error('Error updating issues:', error);
      return res.status(500).json({ message: 'An error occurred while updating issues.' });
  }
};

const updateApproveStatus = async (req, res) => {
  const { newStatus, workerId } = req.body;

  if (!newStatus || !workerId) {
      return res.status(400).json({ message: 'status and workerId are required.' });
  }

  try {
      // Update the verification_status for the specified worker_id
      const query = `
          UPDATE workers
          SET verification_status = $1
          WHERE worker_id = $2
      `;

      // Execute the query
      const result = await client.query(query, [newStatus, workerId]);

      // Check if any rows were updated
      if (result.rowCount === 0) {
          return res.status(404).json({ message: 'Worker not found.' });
      }

      return res.status(200).json({ message: 'Verification status updated successfully.' });
  } catch (error) {
      console.error('Error updating verification status:', error);
      return res.status(500).json({ message: 'An error occurred while updating verification status.' });
  }
};

// const checkApprovalVerificationStatus = async (req, res) => {
//   const  workerId  = req.worker.id;
//   if (!workerId) {
//       return res.status(400).json({ message: 'workerId is required.' });
//   }

//   try {
//       // Query to select the required fields from workers and join with workerskills
//       const query = `
//           SELECT w.name, w.issues, w.verification_status, ws.service
//           FROM workers w
//           JOIN workerskills ws ON w.worker_id = ws.worker_id
//           WHERE w.worker_id = $1
//       `;

//       // Execute the query
//       const result = await client.query(query, [workerId]);

//       // Check if any rows were returned
//       if (result.rows.length === 0) {
//           return res.status(404).json({ message: 'Worker not found.' });
//       }

//       return res.status(200).json(result.rows[0]); // Return the first row since worker_id should be unique
//   } catch (error) {
//       console.error('Error fetching approval verification status:', error);
//       return res.status(500).json({ message: 'An error occurred while fetching approval verification status.' });
//   }
// };

// const checkApprovalVerificationStatus = async (req, res) => {
//   const workerId = req.worker.id;
//   if (!workerId) {
//     return res.status(400).json({ message: 'workerId is required.' });
//   }

//   try {
//     // Using a WITH clause to check the worker in both tables
//     const query = `
//       WITH worker_check AS (
//         SELECT worker_id, 'workers' AS source, name, issues, verification_status
//         FROM workers
//         WHERE worker_id = $1
//         UNION ALL
//         SELECT worker_id, 'workersverified' AS source, NULL AS name, NULL AS issues, NULL AS verification_status
//         FROM workersverified
//         WHERE worker_id = $1
//       )
//       SELECT * FROM worker_check LIMIT 1;
//     `;


    

//     // Execute the query
//     const result = await client.query(query, [workerId]);

//     // Check if any rows were returned
//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: 'Worker not found.' });
//     }

//     // Determine the source and respond accordingly
//     const workerData = result.rows[0];

//     if (workerData.source === 'workersverified') {
//       return res.status(201).json({ message: 'Worker is verified.' });
//     }

//     // If the worker is in the workers table, send worker details
//     return res.status(200).json({
//       name: workerData.name,
//       issues: workerData.issues,
//       verification_status: workerData.verification_status,
//     });

//   } catch (error) {
//     console.error('Error fetching approval verification status:', error);
//     return res.status(500).json({ message: 'An error occurred while fetching approval verification status.' });
//   }
// };

const checkApprovalVerificationStatus = async (req, res) => {
  const workerId = req.worker.id;
  if (!workerId) {
    return res.status(400).json({ message: 'workerId is required.' });
  }

  try {
    // Using a WITH clause to check the worker in both tables and join with workerskills
    const query = `
      WITH worker_check AS (
        SELECT worker_id, 'workers' AS source, name, issues, verification_status
        FROM workers
        WHERE worker_id = $1
        UNION ALL
        SELECT worker_id, 'workersverified' AS source, NULL AS name, NULL AS issues, NULL AS verification_status
        FROM workersverified
        WHERE worker_id = $1
      )
      SELECT wc.*, ws.service
      FROM worker_check wc
      LEFT JOIN workerskills ws ON wc.worker_id = ws.worker_id
      LIMIT 1;
    `;

    // Execute the query
    const result = await client.query(query, [workerId]);

    // Check if any rows were returned
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    // Determine the source and respond accordingly
    const workerData = result.rows[0];

    if (workerData.source === 'workersverified') {
      return res.status(201).json({ message: 'Worker is verified.' });
    }

    // If the worker is in the workers table, send worker details
    return res.status(200).json({
      name: workerData.name,
      issues: workerData.issues,
      verification_status: workerData.verification_status,
      service: workerData.service, // Include the service field from workerskills
    });

  } catch (error) {
    console.error('Error fetching approval verification status:', error);
    return res.status(500).json({ message: 'An error occurred while fetching approval verification status.' });
  }
};




const workerApprove = async (req, res) => {
  const { workerId } = req.body;

  try {
    const query = `
      WITH moved_worker AS (
        DELETE FROM workers
        WHERE worker_id = $1
        RETURNING worker_id, name, email, phone_number
      )
      INSERT INTO workersverified (worker_id, name, email, phone_number)
      SELECT worker_id, name, email, phone_number FROM moved_worker;
    `;

    const result = await client.query(query, [workerId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Worker not found or already verified' });
    }

    res.status(200).json({ message: 'Worker approved and moved to workerverified table' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while approving the worker' });
  }
};

const getWorkersPendingCashback = async (req, res) => {
  try {
    const query = `
      SELECT 
        w.worker_id,
        w.cashback_approved_times - w.cashback_gain AS pending_cashback,
        v.name,
        v.created_at,
        s.service,
        s.profile
      FROM workerlife AS w
      JOIN workersverified AS v ON w.worker_id = v.worker_id
      JOIN workerskills AS s ON w.worker_id = s.worker_id
      WHERE (w.cashback_approved_times - w.cashback_gain) > 0;
    `;

    const result = await client.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching pending cashback for workers:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const workerCashbackPayed = async (req, res) => {
  const { worker_id, cashbackCount, cashbackPayed } = req.body;
  console.log(worker_id,cashbackPayed,cashbackCount)
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
    const newHistoryEntry = JSON.stringify([{
      amount: cashbackPayed,
      time: currentTime,
      paid: "paid by Click Solver",
      count: cashbackCount
    }]);

    // Execute the query with parameters
    const { rows } = await client.query(query, [
      cashbackCount,
      newHistoryEntry,
      worker_id
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    // Send the updated cashback information as response
    res.status(200).json({
      message: 'Cashback updated successfully',
      cashback_gain: rows[0].cashback_gain,
      cashback_history: rows[0].cashback_history
    });
  } catch (error) {
    console.error('Error updating cashback:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// optimized functions

const getServiceByName = async (req, res) => { 
  const { serviceName } = req.body;  // Get the service name from the request body
  console.log(serviceName)
  if (!serviceName) {
      return res.status(400).json({ error: 'Service name is required' });
  }

  try {
      // Use a single query to get both the service by name and the related services by title
      // const query = `
      //   SELECT s1.*, s2.*
      //   FROM services s1
      //   LEFT JOIN services s2 
      //   ON s1.service_title = s2.service_title
      //   WHERE s1.service_name = $1
      // `;
    //   const query = `
    //   SELECT a.*, s.*
    //   FROM allservices a
    //   LEFT JOIN services s ON a.service_category = s.service_name
    //   WHERE a.service_category = $1
    // `;

    const query = `
    SELECT a.*, r.service_urls
    FROM allservices a
    JOIN (
        SELECT r.related_services, r.service_urls
        FROM relatedservices r
        WHERE r.service_category = $1
    ) AS r ON a.service_tag = ANY(r.related_services)
    ORDER BY array_position(r.related_services, a.service_tag);
`;

    


      const result = await client.query(query, [serviceName]);
      

      if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Service not found' });
      }

      // Extract the main service (first row) and the related services (all matching rows)
      const serviceData = result.rows[0];  // First matching row is the main service
      const relatedServicesData = result.rows;  // All rows including the first are related services
      // console.log(serviceData,relatedServicesData.length)
      // Return the service and related services as response
      res.status(200).json({
          service: serviceData,  // The primary service
          relatedServices: relatedServicesData  // All related services including the primary one
      });

  } catch (error) {
      console.error('Error fetching service:', error);
      res.status(500).json({ error: 'An error occurred while fetching the service' });
  }
};


// Function to get all data from the 'locations' collection

const getAllLocations = async (workerIds) => {
  try {
    if(workerIds.length < 1){
      return []
    }
    const locationsRef = db.collection('locations');
    
    // Create a query to filter documents where workerId is in the workerIds array
    const query = locationsRef.where('worker_id', 'in', workerIds);

    const snapshot = await query.get();
    
    if (snapshot.empty) {
      return [];
    }

    let locations = [];
    snapshot.forEach(doc => {
      locations.push({ id: doc.id, ...doc.data() });
    });
    // console.log(locations)
    return locations;
  } catch (error) {
    console.error('Error getting locations:', error);
    return [];
  }
};

const getWorkerLocation =async (workerId) => {
  try {
    if (!workerId) {
      return [];
    }

    const locationsRef = db.collection('locations');
    const query = locationsRef.where('worker_id', '==', workerId);

    const snapshot = await query.get();

    if (snapshot.empty) {
      return [];
    }

    let locations = [];
    snapshot.forEach(doc => {
      locations.push({ id: doc.id, ...doc.data() });
    });
    // console.log(locations);
    return locations;
  } catch (error) {
    console.error('Error getting location:', error);
    return [];
  }
}


const getUserAndWorkerLocation = async (req, res) => {
  const { notification_id } = req.body;


  try {
    // Step 1: Get user longitude, latitude, and worker_id from accepted table using notification_id
    const query = `
      SELECT longitude, latitude, worker_id 
      FROM accepted 
      WHERE notification_id = $1
    `;
    const result = await client.query(query, [notification_id]);
  
    // Check if the notification exists in the table
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const { longitude: userLongitude, latitude: userLatitude, worker_id } = result.rows[0];

    // Step 2: Query Firestore for the worker's location by worker_id
    const workerLocationSnapshot = await db.collection('locations')
      .where('worker_id', '==', worker_id).limit(1).get();

    // Check if the worker's location was found
    if (workerLocationSnapshot.empty) {
      return res.status(404).json({ message: 'Worker location not found in Firestore' });
    }

    // Assuming only one document is returned (matching worker_id)
    const workerLocationData = workerLocationSnapshot.docs[0].data();

    // Extract the GeoPoint object from the worker's location data
    const workerLocationGeoPoint = workerLocationData.location;
    if (!workerLocationGeoPoint || !workerLocationGeoPoint.latitude || !workerLocationGeoPoint.longitude) {
      return res.status(500).json({ message: 'Worker GeoPoint data is missing or incomplete' });
    }

    const workerLongitude = workerLocationGeoPoint.longitude;
    const workerLatitude = workerLocationGeoPoint.latitude;

    // Step 3: Return both user and worker locations as arrays
    return res.status(200).json({
      endPoint: [Number(userLongitude), Number(userLatitude)],  // User's location
      startPoint: [workerLongitude, workerLatitude]  // Worker's location
    });

  } catch (error) {
    console.error('Error fetching locations:', error.message);
    return res.status(500).json({ message: 'Error fetching locations', error: error.message });
  }
};

const getServices = async () => {
  try {
    const result = await client.query('SELECT * FROM "servicecategories"');
    return result.rows;
  } catch (err) {
    console.error("Error fetching servicecategories:", err);
    throw err;
  }
};





const getIndividualServices = async (req, res) => {
  // Extract serviceTitle from the body of the POST request
  const { serviceObject} = req.body;
  
  try {
    // Query to select rows from "services" table where "service_title" matches the provided value
    const result = await client.query(
      'SELECT * FROM "services" WHERE "service_title" = $1',
      [serviceObject]
    );
    
    // Return the rows that match the query
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching services:", err);
    res.status(500).send("Internal Server Error");
  }
};

const getUserBookings = async (req, res) => {
  const userId = req.user.id;

  try {
    const query = `
    SELECT 
        u.user_notification_id,
        u.created_at,
        u.service,
        n.notification_id,
        s.payment,
        w.name AS provider,
        ws.profile AS worker_profile
    FROM usernotifications u
    JOIN notifications n ON u.user_notification_id = n.user_notification_id
    JOIN servicecall s ON n.notification_id = s.notification_id
    JOIN workersverified w ON s.worker_id = w.worker_id
    JOIN workerskills ws ON w.worker_id = ws.worker_id
    WHERE u.user_id = $1
    ORDER BY u.created_at DESC
`;

      const { rows } = await client.query(query, [userId]);

      res.status(200).json(rows);
  } catch (error) {
      console.error('Error fetching user bookings:', error);
      res.status(500).json({ error: 'An error occurred while fetching user bookings' });
  }
}; 

const getWorkerProfleDetails = async (req,res) => {
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
      console.error('Error fetching worker profile:', error);
      res.status(500).json({ error: 'An error occurred while fetching worker profile' });
  }
  
}

const getWorkerReviewDetails = async (req,res) => {
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
      u.name AS username
    FROM 
      feedback f
    JOIN 
      workersverified w ON f.worker_id = w.worker_id
    JOIN 
      workerskills ws ON ws.worker_id = w.worker_id
    JOIN 
      "user" u ON u.user_id = f.user_id
    WHERE 
      f.worker_id = $1
    ORDER BY 
      f.created_at DESC;
  `;

      const { rows } = await client.query(query, [workerId]);

      res.status(200).json(rows);
  } catch (error) {
      console.error('Error fetching worker reviews:', error);
      res.status(500).json({ error: 'An error occurred while fetching worker reviews' });
  }
  
}

const getWorkerBookings = async (req, res) => {
  const workerId = req.worker.id;

  try {
    const query = `
    SELECT 
        n.notification_id,
        n.service_booked,
        n.created_at,
        s.payment,
        s.payment_type,
        w.name AS provider,
        ws.profile AS worker_profile
    FROM completenotifications n
    JOIN servicecall s ON n.notification_id = s.notification_id
    JOIN workersverified w ON s.worker_id = w.worker_id
    JOIN workerskills ws ON w.worker_id = ws.worker_id
    WHERE n.worker_id = $1
    ORDER BY n.created_at DESC
`;


      const { rows } = await client.query(query, [workerId]);

      res.status(200).json(rows);
  } catch (error) {
      console.error('Error fetching user bookings:', error);
      res.status(500).json({ error: 'An error occurred while fetching user bookings' });
  }
}; 

const getUserAllBookings = async (req, res) => {
  const userId = req.user.id;

  try {
    const query = `
    SELECT 
        n.notification_id,
        n.service_booked,
        n.created_at,
        s.payment,
        s.payment_type,
        w.name AS provider
    FROM completenotifications n
    JOIN servicecall s ON n.notification_id = s.notification_id
    JOIN "user" w ON n.user_id = w.user_id
    WHERE n.user_id = $1
    ORDER BY n.created_at DESC
    `;

    const { rows } = await client.query(query, [userId]);

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ error: 'An error occurred while fetching user bookings' });
  }
};


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

const getUserById = async (req, res) => {
  const id = req.user.id;
  try {
    const result = await client.query(
      'SELECT * FROM "user" WHERE user_id = $1',
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error fetching user with ID ${id}:`, err);
    throw err;
  }
};

const getWorkerNotifications = async (req, res) => {
  const workerId = req.worker.id;
  const fcmToken = req.query.fcmToken; // Access fcmToken from query parameters
  
  try {
    const result = await client.query(`
      SELECT title, body, encodedId, data, receivedat
      FROM workernotifications
      WHERE worker_id = $1 AND fcm_token = $2
      ORDER BY receivedat DESC
      LIMIT 10;
    `, [workerId, fcmToken]); // Pass fcmToken as the second parameter

    const notifications = result.rows;
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

const getUserNotifications = async (req, res) => {
  const userId = req.user.id;
  const fcmToken = req.query.fcmToken; // Access fcmToken from query parameters
  
  try {
    const result = await client.query(`
      SELECT title, body, encodedId, data, receivedat
      FROM userrecievednotifications
      WHERE user_id = $1 AND fcm_token = $2
      ORDER BY receivedat DESC
      LIMIT 10;
    `, [userId, fcmToken]); // Pass fcmToken as the second parameter

    const notifications = result.rows;
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

const storeUserNotification = async (req, res) => {
  const userId = req.user.id;
  const {fcmToken,notification}= req.body;
  const { title, body, data, receivedAt, userNotificationId } = notification;
  try {
    const result = await client.query(
      'INSERT INTO userrecievednotifications (title, body, data, receivedat, user_id, encodedid, fcm_token) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [title, body, JSON.stringify(data), receivedAt, userId, userNotificationId, fcmToken]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error storing notification:', err);
    res.status(500).send('Error storing notification');
  }
};


const storeNotification = async (req, res) => {
  const workerId = req.worker.id;
  const {fcmToken,notification}= req.body;
  const { title, body, data, receivedAt, userNotificationId } = notification;
  const {cost} =data
  try {
    const result = await client.query(
      'INSERT INTO workernotifications (title, body, data, receivedat, worker_id, encodedid, fcm_token) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [title, body, cost, receivedAt, workerId, userNotificationId, fcmToken]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error storing notification:', err);
    res.status(500).send('Error storing notification');
  }
};

const updateWorkerAction = async (workerId,encodedId, screen) => {
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
    return userAction
  } catch (error) {
    console.error('Error inserting user action:', error);
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
    console.error('Error inserting user action:', error);
    res.status(500).json({ message: 'Error inserting user action' });
  }
};


// const createUserAction = async (req, res) => {
//   const userId = req.user.id; // Assuming req.user contains the authenticated user's information
//   const {
//     encodedId,
//     screen,
//     serviceBooked,
//     area,
//     city,
//     alternateName,
//     alternatePhoneNumber,
//     pincode,
//     location
//   } = req.body;

//   // console.log("User action creation initiated");

//   try {
//     // Define the SQL query to get the existing user action
//     const query = `
//       SELECT * FROM useraction
//       WHERE user_id = $1;
//     `;

//     // Execute the query to get the existing user action
//     const result = await client.query(query, [userId]);
//     const existingUserAction = result.rows[0];

//     // Determine whether the additional fields are present
//     const hasAdditionalFields = area || city || alternateName || alternatePhoneNumber || pincode;

//     if (existingUserAction) {
//       // If the user action exists, update the track array
//       let updatedTrack = existingUserAction.track;

//       if (screen === "") {
//         // Remove the object with the matching encodedId if screen is empty
//         updatedTrack = updatedTrack.filter(item => item.encodedId !== encodedId);
//       } else {
//         // Update or add the object with the new screen, encodedId, and additional fields
//         updatedTrack = updatedTrack.filter(item => item.encodedId !== encodedId);
        
//         const newAction = {
//           screen,
//           encodedId,
//           serviceBooked
//         };
//         // If additional fields are present, include them in the update
//         if (hasAdditionalFields) {
//           newAction.area = area;
//           newAction.city = city;
//           newAction.alternateName = alternateName;
//           newAction.alternatePhoneNumber = alternatePhoneNumber;
//           newAction.pincode = pincode;
//           newAction.location = location;
//         }

//         updatedTrack.push(newAction);
//       }

//       // Update the user action with the new track array
//       const updateQuery = `
//         UPDATE useraction
//         SET track = $1
//         WHERE user_id = $2
//         RETURNING *;
//       `;
//       const updateResult = await client.query(updateQuery, [JSON.stringify(updatedTrack), userId]);
//       const updatedTrackScreen = updateResult.rows[0];

//       // Respond with the updated user action data
//       res.json(updatedTrackScreen);
//     } else {
//       // If the user action does not exist, create a new one
//       let newTrack = [];
      
//       if (screen) {
//         const newAction = {
//           screen,
//           encodedId,
//           serviceBooked
//         };

//         // Include additional fields if they are present
//         if (hasAdditionalFields) {
//           newAction.area = area;
//           newAction.city = city;
//           newAction.alternateName = alternateName;
//           newAction.alternatePhoneNumber = alternatePhoneNumber;
//           newAction.pincode = pincode;
//         }

//         newTrack = [newAction];
//       }

//       const insertQuery = `
//         INSERT INTO useraction (user_id, track)
//         VALUES ($1, $2)
//         RETURNING *;
//       `;
//       const insertResult = await client.query(insertQuery, [userId, JSON.stringify(newTrack)]);
//       const updatedTrackScreen = insertResult.rows[0];

//       // Respond with the new user action data
//       res.json(updatedTrackScreen);
//     }
//   } catch (error) {
//     console.error('Error inserting or updating user action:', error);
//     res.status(500).json({ message: 'Error inserting or updating user action' });
//   }
// };

const createUserAction = async (req, res) => {
  const userId = req.user.id; // Assuming req.user contains the authenticated user's information
  const {
    encodedId,
    screen,
    serviceBooked,
    area,
    city,
    alternateName,
    alternatePhoneNumber,
    pincode,
    location
  } = req.body;

  console.log("User action creation initiated");

  try {
    // Define the SQL query to get the existing user action
    const query = `
      SELECT * FROM useraction
      WHERE user_id = $1;
    `;

    // Execute the query to get the existing user action
    const result = await client.query(query, [userId]);
    const existingUserAction = result.rows[0];

    // Determine whether the additional fields are present
    const hasAdditionalFields = area || city || alternateName || alternatePhoneNumber || pincode;

    if (existingUserAction) {
      // If the user action exists, update the track array
      let updatedTrack = existingUserAction.track;

      if (screen === "") {
        // Remove the object with the matching encodedId if screen is empty
        updatedTrack = updatedTrack.filter(item => item.encodedId !== encodedId);
      } else {
        // Update or add the object with the new screen, encodedId, and additional fields
        updatedTrack = updatedTrack.filter(item => item.encodedId !== encodedId);
        
        const newAction = {
          screen,
          encodedId,
          serviceBooked
        };
        // If additional fields are present, include them in the update
        if (hasAdditionalFields) {
          newAction.area = area;
          newAction.city = city;
          newAction.alternateName = alternateName;
          newAction.alternatePhoneNumber = alternatePhoneNumber;
          newAction.pincode = pincode;
          newAction.location = location;
        }

        updatedTrack.push(newAction);
      }

      // Update the user action with the new track array
      const updateQuery = `
        UPDATE useraction
        SET track = $1
        WHERE user_id = $2
        RETURNING *;
      `;
      const updateResult = await client.query(updateQuery, [JSON.stringify(updatedTrack), userId]);
      const updatedTrackScreen = updateResult.rows[0];

      // Respond with the updated user action data
      res.json(updatedTrackScreen);
    } else {
      // If the user action does not exist, create a new one
      let newTrack = [];
      
      if (screen) {
        const newAction = {
          screen,
          encodedId,
          serviceBooked
        };

        // Include additional fields if they are present
        if (hasAdditionalFields) {
          newAction.area = area;
          newAction.city = city;
          newAction.alternateName = alternateName;
          newAction.alternatePhoneNumber = alternatePhoneNumber;
          newAction.pincode = pincode;
        }

        newTrack = [newAction];
      }

      const insertQuery = `
        INSERT INTO useraction (user_id, track)
        VALUES ($1, $2)
        RETURNING *;
      `;
      const insertResult = await client.query(insertQuery, [userId, JSON.stringify(newTrack)]);
      const updatedTrackScreen = insertResult.rows[0];

      // Respond with the new user action data
      res.json(updatedTrackScreen);
    }
  } catch (error) {
    console.error('Error inserting or updating user action:', error);
    res.status(500).json({ message: 'Error inserting or updating user action' });
  }
};


const userActionRemove = async (req, res) => {
  const userId = req.user.id; // Assuming req.user contains the authenticated user's information
  const { screen, encodedId } = req.body;

  // console.log("Removing user action");

  try {
    // Step 1: Get the track field directly (no need to select the entire row)
    const query = `
      SELECT track FROM useraction
      WHERE user_id = $1;
    `;

    // Execute the query to get the current user's track data
    const result = await client.query(query, [userId]);
    const existingTrack = result.rows[0]?.track;

    if (!existingTrack) {
      return res.status(404).json({ message: 'User action not found' });
    }

    // Step 2: Filter out the object with the matching encodedId
    const updatedTrack = existingTrack.filter(item => item.encodedId !== encodedId);

    if (updatedTrack.length === existingTrack.length) {
      return res.status(404).json({ message: 'No matching encodedId found' });
    }

    // Step 3: Update the track array in the database
    const updateQuery = `
      UPDATE useraction
      SET track = $1
      WHERE user_id = $2
      RETURNING *;
    `;
    const updateResult = await client.query(updateQuery, [JSON.stringify(updatedTrack), userId]);

    // Step 4: Respond with the updated user action
    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Error removing user action:', error);
    res.status(500).json({ message: 'Error removing user action' });
  }
};

const getWorkerTrackRoute = async (req, res) => {
  const id = req.worker.id;
  try {
    // Query to select route and parameters based on user_id
    const query = `
        SELECT screen_name, params
        FROM workeraction 
        WHERE worker_id = $1
    `;
    const result = await client.query(query, [id]);

    if (result.rows.length > 0) {
      const route = result.rows[0].screen_name
      const parameter = result.rows[0].params
        res.status(200).json({route,parameter});
    } else {
        res.status(200).json({ error: 'No action found for the specified worker_id' });
    }
  } catch (err) {
    console.error(`Error fetching user with ID ${id}:`, err);
    throw err;
  }
};

const getUserTrackRoute = async (req, res) => {
  const id = req.user.id;

  try {
    // Query using a JOIN to fetch the user's name and track in one go
    const query = `
      SELECT u.name, ua.track
      FROM "user" u
      LEFT JOIN useraction ua ON u.user_id = ua.user_id
      WHERE u.user_id = $1;
    `;

    const result = await client.query(query, [id]);

    if (result.rows.length > 0) {
      const { name, track } = result.rows[0];

      if (track) {
        // If track exists, return both the track and user name
        res.status(200).json({ track, user: name });
      } else {
        // If no track, return only the user name
        res.status(203).json({ user: name });
      }
    } else {
      // If no user found, return a 404 error
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    console.error(`Error fetching user with ID ${id}:`, err);
    res.status(500).json({ message: 'Error fetching user data' });
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
      res.status(401).json({ message: 'Unauthorized' });
    }
  } catch (err) {
    console.error(`Error fetching user with ID ${id}:`, err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getUserByPhoneNumber = async (phone_number) => {
  try {
    const query = 'SELECT * FROM "user" WHERE phone_number = $1';
    const result = await client.query(query, [phone_number]);

    return result.rows.length ? result.rows[0] : null;
  } catch (error) {
    console.error("Error fetching user by phone number:", error);
    throw new Error('Database query failed');
  }
};

const getWorkerByPhoneNumber = async (phone_number) => {
  try {
    const result = await client.query(
      'SELECT * FROM "workersverified" WHERE phone_number = $1',
      [phone_number]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Error fetching user by phone number:", error);
    throw error;
  }
};

const login = async (req, res) => {
  const { phone_number } = req.body;
  // console.log(phone_number)
  if (!phone_number) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  try {
    // Find user by phone number
    const user = await getUserByPhoneNumber(phone_number);

    if (user) {
      // Generate a token for the user
      const token = generateToken(user);

      // Set the token as an HTTP-only cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
      });

      // Send the token in the response
      return res.json({ token });
    } else {
      // Return unauthorized if user not found
      return res.status(205).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// const getAllServices = async () => {
//   try {
//     const result = await client.query("SELECT * FROM services");
//     return result.rows;
//   } catch (error) {
//     console.error("Error fetching all services:", error);
//     throw error;
//   }
// };

const getAllServices = async () => {
  try {
    const result = await client.query("SELECT * FROM allservices");
    return result.rows;
  } catch (error) {
    console.error("Error fetching all services:", error);
    throw error;
  }
};

// const getServicesBySearch = async (req, res) => {
//   const searchQuery = req.query.search ? req.query.search.toLowerCase().trim() : "";

//   try {
//     const allServices = await getAllServices();

//     // Split search query into individual words (e.g., "ac machine" -> ["ac", "machine"])
//     const searchKeywords = searchQuery.split(" ").filter(Boolean);

//     // 1. First attempt: Exact or partial match for the full search query
//     let filteredServices = allServices.filter(
//       (service) =>
//         service.service_name.toLowerCase().includes(searchQuery) ||
//         service.service_title.toLowerCase().includes(searchQuery) ||
//         service.service_urls.toLowerCase().includes(searchQuery)
//     );

//     // 2. Second attempt: Match any of the individual keywords
//     if (filteredServices.length === 0 && searchKeywords.length > 0) {
//       filteredServices = allServices.filter((service) =>
//         searchKeywords.some((keyword) =>
//           service.service_name.toLowerCase().includes(keyword) ||
//           service.service_title.toLowerCase().includes(keyword) ||
//           service.service_urls.toLowerCase().includes(keyword)
//         )
//       );
//     }

//     // Return filtered results (empty or matched)
//     res.json(filteredServices);
//   } catch (error) {
//     console.error("Error fetching services:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

const getServicesBySearch = async (req, res) => {
  const searchQuery = req.query.search ? req.query.search.toLowerCase().trim() : "";

  try {
    const allServices = await getAllServices();

    // Split search query into individual words (e.g., "ac machine" -> ["ac", "machine"])
    const searchKeywords = searchQuery.split(" ").filter(Boolean);

    // 1. First attempt: Exact or partial match for the full search query
    let filteredServices = allServices.filter(
      (service) =>
        service.service_tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.service_category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.service_name?.toLowerCase().includes(searchQuery.toLowerCase()) // Ensure to handle null or undefined properties with optional chaining
    );
    
    // 2. Second attempt: Match any of the individual keywords
    if (filteredServices.length === 0 && searchKeywords.length > 0) {
      filteredServices = allServices.filter((service) =>
        searchKeywords.some((keyword) =>
          service.service_tag.toLowerCase().includes(keyword.toLowerCase()) ||
          service.service_category.toLowerCase().includes(keyword.toLowerCase()) ||
          service.service_name?.toLowerCase().includes(keyword.toLowerCase()) // Optional chaining for safety
        )
      );
    }
    

    // Return filtered results (empty or matched)
    
    res.json(filteredServices);
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
 
// Function to log in partner (worker)
// const Partnerlogin = async (req, res) => {
//   const { phone_number } = req.body;

//   if (!phone_number) {
//     return res.status(400).json({ message: "Phone number is required" });
//   }

//   try {
//     // Query the database to find the worker by phone number
//     const worker = await getWorkerByPhoneNumber(phone_number);

//     if (worker) {
//       // Generate token for the worker
//       const token = generateWorkerToken(worker);

//       // Set token in cookie with secure options
//       res.cookie("token", token, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "Strict",
//       });

//       // Return token in response
//       return res.json({ token });
//     }

//     // If worker is not found
//     return res.status(401).json({ message: "Invalid credentials" });
//   } catch (error) {
//     console.error("Error logging in worker:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

// Controller function to handle storing user location
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

const storeUserFcmToken = async (req, res) => {
  const { fcmToken } = req.body;
  const UserId = req.user.id;

  try {
    // Use INSERT ON CONFLICT to handle existing FCM tokens
    const insertQuery = `
      INSERT INTO userfcm (user_id, fcm_token)
      VALUES ($1, $2)
      ON CONFLICT (user_id, fcm_token)
      DO NOTHING;
    `;

    const result = await client.query(insertQuery, [UserId, fcmToken]);

    if (result.rowCount > 0) {
      // Token was inserted
      res.status(200).json({ message: "FCM token stored successfully" });
    } else {
      // Token already exists
      res.status(200).json({ message: "FCM token already exists for this user" });
    }
  } catch (error) {
    console.error("Error storing FCM token:", error);
    res.status(500).json({ error: "Failed to store FCM token" });
  }
};

const storeFcmToken = async (req, res) => {
  const { fcmToken } = req.body;
  const workerId = req.worker.id;

  try {
    // Use INSERT ON CONFLICT to handle existing FCM tokens
    const insertQuery = `
      INSERT INTO fcm (worker_id, fcm_token)
      VALUES ($1, $2)
      ON CONFLICT (worker_id, fcm_token)
      DO NOTHING;
    `;

    const result = await client.query(insertQuery, [workerId, fcmToken]);

    if (result.rowCount > 0) {
      // Token was inserted
      res.status(200).json({ message: "FCM token stored successfully" });
    } else {
      // Token already exists
      res.status(200).json({ message: "FCM token already exists for this worker" });
    }
  } catch (error) {
    console.error("Error storing FCM token:", error);
    res.status(500).json({ error: "Failed to store FCM token" });
  }
};

// Function to get current date and time formatted as TIMESTAMP WITHOUT TIME ZONE
const getCurrentTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const intervalSetForNotifications = new Set();

// Fetch location details for navigation ***
const getLocationDetails = async (req, res) => {
  try {
    const { notification_id } = req.query;

    if (!notification_id) {
      return res.status(400).json({ error: "Missing notification_id" });
    }

    const locationDetails = await fetchLocationDetails(notification_id);
    res.json(locationDetails);

    // Start the interval to update the navigation status to timeup after 4 minutes
    if (notification_id && !intervalSetForNotifications.has(notification_id)) {
      intervalSetForNotifications.add(notification_id);
      setTimeout(() => updateNavigationStatus(notification_id), 4 * 60 * 1000);
    }
  } catch (err) {
    console.error("Error fetching location details:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Function to fetch location details from the database
const fetchLocationDetails = async (notificationId) => {
  try {
    // Query to get the start and endpoint details using a JOIN between accepted and workerlocation tables
    const query = `
      SELECT 
        a.worker_id,
        a.longitude AS end_longitude, 
        a.latitude AS end_latitude
      FROM accepted a
      JOIN workerlocation wl ON a.worker_id = wl.worker_id
      WHERE a.notification_id = $1;
    `;

    const result = await client.query(query, [notificationId]);

    if (result.rows.length === 0) {
      throw new Error("Notification or Worker location not found");
    }

    const { end_longitude, end_latitude, worker_id } = result.rows[0];

    const location = await getWorkerLocation(worker_id);
    let start_latitude = null;
    let start_longitude = null;
    location.forEach((locationData) => {
      const {
        location: { _latitude: latitude, _longitude: longitude },
      } = locationData;
      start_longitude = longitude;
      start_latitude = latitude;
    });

    // console.log("worker", location);

    // Return the start and end points
    return {
      startPoint: [start_latitude, start_longitude],
      endPoint: [end_latitude, end_longitude],
    };
  } catch (err) {
    console.error("Error fetching location details:", err);
    throw err;
  }
};



// Check cancellation status
const checkCancellationStatus = async (req, res) => {
  try {
    const { notification_id } = req.query;
    const result = await client.query(
      "SELECT navigation_status FROM accepted WHERE notification_id = $1",
      [notification_id]
    );
    if (result.rows.length > 0) {
      const { navigation_status } = result.rows[0];
      res.json({ navigation_status });
    } else {
      res.status(404).json({ error: "Notification not found" });
    }
  } catch (error) {
    console.error("Error checking cancellation status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ***
const TimeStart = async (notification_id) => {
  // console.log("time ayindhi",notification_id)
  try {
    // Query to insert into ServiceCall and get the worker_id in one step
    const result = await client.query(`
      INSERT INTO servicecall (notification_id, start_time, worker_id)
      SELECT $1, $2, worker_id
      FROM accepted
      WHERE notification_id = $1
      RETURNING start_time
    `, [notification_id, new Date()]);

    if (result.rows.length > 0) {
      return result.rows[0].start_time;
    } else {
      return "Insertion failed";
    }
  } catch (error) {
    console.error("Error in TimeStart:", error);
    return "Error occurred";
  }
};

const updateUserNavigationStatus = async (notification_id) => {
  try {
    await client.query(
      `UPDATE accepted SET user_navigation_cancel_status = 'timeup' WHERE notification_id = $1`,
      [notification_id]
    );
  } catch (error) {
    console.error("Error updating user navigation status to timeup:", error);
  }
};

// Update navigation status to timeup after 4 minutes
const updateNavigationStatus = async (notification_id) => {
  try {
    const result = await client.query(
      "UPDATE accepted SET navigation_status = 'timeup' WHERE notification_id = $1",
      [notification_id]
    );
  } catch (error) {
    console.error("Error updating navigation status to timeup:", error);
    throw error; // Throw the error to handle it in calling functions
  }
};

// Define the controller function to check cancellation status
const userCancellationStatus = async (req, res) => {
  const { notification_id } = req.query;

  if (!notification_id) {
    return res.status(400).json({ error: "Notification ID is required" });
  }

  try {
    // Query the notifications table for the notification_status
    const result = await client.query(
      "SELECT user_navigation_cancel_status FROM accepted WHERE notification_id = $1",
      [notification_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    const notificationStatus = result.rows[0].user_navigation_cancel_status;

    // Send the notification status in the response
    res.json({ notificationStatus });
  } catch (error) {
    console.error("Error checking cancellation status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Controller function to get the cancellation status
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

// Controller function to get user address details
const getUserAddressDetails = async (req, res) => {
  const { notification_id } = req.query;

  try {
    // Query to fetch user address details by joining Notifications and UserNotifications tables
    const query = `
      SELECT 
        UN.city, 
        UN.area, 
        UN.pincode, 
        UN.alternate_phone_number, 
        UN.alternate_name 
      FROM 
        accepted N
      JOIN 
        UserNotifications UN ON N.user_notification_id = UN.user_notification_id
      WHERE 
        N.notification_id = $1
    `;

    // Execute the JOIN query
    const result = await client.query(query, [notification_id]);

    // Check if data was found
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notification or user address details not found" });
    }

    // Destructure and return the address details
    const { city, area, pincode, alternate_phone_number, alternate_name } = result.rows[0];
    // console.log(result.rows[0])

    res.json({
      city,
      area,
      pincode,
      alternate_phone_number,
      alternate_name,
    });
  } catch (error) {
    console.error("Error fetching user address details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


const rejectRequest = async (req, res) => {
  const { user_notification_id } = req.body;
  const worker_id = req.worker.id;

  try {
    const result = await client.query(
      "UPDATE notifications SET status = $1 WHERE user_notification_id = $2 AND worker_id = $3 RETURNING *",
      ["reject", user_notification_id, worker_id]
    );

    if (result.rowCount === 0) {
      res
        .status(404)
        .json({ message: "Notification not found or worker mismatch" });
    } else {
      res.status(200).json({
        message: "Status updated to reject",
        notification: result.rows[0],
      });
    }
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const createUserBackgroundAction = async (userId, encodedId, screen, serviceBooked, userNotificationEncodedId = null) => {
  // console.log('Service Booked:', screen,encodedId,serviceBooked);
  
  try {
    // Prepare the new action object if 'screen' is provided
    const newAction = screen
      ? {
          screen,
          encodedId,
          serviceBooked
        }
      : null;

    // Convert newAction to JSON string if it exists
    const newActionJson = newAction ? JSON.stringify(newAction) : null;

    // Prepare the initial track array for insertion
    const initialTrack = newAction ? JSON.stringify([newAction]) : JSON.stringify([]);

    // Define the UPSERT query with explicit casting for $4 and $5
    const upsertQuery = `
      INSERT INTO useraction (user_id, track)
      VALUES ($1, $2::jsonb)
      ON CONFLICT (user_id) DO UPDATE
      SET track = (
        SELECT 
          COALESCE(jsonb_agg(item), '[]'::jsonb)
        FROM 
          jsonb_array_elements(useraction.track) AS item
        WHERE 
          item->>'encodedId' <> $3
          AND ($4::text IS NULL OR item->>'encodedId' <> $4::text)
      ) || (
        CASE 
          WHEN $5::jsonb IS NOT NULL THEN $6::jsonb 
          ELSE '[]'::jsonb 
        END
      )
      RETURNING *;
    `;

    // Parameters for the query
    const params = [
      userId,                       // $1: user_id
      initialTrack,                 // $2: initial track array (JSONB)
      encodedId,                    // $3: encodedId to remove
      userNotificationEncodedId,    // $4: userNotificationEncodedId to remove (can be null)
      newActionJson,                // $5: new action JSON (if screen is provided)
      newActionJson ? `[${newActionJson}]` : '[]' // $6: new action as JSONB array or empty array
    ];

    // Execute the UPSERT query
    const result = await client.query(upsertQuery, params);

    // The result will contain the inserted or updated row
    const updatedTrackScreen = result.rows[0];

    // Return the updated user action data
    return updatedTrackScreen;
  } catch (error) {
    console.error('Error inserting or updating user background action:', error);
    throw error; // Re-throw the error after logging
  }
};




// const createUserBackgroundAction = async (userId, encodedId, screen, serviceBooked, userNotificationEncodedId = null) => {
//   console.log("call ayindhi",screen,encodedId,userId,serviceBooked);
//   try {
//     // Define the SQL query to get the existing user action
//     const query = `
//       SELECT * FROM useraction
//       WHERE user_id = $1;
//     `;

//     // Execute the query to get the existing user action
//     const result = await client.query(query, [userId]);
//     const existingUserAction = result.rows[0];

//     if (existingUserAction) {
//       // Remove objects that match `encodedId` or, if present, `userNotificationEncodedId`
//       let updatedTrack = existingUserAction.track.filter(item => {
//         // Exclude items that match `encodedId` and, if `userNotificationEncodedId` is provided, also exclude those
//         if (userNotificationEncodedId) {
//           return item.encodedId !== encodedId && item.encodedId !== userNotificationEncodedId;
//         }
//         return item.encodedId !== encodedId;
//       });

//       // Add the new action if `screen` is provided (for adding or updating)
//       if (screen) {
//         const newAction = {
//           screen,
//           encodedId,
//           serviceBooked
//         };

//         updatedTrack.push(newAction);
//       }

//       // Update the user action with the new track array
//       const updateQuery = `
//         UPDATE useraction
//         SET track = $1
//         WHERE user_id = $2
//         RETURNING *;
//       `;
//       const updateResult = await client.query(updateQuery, [JSON.stringify(updatedTrack), userId]);
//       const updatedTrackScreen = updateResult.rows[0];
//       console.log("update ayinadhi",updatedTrack)

//       // Respond with the updated user action data
//       return updatedTrackScreen;
//     } else {
//       // If the user action does not exist, create a new one
//       let newTrack = [];

//       if (screen) {
//         const newAction = {
//           screen,
//           encodedId,
//           serviceBooked
//         };

//         newTrack = [newAction];
//       }

//       const insertQuery = `
//         INSERT INTO useraction (user_id, track)
//         VALUES ($1, $2)
//         RETURNING *;
//       `;
//       const insertResult = await client.query(insertQuery, [userId, JSON.stringify(newTrack)]);
//       const updatedTrackScreen = insertResult.rows[0];
//       console.log("create ayindhi",updatedTrackScreen)
//       // Respond with the new user action data
//       return updatedTrackScreen;
//     }
//   } catch (error) {
//     console.error('Error inserting or updating user action:', error);
//   }
// };








const workCompletionCancel = async(req,res) =>{
  const { notification_id } = req.body;
  try{
    if(notification_id){
      const updateResult = await client.query(
        "UPDATE accepted SET complete_status = $1 WHERE notification_id = $2 RETURNING *",
        ["cancel", notification_id]
      );
    if(updateResult.rowCount>0){
      res.status(200).json({
        message: "Status updated to accept",
      });
    }
    }else{
      res.status(400).json({ message: "notification_id not there" });
    }
  }catch(error){

  }
}




// const acceptRequest = async (req, res) => {
//   const { user_notification_id } = req.body;
//   const worker_id = req.worker.id;

//   try {
//     // Start a transaction
//     await client.query('BEGIN');

//     // 1. Check if any rows with the same user_notification_id have the status 'accept'
//     const checkAcceptedResult = await client.query(
//       `SELECT 1 FROM accepted WHERE user_notification_id = $1 FOR UPDATE`,
//       [user_notification_id]
//     );

//     if (checkAcceptedResult.rowCount > 0) {
//       // Someone has already accepted this notification
//       await client.query('ROLLBACK');
//       return res.status(400).json({ message: "Someone already accepted the request." });
//     }

//     // 2. Get notification details
//     const notificationResult = await client.query(
//       `SELECT n.cancel_status, n.user_id, n.notification_id, n.service_booked, 
//               n.longitude, n.latitude
//        FROM notifications n
//        WHERE n.user_notification_id = $1 FOR UPDATE`,
//       [user_notification_id]
//     );

//     if (notificationResult.rows.length === 0) {
//       await client.query('ROLLBACK');
//       return res.status(404).json({ message: "Notification not found." });
//     }

//     const notificationData = notificationResult.rows[0];
//     // console.log("Notification Data:", notificationData);

//     // 3. Check if the notification has been canceled
//     if (notificationData.cancel_status === "cancel") {
//       await client.query('ROLLBACK');
//       return res.status(400).json({ message: "Cannot accept request; it has been canceled." });
//     }

//     // 4. Fetch FCM tokens associated with the user
//     const fcmResult = await client.query(
//       `SELECT uf.fcm_token
//        FROM userfcm uf
//        WHERE uf.user_id = $1`,
//       [notificationData.user_id]
//     );

//     const fcmTokens = fcmResult.rows.map(row => row.fcm_token).filter(token => token);
    
//     // 5. Prepare service_booked for insertion
//     let jsonbServiceBooked;
//     if (typeof notificationData.service_booked === 'object') {
//       jsonbServiceBooked = JSON.stringify(notificationData.service_booked);
//     } else if (typeof notificationData.service_booked === 'string') {
//       // Validate JSON string
//       try {
//         JSON.parse(notificationData.service_booked);
//         jsonbServiceBooked = notificationData.service_booked;
//       } catch (parseError) {
//         console.error("Invalid JSON in service_booked:", parseError);
//         await client.query('ROLLBACK');
//         return res.status(400).json({ message: "Invalid service_booked data." });
//       }
//     } else {
//       // Handle other data types if necessary
//       jsonbServiceBooked = JSON.stringify(notificationData.service_booked);
//     }

//     // 6. Insert into accepted table
//     const insertResult = await client.query(
//       `INSERT INTO accepted 
//          (user_notification_id, worker_id, notification_id, status, user_id, service_booked, pin, longitude, latitude)
//        VALUES 
//          ($1, $2, $3, $4, $5, $6, FLOOR(RANDOM() * 9000) + 1000, $7::numeric, $8::numeric)
//        RETURNING notification_id`,
//       [
//         user_notification_id,            // $1: user_notification_id
//         worker_id,                        // $2: worker_id
//         notificationData.notification_id, // $3: notification_id
//         "accept",                         // $4: status
//         notificationData.user_id,         // $5: user_id
//         jsonbServiceBooked,               // $6: service_booked
//         notificationData.longitude,       // $7: longitude
//         notificationData.latitude         // $8: latitude
//       ]
//     );

//     const insertedNotificationId = insertResult.rows[0].notification_id;

//     // 7. Delete the notification from notifications table
//     await client.query(
//       `DELETE FROM notifications WHERE user_notification_id = $1`,
//       [user_notification_id]
//     );

//     // 8. Commit the transaction
//     await client.query('COMMIT');

//     // 9. Send FCM Notifications if tokens exist
//     if (fcmTokens.length > 0) {
//       const multicastMessage = {
//         tokens: fcmTokens,
//         notification: {
//           title: "Click Solver",
//           body: `Commander has accepted your request; he will be there within 5 minutes.`,
//         },
//         data: {
//           notification_id: insertedNotificationId.toString(),
//           screen: 'UserNavigation',
//         },
//       };

//       // Send the notification using Firebase Cloud Messaging
//       const response = await getMessaging().sendEachForMulticast(multicastMessage);

//       // Log the responses for each token
//       response.responses.forEach((resp, index) => {
//         if (resp.success) {
//           // console.log(`Message sent successfully to token ${fcmTokens[index]}`);
//         } else {
//           console.error(`Error sending message to token ${fcmTokens[index]}:`, resp.error);
//         }
//       });

//       // console.log('Success Count:', response.successCount);
//       // console.log('Failure Count:', response.failureCount);
//     } else {
//       console.error('No FCM tokens to send the message to.');
//     }

//     // 10. Encode IDs for background action
//     const userNotificationEncodedId = Buffer.from(user_notification_id.toString()).toString("base64");
//     const encodedId = Buffer.from(insertedNotificationId.toString()).toString("base64");
//     const screen = "UserNavigation";

//     // 11. Ensure serviceBooked is correctly formatted (assuming it's JSON)
//     let parsedServiceBooked;
//     if (typeof notificationData.service_booked === 'string') {
//       try {
//         parsedServiceBooked = JSON.parse(notificationData.service_booked);
//       } catch (parseError) {
//         console.error("Error parsing service_booked JSON:", parseError);
//         // Depending on requirements, decide whether to rollback or continue
//         parsedServiceBooked = notificationData.service_booked;
//       }
//     } else {
//       parsedServiceBooked = notificationData.service_booked;
//     }

//     // 12. Update User Background Action
//     const backgroundActionResult = await createUserBackgroundAction(
//       notificationData.user_id,
//       encodedId,
//       screen,
//       parsedServiceBooked,
//       userNotificationEncodedId
//     );

//     // 13. Respond with success
//     res.status(200).json({
//       message: "Status updated to accept",
//       notificationId: insertedNotificationId,
//       backgroundAction: backgroundActionResult, // Optionally include background action data
//     });

//   } catch (error) {
//     // Rollback the transaction in case of any errors
//     try {
//       await client.query('ROLLBACK');
//     } catch (rollbackError) {
//       console.error("Error during ROLLBACK:", rollbackError);
//     }
//     console.error("Error updating status:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

const acceptRequest = async (req, res) => {
  const { user_notification_id } = req.body;
  const worker_id = req.worker.id;

  try {
    // Start a transaction
    await client.query('BEGIN');

    // Combined CTE to perform multiple operations
    const combinedQuery = `
    WITH check_accept AS (
      SELECT notification_id 
      FROM accepted 
      WHERE user_notification_id = $1 
      FOR UPDATE
    ),
    get_notification AS (
      SELECT 
        n.cancel_status, 
        n.user_id, 
        n.notification_id, 
        n.service_booked, 
        n.longitude, 
        n.latitude
      FROM notifications n
      WHERE n.user_notification_id = $1 
      FOR UPDATE
    ),
    insert_accept AS (
      INSERT INTO accepted 
        (user_notification_id, worker_id, notification_id, status, user_id, service_booked, pin, longitude, latitude, time)
      SELECT 
        $1, 
        $2, 
        gn.notification_id, 
        'accept', 
        gn.user_id, 
        CASE 
          WHEN jsonb_typeof(gn.service_booked::jsonb) IS NOT NULL THEN gn.service_booked::jsonb
          ELSE to_jsonb(gn.service_booked)
        END,
        FLOOR(RANDOM() * 9000) + 1000, 
        gn.longitude::numeric, 
        gn.latitude::numeric,
        jsonb_build_object(
          'accept', to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS'),
          'arrived', null,
          'workCompleted', null,
          'paymentCompleted', null
        )
      FROM get_notification gn
      RETURNING notification_id
    ),
    delete_notification AS (
      DELETE FROM notifications 
      WHERE user_notification_id = $1 
      RETURNING 1
    )
    SELECT 
      ia.notification_id AS inserted_notification_id,
      ca1.notification_id AS existing_notification_id,
      gn.cancel_status,
      gn.user_id,
      gn.service_booked,
      gn.longitude,
      gn.latitude
    FROM check_accept ca1
    RIGHT JOIN get_notification gn ON TRUE
    LEFT JOIN insert_accept ia ON TRUE
    LEFT JOIN delete_notification dn ON TRUE
  `;

    const combinedResult = await client.query(combinedQuery, [user_notification_id, worker_id]);

    // Extract the first row (since the query should return only one row)
    const row = combinedResult.rows[0];

    // **Check if someone already accepted the request**
    if (row.existing_notification_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: "Someone already accepted the request." });
    }

    // **Check if notification exists**
    if (!row.cancel_status && !row.user_id && !row.notification_id) {
      // If 'get_notification' didn't find any row, these fields would be undefined
      await client.query('ROLLBACK');
      return res.status(404).json({ message: "Notification not found." });
    }
    if (row.cancel_status === "cancel") {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: "Cannot accept request; it has been canceled." });
    }

    const insertedNotificationId = row.inserted_notification_id;
    const fcmResult = await client.query(
      `SELECT uf.fcm_token
       FROM userfcm uf
       WHERE uf.user_id = $1`,
      [row.user_id]
    );

    const fcmTokens = fcmResult.rows.map(r => r.fcm_token).filter(token => token);
    await client.query('COMMIT');
    if (fcmTokens.length > 0) {
      const multicastMessage = {
        tokens: fcmTokens,
        notification: {
          title: "Click Solver",
          body: `Commander has accepted your request; he will be there within 5 minutes.`,
        },
        data: {
          notification_id: insertedNotificationId.toString(),
          screen: 'UserNavigation',
        },
      };
      const response = await getMessaging().sendEachForMulticast(multicastMessage);
      response.responses.forEach((resp, index) => {
        if (resp.success) {
        } else {
          console.error(`Error sending message to token ${fcmTokens[index]}:`, resp.error);
        }
      });
    } else {
      console.error('No FCM tokens to send the message to.');
    }
    const userNotificationEncodedId = Buffer.from(user_notification_id.toString()).toString("base64");
    const encodedId = Buffer.from(insertedNotificationId.toString()).toString("base64");
    const screen = "UserNavigation";
    let parsedServiceBooked;
    if (typeof row.service_booked === 'string') {
      try {
        parsedServiceBooked = JSON.parse(row.service_booked);
      } catch (parseError) {
        console.error("Error parsing service_booked JSON:", parseError);
        parsedServiceBooked = row.service_booked;
      }
    } else {
      parsedServiceBooked = row.service_booked;
    }
    const backgroundActionResult = await createUserBackgroundAction(
      row.user_id,
      encodedId,
      screen,
      parsedServiceBooked,
      userNotificationEncodedId
    );
    res.status(200).json({
      message: "Status updated to accept",
      notificationId: insertedNotificationId,
      backgroundAction: backgroundActionResult, 
    });

  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error("Error during ROLLBACK:", rollbackError);
    }
    console.error("Error updating status:", error.message);
    console.error("Error Stack:", error.stack);
    res.status(500).json({ message: "Internal server error" });
  }
};



// const userNavigationCancel = async (req, res) => {
//   const { notification_id } = req.body;
//   const encodedUserNotificationId = Buffer.from(notification_id.toString()).toString("base64");

//   try {
//     // Combined UPDATE and SELECT using CTE
//     const combinedQuery = await client.query(`
//       WITH updated AS (
//         UPDATE accepted
//         SET user_navigation_cancel_status = 'usercanceled'
//         WHERE notification_id = $1
//           AND user_navigation_cancel_status IS NULL
//         RETURNING worker_id, notification_id
//       )
//       SELECT w.worker_id, f.fcm_token
//       FROM updated u
//       JOIN workersverified w ON w.worker_id = u.worker_id
//       JOIN fcm f ON f.worker_id = w.worker_id
//     `, [notification_id]);

//     console.log(combinedQuery.rows)

//     if (combinedQuery.rowCount > 0) {
//       const fcmTokens = combinedQuery.rows.map(row => row.fcm_token);

//       if (fcmTokens.length > 0) {
//         // Create the multicast message object for FCM tokens
//         const multicastMessage = {
//           tokens: fcmTokens,
//           notification: {
//             title: "Click Solver",
//             body: `Sorry for this, User cancelled the Service.`,
//           },
//           data: {
//             notification_id: encodedUserNotificationId,
//             screen: 'Home',
//           },
//         };

//         try {
//           // Send the message to multiple tokens using sendEachForMulticast
//           const response = await getMessaging().sendEachForMulticast(multicastMessage);

//           // Log the responses for each token
//           response.responses.forEach((res, index) => {
//             if (res.success) {
//               // Optionally log successful sends
//               // console.log(`Message sent successfully to token ${fcmTokens[index]}`);
//             } else {
//               console.error(`Error sending message to token ${fcmTokens[index]}:`, res.error);
//             }
//           });

//           // Optionally log success and failure counts
//           // console.log('Success Count:', response.successCount);
//           // console.log('Failure Count:', response.failureCount);
//         } catch (error) {
//           console.error('Error sending notifications:', error);
//           // Optionally handle notification sending errors differently
//         }

//         return res.status(200).json({ message: "Cancellation successful" });
//       } else {
//         console.error('No FCM tokens to send the message to.');
//         return res.status(200).json({ message: "Cancellation successful, but no FCM tokens found." });
//       }
//     } else {
//       // No rows updated implies either invalid notification_id or already canceled
//       return res.status(205).json({ message: "Cancellation not performed. Either invalid ID or already canceled." });
//     }
//   } catch (error) {
//     console.error('Error processing request:', error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };

const userNavigationCancel = async (req, res) => {
  const { notification_id } = req.body;
  const encodedUserNotificationId = Buffer.from(notification_id.toString()).toString("base64");

  try {
    // Begin a transaction
    await client.query('BEGIN');

    // First query: UPDATE and INSERT operations
    const combinedQuery = await client.query(`
      WITH updated AS (
        UPDATE accepted
        SET user_navigation_cancel_status = 'usercanceled'
        WHERE notification_id = $1
        RETURNING 
          accepted_id, 
          notification_id, 
          user_id, 
          user_notification_id, 
          longitude, 
          latitude, 
          created_at, 
          worker_id, 
          complete_status,
          time
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
          time
        )
        SELECT 
          accepted_id, 
          notification_id, 
          user_id, 
          user_notification_id, 
          longitude, 
          latitude, 
          created_at, 
          worker_id, 
          'cancel', 
          to_jsonb('service_booked'::text), 
          time
        FROM updated
        RETURNING worker_id, notification_id
      )
      SELECT i.worker_id, f.fcm_token
      FROM inserted i
      JOIN workersverified w ON w.worker_id = i.worker_id
      JOIN fcm f ON f.worker_id = w.worker_id;
    `, [notification_id]);

    // Second query: DELETE operation
    const deleteResult = await client.query(`
      DELETE FROM accepted
      WHERE notification_id = $1
      RETURNING *;
    `, [notification_id]);

    // Commit the transaction
    await client.query('COMMIT');

    if (combinedQuery.rowCount > 0) {
      const workerId = combinedQuery.rows[0].worker_id;
      const fcmTokens = combinedQuery.rows.map(row => row.fcm_token);

      if (fcmTokens.length > 0) {
        // Create the multicast message object for FCM tokens
        const multicastMessage = {
          tokens: fcmTokens,
          notification: {
            title: "Click Solver",
            body: `Sorry for this, User cancelled the Service.`,
          },
          data: {
            notification_id: encodedUserNotificationId,
            screen: 'Home',
          },
        };

        try {
          // Send the message to multiple tokens using sendEachForMulticast
          const response = await getMessaging().sendEachForMulticast(multicastMessage);

          // Log the responses for each token
          response.responses.forEach((res, index) => {
            if (res.success) {
              // Optionally log successful sends
              // console.log(`Message sent successfully to token ${fcmTokens[index]}`);
            } else {
              console.error(`Error sending message to token ${fcmTokens[index]}:`, res.error);
            }
          });
        } catch (error) {
          console.error('Error sending notifications:', error);
        }

        const screen = "";
        const encodedId = Buffer.from(notification_id.toString()).toString("base64");
        await updateWorkerAction(workerId, encodedId, screen);

        return res.status(200).json({ message: "Cancellation successful" });
      } else {
        const screen = "";
        const encodedId = Buffer.from(notification_id.toString()).toString("base64");
        await updateWorkerAction(workerId, encodedId, screen);
        console.error('No FCM tokens to send the message to.');
        return res.status(200).json({ message: "Cancellation successful, but no FCM tokens found." });
      }
    } else {
      return res.status(205).json({ message: "Cancellation not performed. Either invalid ID or already canceled." });
    }
  } catch (error) {
    // Rollback the transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error processing request:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// const userNavigationCancel = async (req, res) => {
//   const { notification_id } = req.body;
//   const encodedUserNotificationId = Buffer.from(notification_id.toString()).toString("base64");

//   try {
//     // Begin a transaction
//     await client.query('BEGIN');

//     // Combined UPDATE, INSERT, DELETE using CTEs
// // Combined UPDATE, INSERT, DELETE using CTEs
// const combinedQuery = await client.query(`
//   WITH updated AS (
//    UPDATE accepted
//    SET user_navigation_cancel_status = 'usercanceled'
//    WHERE notification_id = $1
//    RETURNING 
//      accepted_id, 
//      notification_id, 
//      user_id, 
//      user_notification_id, 
//      longitude, 
//      latitude, 
//      created_at, 
//      worker_id, 
//      complete_status,
//      time
//  ),
//  inserted AS (
//    INSERT INTO completenotifications (
//      accepted_id, 
//      notification_id, 
//      user_id, 
//      user_notification_id, 
//      longitude, 
//      latitude, 
//      created_at, 
//      worker_id, 
//      complete_status,
//      service_booked, 
//      time
//    )
//    SELECT 
//      accepted_id, 
//      notification_id, 
//      user_id, 
//      user_notification_id, 
//      longitude, 
//      latitude, 
//      created_at, 
//      worker_id, 
//      'cancel', 
//      to_jsonb('service_booked'::text), 
//      time
//    FROM updated
//    RETURNING worker_id, notification_id
//  ),
//       deleted_accepted_data AS (
//         DELETE FROM accepted
//         WHERE notification_id = $1
//         RETURNING *
//       ),
//  SELECT w.worker_id, f.fcm_token
//  FROM inserted i
//  JOIN workersverified w ON w.worker_id = i.worker_id
//  JOIN fcm f ON f.worker_id = w.worker_id
//  `, [notification_id]);
 


//     // Commit the transaction
//     await client.query('COMMIT');

//     if (combinedQuery.rowCount > 0) {
//       const workerId = combinedQuery.rows[0].worker_id;
//       const fcmTokens = combinedQuery.rows.map(row => row.fcm_token);

//       if (fcmTokens.length > 0) {
//         // Create the multicast message object for FCM tokens
//         const multicastMessage = {
//           tokens: fcmTokens,
//           notification: {
//             title: "Click Solver",
//             body: `Sorry for this, User cancelled the Service.`,
//           },
//           data: {
//             notification_id: encodedUserNotificationId,
//             screen: 'Home',
//           },
//         };

//         try {
//           // Send the message to multiple tokens using sendEachForMulticast
//           const response = await getMessaging().sendEachForMulticast(multicastMessage);

//           // Log the responses for each token
//           response.responses.forEach((res, index) => {
//             if (res.success) {
//               // Optionally log successful sends
//               // console.log(`Message sent successfully to token ${fcmTokens[index]}`);
//             } else {
//               console.error(`Error sending message to token ${fcmTokens[index]}:`, res.error);
//             }
//           });

//           // Optionally log success and failure counts
//           // console.log('Success Count:', response.successCount);
//           // console.log('Failure Count:', response.failureCount);
//         } catch (error) {
//           console.error('Error sending notifications:', error);
//           // Optionally handle notification sending errors differently
//         }

//         const screen = "";
//         const encodedId = Buffer.from(notification_id.toString()).toString("base64");
//         await updateWorkerAction(workerId, encodedId, screen);

//         return res.status(200).json({ message: "Cancellation successful" });
//       } else {
//         console.error('No FCM tokens to send the message to.');
//         return res.status(200).json({ message: "Cancellation successful, but no FCM tokens found." });
//       }
//     } else {
//       // No rows updated implies either invalid notification_id or already canceled
//       return res.status(205).json({ message: "Cancellation not performed. Either invalid ID or already canceled." });
//     }
//   } catch (error) {
//     // Rollback the transaction in case of error
//     await client.query('ROLLBACK');
//     console.error('Error processing request:', error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };

const workerNavigationCancel = async (req, res) => {
  const { notification_id } = req.body;
  const encodedUserNotificationId = Buffer.from(notification_id.toString()).toString("base64");

  try {
    // Begin a transaction
    await client.query('BEGIN');

    // First query: UPDATE and INSERT operations
    const combinedQuery = await client.query(`
      WITH updated AS (
        UPDATE accepted
        SET user_navigation_cancel_status = 'workercanceled'
        WHERE notification_id = $1
        RETURNING 
          accepted_id, 
          notification_id, 
          user_id, 
          user_notification_id, 
          longitude, 
          latitude, 
          created_at, 
          worker_id, 
          complete_status,
          time
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
          time
        )
        SELECT 
          accepted_id, 
          notification_id, 
          user_id, 
          user_notification_id, 
          longitude, 
          latitude, 
          created_at, 
          worker_id, 
          'cancel', 
          to_jsonb('service_booked'::text), 
          time
        FROM updated
        RETURNING user_id, notification_id, service_booked
      )
      SELECT i.user_id, f.fcm_token
      FROM inserted i
      JOIN "user" w ON w.user_id = i.user_id
      JOIN userfcm f ON f.user_id = w.user_id;
    `, [notification_id]);

    // Second query: DELETE operation
    const deleteResult = await client.query(`
      DELETE FROM accepted
      WHERE notification_id = $1
      RETURNING *;
    `, [notification_id]);

    // Commit the transaction
    await client.query('COMMIT');

    if (combinedQuery.rowCount > 0) {
      const userId = combinedQuery.rows[0].user_id;
      const serviceBooked = combinedQuery.rows[0].service_booked;

      const fcmTokens = combinedQuery.rows.map(row => row.fcm_token);

      if (fcmTokens.length > 0) {
        // Create the multicast message object for FCM tokens
        const multicastMessage = {
          tokens: fcmTokens,
          notification: {
            title: "Click Solver",
            body: `Sorry for this, User cancelled the Service.`,
          },
          data: {
            notification_id: encodedUserNotificationId,
            screen: 'Home',
          },
        };

        try {
          // Send the message to multiple tokens using sendEachForMulticast
          const response = await getMessaging().sendEachForMulticast(multicastMessage);

          // Log the responses for each token
          response.responses.forEach((res, index) => {
            if (res.success) {
              // Optionally log successful sends
              // console.log(`Message sent successfully to token ${fcmTokens[index]}`);
            } else {
              console.error(`Error sending message to token ${fcmTokens[index]}:`, res.error);
            }
          });
        } catch (error) {
          console.error('Error sending notifications:', error);
        }

        const screen = "";
        const encodedId = Buffer.from(notification_id.toString()).toString("base64");
        await createUserBackgroundAction(userId, encodedId, screen, serviceBooked);

        return res.status(200).json({ message: "Cancellation successful" });
      } else {
        const screen = "";
        const encodedId = Buffer.from(notification_id.toString()).toString("base64");
        await createUserBackgroundAction(userId, encodedId, screen, serviceBooked);
        console.error('No FCM tokens to send the message to.');
        return res.status(200).json({ message: "Cancellation successful, but no FCM tokens found." });
      }
    } else {
      return res.status(205).json({ message: "Cancellation not performed. Either invalid ID or already canceled." });
    }
  } catch (error) {
    // Rollback the transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error processing request:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


const workCompletedRequest = async (req, res) => {
  const { notification_id } = req.body;
  // console.log("comp", notification_id);
  const encodedUserNotificationId = Buffer.from(notification_id.toString()).toString("base64");

  try {
    // Query to get worker_id and fcm_tokens in one go using JOIN
    const result = await client.query(`
      SELECT f.worker_id, f.fcm_token 
      FROM accepted a
      JOIN fcm f ON a.worker_id = f.worker_id
      WHERE a.notification_id = $1
    `, [notification_id]);

    if (result.rows.length > 0) {
      const fcmTokens = result.rows.map(row => row.fcm_token);
      // console.log(fcmTokens);

      if (fcmTokens.length > 0) {
        // Create a multicast message object for all tokens
        const multicastMessage = {
          tokens: fcmTokens,
          notification: {
            title: "Click Solver",
            body: `It is the request from user with work has completed successfully. Click the notification and confirm the work completion.`,
          },
          data: {
            notification_id: encodedUserNotificationId.toString(),
            screen: 'TaskConfirmation',
          },
        };

        try {
          // Use sendEachForMulticast to send the same message to multiple tokens
          const response = await getMessaging().sendEachForMulticast(multicastMessage);

          // Log the responses for each token
          response.responses.forEach((res, index) => {
            if (res.success) {
              // console.log(`Message sent successfully to token ${fcmTokens[index]}`);
            } else {
              console.error(`Error sending message to token ${fcmTokens[index]}:`, res.error);
            }
          });

          // console.log('Success Count:', response.successCount);
          // console.log('Failure Count:', response.failureCount);

        } catch (error) {
          console.error('Error sending notifications:', error);
        }
      } else {
        console.error('No FCM tokens to send the message to.');
      }

      res.status(200).json({
        message: "Status updated to accept",
      });
    } else {
      res.status(205).json({
        message: "Nothing sent",
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: "Internal server error" });
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

// ***
// const userCancelNavigation = async (req, res) => {
//   const { notification_id } = req.body;

//   if (!notification_id) {
//     return res.status(400).json({ error: "Notification ID is required" });
//   }

//   try {
//     // Check the current status of the notification
//     const checkStatusQuery =
//       "SELECT user_navigation_cancel_status FROM accepted WHERE notification_id = $1";
//     const statusResult = await client.query(checkStatusQuery, [
//       notification_id,
//     ]);

//     if (statusResult.rows.length === 0) {
//       return res.status(404).json({ error: "Notification not found" });
//     }

//     const currentStatus = statusResult.rows[0].user_navigation_cancel_status;

//     if (currentStatus === "timeup") {
//       return res.status(404).json({ error: "Cancellation time is up" });
//     }

//     // Update the status to 'usercanceled'
//     const updateStatusQuery =
//       "UPDATE accepted SET user_navigation_cancel_status = $1 WHERE notification_id = $2";
//     await client.query(updateStatusQuery, ["usercanceled", notification_id]);

//     return res.status(200).json({ message: "Cancellation successful" });
//   } catch (error) {
//     console.error("Error updating cancellation status:", error);
//     return res.status(500).json({ error: "Server error" });
//   }
// };

// const userCancelNavigation = async (req, res) => {
//   const { notification_id } = req.body;


//   if (!notification_id) {
//     return res.status(400).json({ error: "Notification ID is required" });
//   }

//   try {
//     // Combine SELECT and conditional UPDATE into one query with a CASE statement
//     const query = `
//       UPDATE notifications
//       SET user_navigation_cancel_status = 'usercanceled'
//       WHERE notification_id = $1
//       AND user_navigation_cancel_status != 'timeup'
//       RETURNING user_navigation_cancel_status;
//     `;

//     const result = await client.query(query, [notification_id]);

//     // console.log(result.rowCount)

//     // If no rows are returned, the notification either doesn't exist or cannot be canceled
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: "Notification not found or time is up for cancellation" });
//     }

//     return res.status(200).json({ message: "Cancellation successful" });
//   } catch (error) {
//     console.error("Error updating cancellation status:", error);
//     return res.status(500).json({ error: "Server error" });
//   }
// };

const userCancelNavigation = async (req, res) => {
  const { notification_id } = req.body;

  if (!notification_id) {
    return res.status(400).json({ error: "Notification ID is required" });
  }

  try {
    // Update the status and check current status in a single query using RETURNING
    const query = `
      UPDATE accepted
      SET user_navigation_cancel_status = 'usercanceled'
      WHERE notification_id = $1
      AND (user_navigation_cancel_status IS NULL OR user_navigation_cancel_status != 'timeup')
      RETURNING user_navigation_cancel_status;
    `;

    const result = await client.query(query, [notification_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cancellation time is up or Notification not found" });
    }

    const updatedStatus = result.rows[0].user_navigation_cancel_status;

    // Check if the status was already updated to 'timeup'
    if (updatedStatus === "timeup") {
      return res.status(404).json({ error: "Cancellation time is up" });
    }

    return res.status(200).json({ message: "Cancellation successful" });
  } catch (error) {
    console.error("Error updating cancellation status:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// ***
// const workerCancelNavigation = async (req, res) => {
//   const { notification_id } = req.body;
//   // console.log(notification_id)
//   if (!notification_id) {
//     return res.status(400).json({ error: "Notification ID is required" });
//   }

//   try {
//     // Check the current status of the notification
//     const checkStatusQuery =
//       "SELECT navigation_status FROM accepted WHERE notification_id = $1";
//     const statusResult = await client.query(checkStatusQuery, [
//       notification_id,
//     ]);

//     if (statusResult.rows.length === 0) {
//       return res.status(404).json({ error: "Notification not found" });
//     }

//     const currentStatus = statusResult.rows[0].user_navigation_cancel_status;

//     if (currentStatus === "timeup") {
//       return res.status(404).json({ error: "Cancellation time is up" });
//     }

//     // Update the status to 'usercanceled'
//     const updateStatusQuery =
//       "UPDATE accepted SET navigation_status = $1 WHERE notification_id = $2";
//     await client.query(updateStatusQuery, ["workercanceled", notification_id]);

//     return res.status(200).json({ message: "Cancellation successful" });
//   } catch (error) {
//     console.error("Error updating cancellation status:", error);
//     return res.status(500).json({ error: "Server error" });
//   }
// };

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
      return res.status(404).json({ error: "Cancellation time is up or Notification not found" });
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

// Haversine formula to calculate the distance between two points on the Earth's surface
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const R = 6371; // Radius of the Earth in km

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

const generatePin = () => {
  return Math.floor(1000 + Math.random() * 9000); // Generates a 4-digit random number
};

const formattedDate = () =>{
  const currentDateTime = new Date();
  return currentDateTime.toLocaleDateString();
}

const formattedTime = () =>{
  const currentDateTime = new Date();
  return currentDateTime.toLocaleTimeString();
}

// ***
// const getWorkersNearby = async (req, res) => {
//   const user_id = req.user.id;
//   const { area, pincode, city, alternateName, alternatePhoneNumber,serviceBooked } = req.body;
//   // console.log(serviceBooked)
//   const created_at = getCurrentTimestamp();

//   try {
//     // Get user details
//     const userQuery = 'SELECT * FROM "user" WHERE user_id = $1';
//     const userResult = await client.query(userQuery, [user_id]);
//     if (userResult.rows.length === 0) {
//       return res.status(404).json({ error: "User not found" });
//     }
//     const user = userResult.rows[0];

//     // Get user location
//     const userLocationQuery = "SELECT * FROM userlocation WHERE user_id = $1";
//     const userLocationResult = await client.query(userLocationQuery, [user_id]);
//     if (userLocationResult.rows.length === 0) {
//       return res.status(404).json({ error: "User location not found" });
//     }
//     const userLocation = userLocationResult.rows[0];

//     // Insert user location into userNotifications table
//     const insertUserNotificationQuery = `
//     INSERT INTO userNotifications (user_id, longitude, latitude, created_at, area, pincode, city, alternate_name, alternate_phone_number,service)
//     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,$10)
//     RETURNING user_notification_id
//     `;
//     const userNotificationResult = await client.query(
//       insertUserNotificationQuery,
//       [
//         user_id,
//         userLocation.longitude,
//         userLocation.latitude,
//         created_at,
//         area,
//         pincode,
//         city,
//         alternateName,
//         alternatePhoneNumber,
//         serviceBooked
//       ]
//     );
//     const userNotificationId =
//       userNotificationResult.rows[0].user_notification_id;

//     // Insert user notification into userrecentnotifications table with conflict handling
//     const insertUserRecentNotificationQuery = `
//       INSERT INTO userrecentnotifications (user_notification_id, user_id, longitude, latitude, created_at)
//       VALUES ($1, $2, $3, $4, $5)
//       ON CONFLICT (user_id) DO UPDATE SET
//         user_notification_id = EXCLUDED.user_notification_id,
//         longitude = EXCLUDED.longitude,
//         latitude = EXCLUDED.latitude,
//         created_at = EXCLUDED.created_at
//       RETURNING recent_notification_id
//     `;
//     const userRecentNotificationResult = await client.query(
//       insertUserRecentNotificationQuery,
//       [
//         userNotificationId,
//         user_id,
//         userLocation.longitude,
//         userLocation.latitude,
//         created_at,
//       ]
//     );
//     const recentNotificationId =
//       userRecentNotificationResult.rows[0].recent_notification_id;


//     // // // Get all worker locations
//     // const workerLocationsQuery = "SELECT * FROM workerlocation";
//     // const workerLocationsResult = await client.query(workerLocationsQuery);
//     const query = `
//     SELECT worker_id 
//     FROM workerskills
//     WHERE $1 = ANY(subservices);
//   `;

//   // Execute query
//   const result = await client.query(query, [serviceBooked]);

//   // Extract worker IDs from result
//   const workerIds = result.rows.map(row => row.worker_id);

//   // console.log('Worker IDs:', workerIds);



    
//     const workerDb = await getAllLocations(workerIds)


//     // Filter workersverified within 2 km radius
//     const nearbyWorkers = [];
//     workerDb.forEach((workerLocation) => {
//       const distance = haversineDistance(
//         userLocation.latitude,
//         userLocation.longitude,
//         workerLocation.location._latitude,
//         workerLocation.location._longitude
//       );
//       if (distance <= 2) {
//         nearbyWorkers.push(workerLocation.worker_id);
//       }
//     });

//     // Get details of workersverified within 2 km radius
//     if (nearbyWorkers.length > 0) {
//       const workerDetailsQuery = `
//         SELECT w.*, wl.longitude, wl.latitude
//         FROM workersverified w
//         JOIN workerlocation wl ON w.worker_id = wl.worker_id
//         WHERE w.worker_id = ANY($1::int[])
//       `;
//       const workerDetailsResult = await client.query(workerDetailsQuery, [
//         nearbyWorkers,
//       ]);

//       // Generate a 4-digit PIN
//       const pin = generatePin();

//       // Insert worker details into notifications table
//       const insertNotificationsQuery = `
//         INSERT INTO notifications (recent_notification_id, user_notification_id, user_id, worker_id, longitude, latitude, created_at, pin, service)
//         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
//       `;
//       for (const worker of workerDetailsResult.rows) {
//         await client.query(insertNotificationsQuery, [
//           recentNotificationId,
//           userNotificationId,
//           user_id,
//           worker.worker_id,
//           userLocation.longitude,
//           userLocation.latitude,
//           created_at,
//           pin,
//           serviceBooked
//         ]);
//       }

//       const encodedUserNotificationId = Buffer.from(
//         userNotificationId.toString()
//       ).toString("base64");

//       // Get FCM tokens for nearby workersverified
//       const fcmTokensQuery = `
//         SELECT fcm_token FROM fcm WHERE worker_id = ANY($1::int[])
//       `;
//       const fcmTokensResult = await client.query(fcmTokensQuery, [
//         nearbyWorkers,
//       ]);
//       const fcmTokens = fcmTokensResult.rows.map((row) => row.fcm_token);

//       // console.log(fcmTokens)
      

//       // Send notifications to nearby workersverified
//       // const messages = fcmTokens.map((token) => ({
//       //   token,
//       //   notification: {
//       //     title: "Click Solver",
//       //     body: `You have a new job request from a user. Click to accept and help the user. ${encodedUserNotificationId.toString()}`, // Modify body as needed
//       //   },
//       //   data: {
//       //     user_notification_id: encodedUserNotificationId.toString(), // Ensure user_notification_id is a string
//       //     click_action: "FLUTTER_NOTIFICATION_CLICK",
//       //     targetUrl: `/acceptance/${encodedUserNotificationId}`,
//       //   },
//       // }));

//       if (fcmTokens.length > 0) {
//         // Create the multicast message object
//         const multicastMessage = {
//           tokens: fcmTokens, // An array of tokens to send the same message to
//           notification: {
//             title: serviceBooked,
//             body: `${area}, ${city}, ${pincode}`,
//           },
//           data: {
//             user_notification_id: encodedUserNotificationId.toString(),
//             click_action: "FLUTTER_NOTIFICATION_CLICK",
//             cost:'199',
//             targetUrl: `/acceptance/${encodedUserNotificationId}`,
//             screen: 'Acceptance',
//             date: formattedDate(), // Add the current date
//             time: formattedTime(), // Add the current time
//           },
//         };
      
//         try {
//           // Use sendEachForMulticast to send the same message to multiple tokens
//           const response = await getMessaging().sendEachForMulticast(multicastMessage);
      
//           // Log the responses for each token
//           response.responses.forEach((res, index) => {
//             if (res.success) {
//               // console.log(`Message sent successfully to token ${fcmTokens[index]}`);
//             } else {
//               console.error(`Error sending message to token ${fcmTokens[index]}:`, res.error);
//             }
//           });
      
//           // console.log('Success Count:', response.successCount);
//           // console.log('Failure Count:', response.failureCount);
      
//         } catch (error) {
//           console.error('Error sending notifications:', error);
//         }
//       } else {
//         console.error('No FCM tokens to send the message to.');
//       }

//       return res.status(200).json(encodedUserNotificationId);
//     } else {
//       return res
//         .status(200) 
//         .json("No workersverified found within 2 km radius" );
//     }
//   } catch (error) {
//     console.error("Error fetching workersverified:", error);
//     return res.status(500).json({ error: "Server error" });
//   }
// };

async function getWorkerLocations(workerIds) {
  try {
    const workersCollection = db.collection('locations');
    const workerLocations = [];

    // Use a batch get to fetch all worker documents by their IDs
    const workerSnapshots = await Promise.all(
      workerIds.map(workerId => workersCollection.doc(workerId).get())
    );

    workerSnapshots.forEach(docSnapshot => {
      if (docSnapshot.exists) {
        const data = docSnapshot.data();
        if (data.location) {
          workerLocations.push({
            worker_id: docSnapshot.id,
            latitude: data.location.latitude,
            longitude: data.location.longitude,
          });
        }
      }
    });

    return workerLocations;
  } catch (error) {
    console.error('Error fetching worker locations:', error);
    throw new Error('Unable to fetch worker locations');
  }
}

// this is the main getworkersNearby

const getWorkersNearby = async (req, res) => {
  const user_id = req.user.id;
  const { area, pincode, city, alternateName, alternatePhoneNumber, serviceBooked } = req.body;
  const created_at = getCurrentTimestamp();
  const serviceArray = JSON.stringify(serviceBooked);

  
  try {
    // Get user details and location in one query using a JOIN
    const userQuery = `
      SELECT u.*, ul.longitude, ul.latitude
      FROM "user" u
      JOIN userlocation ul ON u.user_id = ul.user_id
      WHERE u.user_id = $1
    `;
    const userResult = await client.query(userQuery, [user_id]);
   
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found or location not found" });
    }
    const user = userResult.rows[0];

    // Insert user location into userNotifications table
    const insertUserNotificationQuery = `
      INSERT INTO userNotifications (user_id, longitude, latitude, created_at, area, pincode, city, alternate_name, alternate_phone_number, service_booked)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING user_notification_id
    `;
    const userNotificationResult = await client.query(insertUserNotificationQuery, [
      user_id, user.longitude, user.latitude, created_at, area, pincode, city, alternateName, alternatePhoneNumber, serviceArray
    ]);
    const userNotificationId = userNotificationResult.rows[0].user_notification_id;

    // Insert into userrecentnotifications with conflict handling
    const insertUserRecentNotificationQuery = `
      INSERT INTO userrecentnotifications (user_notification_id, user_id, longitude, latitude, created_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id) DO UPDATE SET
        user_notification_id = EXCLUDED.user_notification_id,
        longitude = EXCLUDED.longitude,
        latitude = EXCLUDED.latitude,
        created_at = EXCLUDED.created_at
      RETURNING recent_notification_id
    `;
    const userRecentNotificationResult = await client.query(insertUserRecentNotificationQuery, [
      userNotificationId, user_id, user.longitude, user.latitude, created_at
    ]);
    const recentNotificationId = userRecentNotificationResult.rows[0].recent_notification_id;

// console.log("serviceArray:", serviceBooked, "Type:", typeof serviceBooked);

    // Extract service names from the serviceBooked array
    const serviceNames = serviceBooked.map(service => service.serviceName);
    const totalCost = serviceBooked.reduce((accumulator, service) => {
      return accumulator + service.cost;
    }, 0); // Start with 0
    
    // Create the query to find worker_ids with all serviceNames
    const workerServiceQuery = `
      SELECT worker_id
      FROM workerskills
      WHERE 
        $1::text[] <@ subservices
      GROUP BY worker_id
    `;
    // Execute the query, passing in the serviceNames array
    const workerServiceResult = await client.query(workerServiceQuery, [serviceNames]);

    
    // Extract the worker_ids from the result
    const workerIds = workerServiceResult.rows.map(row => row.worker_id);
    
    if (workerIds.length === 0) {
      return res.status(200).json("No workersverified found within 2 km radius");
    }

 


    const workerDb = await getAllLocations(workerIds)
    // console.log("db",workerDb)

    // Filter workersverified within 2 km radius
    const nearbyWorkers = [];
    workerDb.forEach((workerLocation) => {
      const distance = haversineDistance(
        user.latitude, 
        user.longitude,
        workerLocation.location._latitude,
        workerLocation.location._longitude
      );
      if (distance <= 2) {
        nearbyWorkers.push(workerLocation.worker_id);
      }
    });


    


    if (nearbyWorkers.length === 0) {
      return res.status(200).json("No workersverified found within 2 km radius");
    }

    // Insert worker details into notifications table
    const pin = generatePin();
    const insertNotificationsQuery = `
      INSERT INTO notifications (recent_notification_id, user_notification_id, user_id, worker_id, longitude, latitude, created_at, pin, service_booked)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    for (const worker of nearbyWorkers) {
      await client.query(insertNotificationsQuery, [
        recentNotificationId, userNotificationId, user_id, worker.worker_id,
        user.longitude, user.latitude, created_at, pin, serviceArray
      ]);
    }

    const encodedUserNotificationId = Buffer.from(userNotificationId.toString()).toString("base64");

    // Get FCM tokens and send notifications
    const fcmTokensQuery = `
    SELECT fcm_token FROM fcm WHERE worker_id = ANY($1::int[])
    `;
    const fcmTokensResult = await client.query(fcmTokensQuery, [
      nearbyWorkers,
    ]);
    const fcmTokens = fcmTokensResult.rows.map((row) => row.fcm_token);

    if (fcmTokens.length > 0) {
        // 1. Normal Notification Message (with `notification` payload)
        const normalNotificationMessage = {
            tokens: fcmTokens,
            notification: {
                title: serviceArray,
                body: `${area}, ${city}, ${pincode}`,
            },
            data: {
                user_notification_id: encodedUserNotificationId.toString(),
                service: serviceArray,
                location: `${area}, ${city}, ${pincode}`,
                coordinates: `${user.latitude},${user.longitude}`,
                click_action: "FLUTTER_NOTIFICATION_CLICK",
                cost: totalCost.toString(),
                targetUrl: `/acceptance/${encodedUserNotificationId}`,
                screen: 'Acceptance',
                date: formattedDate(),
                time: formattedTime(),
                type: "normal" // Adding a custom type to distinguish notifications if needed
            },
            android: {
                priority: "high",
            }
        };

        // 2. Silent Notification Message (data-only, no `notification` payload)
        const silentNotificationMessage = {
            tokens: fcmTokens,
            data: {
                user_notification_id: encodedUserNotificationId.toString(),
                service: serviceArray,
                location: `${area}, ${city}, ${pincode}`,
                click_action: "FLUTTER_NOTIFICATION_CLICK",
                coordinates: `${user.latitude},${user.longitude}`,
                cost: totalCost.toString(),
                targetUrl: `/acceptance/${encodedUserNotificationId}`,
                screen: 'Acceptance',
                date: formattedDate(),
                time: formattedTime(),
                type: "silent"
            },
            android: {
                priority: "high",
                contentAvailable: true,
            }
        };

        try {
            // Send Normal Notification (visible)
            const normalResponse = await getMessaging().sendEachForMulticast(normalNotificationMessage);
            normalResponse.responses.forEach((res, index) => {
                if (res.success) {
                    // console.log(`Normal message sent successfully to token ${fcmTokens[index]}`);
                } else {
                    console.error(`Error sending normal message to token ${fcmTokens[index]}:`, res.error);
                }
            });

            // Send Silent Notification (background processing)
            const silentResponse = await getMessaging().sendEachForMulticast(silentNotificationMessage);
            silentResponse.responses.forEach((res, index) => {
                if (res.success) {
                    // console.log(`Silent message sent successfully to token ${fcmTokens[index]}`);
                } else {
                    console.error(`Error sending silent message to token ${fcmTokens[index]}:`, res.error);
                }
            });

            // console.log('Normal Notification Success Count:', normalResponse.successCount);
            // console.log('Normal Notification Failure Count:', normalResponse.failureCount);
            // console.log('Silent Notification Success Count:', silentResponse.successCount);
            // console.log('Silent Notification Failure Count:', silentResponse.failureCount);
        } catch (error) {
            console.error('Error sending notifications:', error);
        }
    } else {
      console.error('No FCM tokens to send the message to.');
    }

    return res.status(200).json(encodedUserNotificationId);
  } catch (error) {
    console.error("Error fetching workersverified:", error);
    return res.status(500).json({ error: "Server error" });
  }
};


// const getWorkersNearby = async (req, res) => {
//   const user_id = req.user.id;
//   const {
//     area,
//     pincode,
//     city,
//     alternateName,
//     alternatePhoneNumber,
//     serviceBooked,
//   } = req.body;
//   const created_at = getCurrentTimestamp();
//   const serviceArray = JSON.stringify(serviceBooked);

//   try {
//     // Start a transaction
//     await client.query('BEGIN');

//     // Get user details and insert into userNotifications and userrecentnotifications
//     const userQuery = `
//       WITH user_data AS (
//         SELECT u.*, ul.longitude, ul.latitude
//         FROM "user" u
//         JOIN userlocation ul ON u.user_id = ul.user_id
//         WHERE u.user_id = $1
//       ), inserted_notification AS (
//         INSERT INTO userNotifications (user_id, longitude, latitude, created_at, area, pincode, city, alternate_name, alternate_phone_number, service_booked)
//         SELECT user_id, longitude, latitude, $2, $3, $4, $5, $6, $7, $8
//         FROM user_data
//         RETURNING user_notification_id
//       ), upsert_recent_notification AS (
//         INSERT INTO userrecentnotifications (user_notification_id, user_id, longitude, latitude, created_at)
//         SELECT user_notification_id, user_id, longitude, latitude, $2
//         FROM inserted_notification, user_data
//         ON CONFLICT (user_id) DO UPDATE SET
//           user_notification_id = EXCLUDED.user_notification_id,
//           longitude = EXCLUDED.longitude,
//           latitude = EXCLUDED.latitude,
//           created_at = EXCLUDED.created_at
//         RETURNING recent_notification_id
//       )
//       SELECT * FROM user_data, inserted_notification, upsert_recent_notification;
//     `;

//     const userResult = await client.query(userQuery, [
//       user_id,
//       created_at,
//       area,
//       pincode,
//       city,
//       alternateName,
//       alternatePhoneNumber,
//       serviceArray,
//     ]);

//     if (userResult.rows.length === 0) {
//       await client.query('ROLLBACK');
//       return res
//         .status(404)
//         .json({ error: 'User not found or location not found' });
//     }

//     const user = userResult.rows[0];
//     const userNotificationId = user.user_notification_id;
//     const recentNotificationId = user.recent_notification_id;

//     // Extract service names and total cost
//     const serviceNames = serviceBooked.map((service) => service.serviceName);
//     const totalCost = serviceBooked.reduce(
//       (accumulator, service) => accumulator + service.cost,
//       0
//     );

//     // Get worker_ids, fcm_tokens in one query
//     const workerServiceQuery = `
//       SELECT ws.worker_id, fcm.fcm_token
//       FROM workerskills ws
//       JOIN fcm ON ws.worker_id = fcm.worker_id
//       WHERE $1::text[] <@ ws.subservices
//       GROUP BY ws.worker_id, fcm.fcm_token
//     `;

//     const workerServiceResult = await client.query(workerServiceQuery, [
//       serviceNames,
//     ]);

//     const workersverified = workerServiceResult.rows;

//     if (workersverified.length === 0) {
//       await client.query('COMMIT');
//       return res.status(200).json('No workersverified found for the requested services');
//     }

//     // Fetch worker locations from Firestore in batches
//     const workerIds = workersverified.map((worker) => worker.worker_id);
//     const workerLocations = await getAllLocations(workerIds);

//     // Filter workersverified within 2 km radius
//     const nearbyWorkers = [];
//     const fcmTokens = [];
//     workerLocations.forEach((workerLocation) => {
//       const distance = haversineDistance(
//         user.latitude,
//         user.longitude,
//         workerLocation.location._latitude,
//         workerLocation.location._longitude
//       );
//       if (distance <= 2) {
//         nearbyWorkers.push(workerLocation.worker_id);
//         const worker = workersverified.find(
//           (w) => w.worker_id === workerLocation.worker_id
//         );
//         if (worker) {
//           fcmTokens.push(worker.fcm_token);
//         }
//       }
//     });

//     if (nearbyWorkers.length === 0) {
//       await client.query('COMMIT');
//       return res.status(200).json('No workersverified found within 2 km radius');
//     }

//     // Insert notifications for nearby workersverified
//     const pin = generatePin();
//     const insertNotificationsQuery = `
//       INSERT INTO notifications (recent_notification_id, user_notification_id, user_id, worker_id, longitude, latitude, created_at, pin, service_booked)
//       VALUES ($1, $2, $3, UNNEST($4::int[]), $5, $6, $7, $8, $9)
//     `;

//     await client.query(insertNotificationsQuery, [
//       recentNotificationId,
//       userNotificationId,
//       user_id,
//       nearbyWorkers,
//       user.longitude,
//       user.latitude,
//       created_at,
//       pin,
//       serviceArray,
//     ]);

//     const encodedUserNotificationId = Buffer.from(
//       userNotificationId.toString()
//     ).toString('base64');

//     // Commit the transaction
//     await client.query('COMMIT');

//     // Send notifications
//     if (fcmTokens.length > 0) {
//       // Prepare notification messages
//       const notificationData = {
//         user_notification_id: encodedUserNotificationId,
//         service: serviceArray,
//         location: `${area}, ${city}, ${pincode}`,
//         coordinates: `${user.latitude},${user.longitude}`,
//         click_action: 'FLUTTER_NOTIFICATION_CLICK',
//         cost: totalCost.toString(),
//         targetUrl: `/acceptance/${encodedUserNotificationId}`,
//         screen: 'Acceptance',
//         date: formattedDate(),
//         time: formattedTime(),
//       };

//       const message = {
//         tokens: fcmTokens,
//         notification: {
//           title: 'New Service Request',
//           body: `${area}, ${city}, ${pincode}`,
//         },
//         data: notificationData,
//         android: {
//           priority: 'high',
//         },
//       };

//       // Send notifications using FCM
//       try {
//         const response = await getMessaging().sendMulticast(message);
//         // console.log('Notifications sent:', response.successCount);
//       } catch (error) {
//         console.error('Error sending notifications:', error);
//       }
//     } else {
//       console.error('No FCM tokens to send the message to.');
//     }

//     return res.status(200).json(encodedUserNotificationId);
//   } catch (error) {
//     await client.query('ROLLBACK');
//     console.error('Error fetching workersverified:', error);
//     return res.status(500).json({ error: 'Server error' });
//   }
// };

// Adjust the getAllLocations function to batch Firestore calls


// const getAllLocations = async (workerIds) => {
//   try {
//     if (workerIds.length < 1) {
//       return [];
//     }

//     const locationsRef = db.collection('locations');
//     const chunks = [];

//     // Firestore 'in' queries can have a maximum of 10 items
//     const chunkSize = 10;
//     for (let i = 0; i < workerIds.length; i += chunkSize) {
//       chunks.push(workerIds.slice(i, i + chunkSize));
//     }

//     const promises = chunks.map((chunk) =>
//       locationsRef.where('worker_id', 'in', chunk).get()
//     );

//     const snapshots = await Promise.all(promises);

//     let locations = [];
//     snapshots.forEach((snapshot) => {
//       snapshot.forEach((doc) => {
//         locations.push({ id: doc.id, ...doc.data() });
//       });
//     });

//     return locations;
//   } catch (error) {
//     console.error('Error getting locations:', error);
//     return [];
//   }
// };




// main second
// const getWorkersNearby = async (req, res) => {
//   const user_id = req.user.id;
//   const { area, pincode, city, alternateName, alternatePhoneNumber, serviceBooked } = req.body;
//   const created_at = getCurrentTimestamp();

//   try {
//     // Get user details and location in one query using a JOIN
//     const userQuery = `
//       SELECT u.*, ul.longitude, ul.latitude
//       FROM "user" u
//       JOIN userlocation ul ON u.user_id = ul.user_id
//       WHERE u.user_id = $1
//     `;
//     const userResult = await client.query(userQuery, [user_id]);
//     if (userResult.rows.length === 0) {
//       return res.status(404).json({ error: "User not found or location not found" });
//     }
//     const user = userResult.rows[0];

//     // Insert user location into userNotifications table
//     const insertUserNotificationQuery = `
//       INSERT INTO userNotifications (user_id, longitude, latitude, created_at, area, pincode, city, alternate_name, alternate_phone_number, service)
//       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
//       RETURNING user_notification_id
//     `;
//     const userNotificationResult = await client.query(insertUserNotificationQuery, [
//       user_id, user.longitude, user.latitude, created_at, area, pincode, city, alternateName, alternatePhoneNumber, serviceBooked
//     ]);
//     const userNotificationId = userNotificationResult.rows[0].user_notification_id;

//     // Insert into userrecentnotifications with conflict handling
//     const insertUserRecentNotificationQuery = `
//       INSERT INTO userrecentnotifications (user_notification_id, user_id, longitude, latitude, created_at)
//       VALUES ($1, $2, $3, $4, $5)
//       ON CONFLICT (user_id) DO UPDATE SET
//         user_notification_id = EXCLUDED.user_notification_id,
//         longitude = EXCLUDED.longitude,
//         latitude = EXCLUDED.latitude,
//         created_at = EXCLUDED.created_at
//       RETURNING recent_notification_id
//     `;
//     const userRecentNotificationResult = await client.query(insertUserRecentNotificationQuery, [
//       userNotificationId, user_id, user.longitude, user.latitude, created_at
//     ]);
//     const recentNotificationId = userRecentNotificationResult.rows[0].recent_notification_id;

//     // Get worker IDs with the specified service
//     const workerServiceQuery = `
//       SELECT worker_id
//       FROM workerskills
//       WHERE $1 = ANY(subservices)
//     `;
//     const workerServiceResult = await client.query(workerServiceQuery, [serviceBooked]);
//     const workerIds = workerServiceResult.rows.map(row => row.worker_id);

//     if (workerIds.length === 0) {
//       return res.status(200).json("No workersverified found offering the requested service.");
//     }

//     // Get worker details, location, and FCM tokens using a single query
//     const workerDetailsQuery = `
//       SELECT w.worker_id, wl.longitude, wl.latitude, fcm.fcm_token
//       FROM workersverified w
//       JOIN workerlocation wl ON w.worker_id = wl.worker_id
//       LEFT JOIN fcm ON w.worker_id = fcm.worker_id
//       WHERE w.worker_id = ANY($1::int[])
//     `;
//     const workerDetailsResult = await client.query(workerDetailsQuery, [workerIds]);
    
//     // Filter workersverified within 2 km radius
//     const nearbyWorkers = workerDetailsResult.rows.filter((workerLocation) => {
//       const distance = haversineDistance(user.latitude, user.longitude, workerLocation.latitude, workerLocation.longitude);
//       return distance <= 2;
//     });

//     if (nearbyWorkers.length === 0) {
//       return res.status(200).json("No workersverified found within 2 km radius.");
//     }

//     // Insert worker details into notifications table
//     const pin = generatePin();
//     const insertNotificationsQuery = `
//       INSERT INTO notifications (recent_notification_id, user_notification_id, user_id, worker_id, longitude, latitude, created_at, pin, service)
//       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
//     `;
//     for (const worker of nearbyWorkers) {
//       await client.query(insertNotificationsQuery, [
//         recentNotificationId, userNotificationId, user_id, worker.worker_id,
//         user.longitude, user.latitude, created_at, pin, serviceBooked
//       ]);
//     }

//     const encodedUserNotificationId = Buffer.from(userNotificationId.toString()).toString("base64");

//     // Get FCM tokens and send notifications
//     const fcmTokens = nearbyWorkers.map(worker => worker.fcm_token).filter(token => token !== null);
//     if (fcmTokens.length > 0) {
//       const multicastMessage = {
//         tokens: fcmTokens,
//         notification: {
//           title: serviceBooked,
//           body: `${area}, ${city}, ${pincode}`,
//         },
//         data: {
//           user_notification_id: encodedUserNotificationId.toString(),
//           click_action: "FLUTTER_NOTIFICATION_CLICK",
//           cost: '199',
//           targetUrl: `/acceptance/${encodedUserNotificationId}`,
//           screen: 'Acceptance',
//           date: formattedDate(),
//           time: formattedTime(),
//         },
//       };

//       try {
//         const response = await getMessaging().sendEachForMulticast(multicastMessage);
//         response.responses.forEach((res, index) => {
//           if (res.success) {
//             // console.log(`Message sent successfully to token ${fcmTokens[index]}`);
//           } else {
//             console.error(`Error sending message to token ${fcmTokens[index]}:`, res.error);
//           }
//         });
//         // console.log('Success Count:', response.successCount);
//         // console.log('Failure Count:', response.failureCount);
//       } catch (error) {
//         console.error('Error sending notifications:', error);
//       }
//     } else {
//       console.error('No FCM tokens to send the message to.');
//     }

//     return res.status(200).json(encodedUserNotificationId);
//   } catch (error) {
//     console.error("Error fetching workersverified:", error);
//     return res.status(500).json({ error: "Server error" });
//   }
// };

const checkTaskStatus = async (req, res) => {
  const { notification_id } = req.body;
  
  try {
    // Directly check the result in the if condition to reduce extra variables
    const result = await client.query(
      "SELECT end_time FROM servicecall WHERE notification_id = $1",
      [notification_id]
    );
    
    if (result.rows.length === 0) {
      // Return early if no notification is found
      return res.status(205).json({ message: "Notification not found" });
    }
    
    const end_time = result.rows[0].end_time;

    if (end_time) {
      // Return status if end_time is found
      return res.status(200).json({ status: end_time });
    }

    // If end_time is null, return a notification not found response
    return res.status(205).json({ message: "Notification not found" });

  } catch (error) {
    console.error("Error checking status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


const checkStatus = async (req, res) => {
  const { user_notification_id } = req.query;
  // console.log("user",user_notification_id)
  try {
    const result = await client.query(
      "SELECT status, notification_id FROM notifications WHERE user_notification_id = $1",
      [user_notification_id]
    );
    
    if (result.rows.length > 0) {
      const status = result.rows[0].status;
      const notification_id = result.rows[0].notification_id;

      res.status(200).json({ status, notification_id });
    } else {
      res.status(404).json({ message: "Notification not found" });
    }
  } catch (error) {
    console.error("Error checking status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getElectricianServices = async () => {
  try {
    const result = await client.query(
      'SELECT * FROM "services" WHERE service_title = $1',
      ["Electrician Services"]
    );
    return result.rows;
  } catch (err) {
    console.error("Error fetching electrician services:", err);
    throw err;
  }
};

const getPlumberServices = async () => {
  try {
    const result = await client.query(
      'SELECT * FROM "services" WHERE service_title = $1',
      ["Plumber"]
    );
    return result.rows;
  } catch (err) {
    console.error("Error fetching Plumber services:", err);
    throw err;
  }
};

const getVerificationStatus = async (req, res) => {
  const { notification_id } = req.query;

  if (!notification_id) {
    return res.status(400).json({ error: 'Notification ID is required' });
  }

  try {
    const result = await client.query(
      'SELECT verification_status FROM accepted WHERE notification_id = $1',
      [notification_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification ID not found' });
    }

    const verificationStatus = result.rows[0].verification_status;
    res.json(verificationStatus);
  } catch (error) {
    console.error('Error checking verification status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



// const workerVerifyOtp = async (req, res) => {
//   const { notification_id, otp } = req.body;
//   // console.log("Received OTP:", otp);
//   try {
//     // Combine SELECT and UPDATE into a single query using CTEs
//     const query = `
//       WITH selected_data AS (
//         SELECT
//           a.notification_id,
//           a.pin,
//           a.user_navigation_cancel_status,
//           a.verification_status,
//           a.user_id,
//           a.service_booked,
//           u.fcm_token
//         FROM accepted a
//         LEFT JOIN userfcm u ON a.user_id = u.user_id
//         WHERE a.notification_id = $1
//       ),
//       update_verification AS (
//         UPDATE accepted
//         SET verification_status = TRUE
//         WHERE notification_id = $1 AND pin = $2
//         RETURNING notification_id
//       )
//       SELECT
//         sd.*,
//         uv.notification_id AS updated_notification_id
//       FROM selected_data sd
//       LEFT JOIN update_verification uv ON sd.notification_id = uv.notification_id;
//     `;

//     // Execute the query with parameters
//     const queryResult = await client.query(query, [notification_id, otp]);

//     // Check if any records were returned
//     if (queryResult.rows.length === 0) {
//       return res.status(404).json({ message: "Notification not found" });
//     }

//     const row = queryResult.rows[0];
//     // console.log("Fetched Data:", row);

//     // Check if the user canceled the navigation
//     if (row.user_navigation_cancel_status === 'usercanceled') {
//       return res.status(205).json({ message: "User cancelled the navigation" });
//     }

//     // Check if the OTP matched and the update occurred
//     if (row.updated_notification_id) {
//       // console.log("OTP matched. Verification successful.");

//       // Start the time and fetch result
//       const timeResult = await TimeStart(notification_id);

//       // Fetch the FCM tokens from the query result
//       const fcmTokens = [row.fcm_token].filter(token => token);

//       if (fcmTokens.length > 0) {
//         // Create a multicast message for all tokens
//         const multicastMessage = {
//           tokens: fcmTokens,
//           notification: {
//             title: "Click Solver",
//             body: "The Commander has successfully verified the work, the time has started.",
//           },
//           data: {
//             notification_id: notification_id.toString(),
//             screen: 'worktimescreen',
//           },
//         };

//         try {
//           // Send notifications to multiple tokens
//           const response = await getMessaging().sendEachForMulticast(multicastMessage);

//           response.responses.forEach((res, index) => {
//             if (res.success) {
//               // console.log(`Message sent successfully to token ${fcmTokens[index]}`);
//             } else {
//               console.error(`Error sending message to token ${fcmTokens[index]}:`, res.error);
//             }
//           });

//           // console.log('Success Count:', response.successCount);
//           // console.log('Failure Count:', response.failureCount);

//         } catch (error) {
//           console.error('Error sending notifications:', error);
//         }
//       } else {
//         console.error('No FCM tokens to send the message to.');
//       }

//       const screen = "worktimescreen";
//       const encodedId = Buffer.from(notification_id.toString()).toString("base64");
//       createUserBackgroundAction(row.user_id, encodedId, screen, row.service_booked);

//       // Respond with success
//       return res.status(200).json({ status: 'Verification successful', timeResult: timeResult });
//     } else {
//       // console.log("OTP did not match.");
//       return res.status(404).json({ message: "OTP is incorrect" });
//     }
//   } catch (error) {
//     console.error("Error verifying OTP:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };


const workerVerifyOtp = async (req, res) => {
  const { notification_id, otp } = req.body;

  try {
    // Single query to update both verification_status and time.arrived with formatted timestamp
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
        WHERE notification_id = $1 AND pin = $2
        RETURNING *
      )
      SELECT
        a.notification_id,
        a.pin,
        a.user_navigation_cancel_status,
        a.verification_status,
        a.user_id,
        a.service_booked,
        u.fcm_token,
        a.time
      FROM updated a
      LEFT JOIN userfcm u ON a.user_id = u.user_id;
    `;

    // Execute the query with parameters
    const queryResult = await client.query(query, [notification_id, otp]);
    console.log(notification_id)
    // Check if any records were returned
    if (queryResult.rows.length === 0) {
      return res.status(404).json({ message: "OTP is incorrect or notification not found" });
    }

    const row = queryResult.rows[0];
    console.log("Updated Row:", row);

    // Check if the user canceled the navigation
    if (row.user_navigation_cancel_status === 'usercanceled') {
      return res.status(205).json({ message: "User cancelled the navigation" });
    }

    // Proceed since both updates succeeded
    // Start the time and fetch result
    const timeResult = await TimeStart(notification_id);

    // Fetch the FCM tokens from the query result
    const fcmTokens = [row.fcm_token].filter(token => token);

    if (fcmTokens.length > 0) {
      // Create a multicast message for all tokens
      const multicastMessage = {
        tokens: fcmTokens,
        notification: {
          title: "Click Solver",
          body: "The Commander has successfully verified the work, the time has started.",
        },
        data: {
          notification_id: notification_id.toString(),
          screen: 'worktimescreen',
        },
      };

      try {
        // Send notifications to multiple tokens
        const response = await getMessaging().sendEachForMulticast(multicastMessage);

        response.responses.forEach((resItem, index) => {
          if (!resItem.success) {
            console.error(`Error sending message to token ${fcmTokens[index]}:`, resItem.error);
          }
        });

      } catch (error) {
        console.error('Error sending notifications:', error);
      }
    } else {
      console.error('No FCM tokens to send the message to.');
    }

    const screen = "worktimescreen";
    const encodedId = Buffer.from(notification_id.toString()).toString("base64");
    await createUserBackgroundAction(row.user_id, encodedId, screen, row.service_booked);

    // Respond with success
    return res.status(200).json({ status: 'Verification successful', timeResult: timeResult });

  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};




const getCleaningServices = async () => {
  try {
    const result = await client.query(
      'SELECT * FROM "services" WHERE service_title = $1',
      ["Cleaning Department"]
    );
    return result.rows;
  } catch (err) {
    console.error("Error fetching Cleaning services:", err);
    throw err;
  }
};

const getPaintingServices = async () => {
  try {
    const result = await client.query(
      'SELECT * FROM "services" WHERE service_title = $1',
      ["House and Shop Painting"]
    );
    return result.rows;
  } catch (err) {
    console.error("Error fetching Painter services:", err);
    throw err;
  }
};

const getVehicleServices = async () => {
  try {
    const result = await client.query(
      'SELECT * FROM "services" WHERE service_title IN ($1, $2)',
      ["Vehical mechanics", "Salon for mens & kids"]
    );
    return result.rows;
  } catch (err) {
    console.error("Error fetching Vehicle services:", err);
    throw err;
  }
};

const sendOtp = (req, res) => {
  const { mobileNumber } = req.body;
  // console.log(mobileNumber)
  const options = {
    method: 'POST',
    url: `https://cpaas.messagecentral.com/verification/v3/send?countryCode=91&customerId=C-B3753ECA43BD435&flowType=SMS&mobileNumber=${mobileNumber}`,
    headers: {
      'authToken': 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLUIzNzUzRUNBNDNCRDQzNSIsImlhdCI6MTcyNjI1OTQwNiwiZXhwIjoxODgzOTM5NDA2fQ.Gme6ijpbtUge-n9NpEgJR7lIsNQTqH4kDWkoe9Wp6Nnd6AE0jaAKCuuGuYtkilkBrcC1wCj8GrlMNQodR-Gelg'
    }
  };

  request(options, function (error, response) {
    if (error) {
      return res.status(500).json({ message: 'Error sending OTP', error });
    }

    // Log the response body to see what you are getting
    // console.log('Response body:', response.body);

    try {
      const data = JSON.parse(response.body);
      
      // Check if data contains the expected structure
      if (data && data.data && data.data.verificationId) {
        res.status(200).json({
          message: 'OTP sent successfully',
          verificationId: data.data.verificationId,
        });
      } else {
        // Handle case where verificationId is not present
        res.status(500).json({
          message: 'Failed to retrieve verificationId',
          error: data
        });
      }
    } catch (parseError) {
      // Handle JSON parsing errors
      res.status(500).json({ message: 'Failed to parse response', error: parseError });
    }
  });
};

const validateOtp = (req, res) => {
  const { mobileNumber, verificationId, otpCode } = req.query;

  const options = {
    method: 'GET',
    url: `https://cpaas.messagecentral.com/verification/v3/validateOtp?countryCode=91&mobileNumber=${mobileNumber}&verificationId=${verificationId}&customerId=C-B3753ECA43BD435&code=${otpCode}`,
    headers: {
      'authToken': 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLUIzNzUzRUNBNDNCRDQzNSIsImlhdCI6MTcyNjI1OTQwNiwiZXhwIjoxODgzOTM5NDA2fQ.Gme6ijpbtUge-n9NpEgJR7lIsNQTqH4kDWkoe9Wp6Nnd6AE0jaAKCuuGuYtkilkBrcC1wCj8GrlMNQodR-Gelg'
    }
  };

  request(options, function (error, response) {
    if (error) {
      return res.status(500).json({ message: 'Error validating OTP', error });
    }
    const data = JSON.parse(response.body);
    // console.log(data)
    res.status(200).json({
      message: data.data.verificationStatus === "VERIFICATION_COMPLETED" ? 'OTP Verified' : 'Invalid OTP',
    });
  });
};

// ***
// const CheckStartTime = async (req,res) => {
//   const { notification_id } = req.body; 
//   // console.log("check chesthunam mawa kastam ga ",notification_id)
//   try {
//     const result = await client.query(
//       "SELECT start_time FROM ServiceCall WHERE notification_id = $1",
//       [notification_id]
//     );
  
//     if (result.rows.length > 0) {
//       const workedTime = result.rows[0].start_time;
//       // console.log(workedTime)
//       if (workedTime) {
//         res.status(200).json({worked_time: workedTime});
//       } else {
//         const time = getCurrentTimestamp()
//         res.status(200).json({worked_time: time});
//       }
//     } else {
//       res.status(404).json({ error: 'Notification ID not found' });
//     }
//   } catch (error) {
//     console.error('Error fetching timer value:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// }

// Function to get the timer value

const CheckStartTime = async (req, res) => {
  const { notification_id } = req.body;
  // console.log("Checking start time for notification ID:", notification_id);

  try {
    // Use LEFT JOIN to get start_time and worker_id in a single query
    const result = await client.query(
      `SELECT sc.start_time, 
              COALESCE(sc.worker_id, a.worker_id) as worker_id 
       FROM ServiceCall sc 
       LEFT JOIN accepted a 
       ON sc.notification_id = a.notification_id 
       WHERE sc.notification_id = $1 OR a.notification_id = $1`,
      [notification_id]
    );

    if (result.rows.length > 0) {
      const { start_time, worker_id } = result.rows[0];

      if (start_time) {
        // If start_time exists, return it
        // console.log("Start time found:", start_time);
        return res.status(200).json({ worked_time: start_time, worker_id });
      } else if (worker_id) {
        // If start_time doesn't exist, insert current timestamp into ServiceCall
        const currentTime = getCurrentTimestamp();
        await client.query(
          "INSERT INTO ServiceCall (notification_id, worker_id, start_time) VALUES ($1, $2, $3)",
          [notification_id, worker_id, currentTime]
        );

        // console.log("New start time inserted:", currentTime);
        return res.status(200).json({ worked_time: currentTime, worker_id });
      }
    }

    // If no worker_id is found in both tables, return a 404
    return res.status(404).json({ error: 'Notification ID not found in ServiceCall or accepted table' });

  } catch (error) {
    console.error('Error fetching or inserting start time:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ***
// const CheckStartTime = async (req, res) => {
//   const { notification_id } = req.body; 
//   // console.log("Checking start time for notification ID:", notification_id);

//   try {
//     // Step 1: Check if start_time exists in ServiceCall table
//     const result = await client.query(
//       "SELECT start_time, worker_id FROM ServiceCall WHERE notification_id = $1",
//       [notification_id]
//     );

//     if (result.rows.length > 0) {
//       const { start_time, worker_id } = result.rows[0];

//       if (start_time) {
//         // If start_time exists, return it
//         // console.log("Start time found:", start_time);
//         return res.status(200).json({ worked_time: start_time });
//       }
//     }

//     // Step 2: If start_time doesn't exist, fetch worker_id from accepted table
//     const workerResult = await client.query(
//       "SELECT worker_id FROM accepted WHERE notification_id = $1",
//       [notification_id]
//     );

//     if (workerResult.rows.length > 0) {
//       const { worker_id } = workerResult.rows[0];

//       // Step 3: Insert current timestamp into ServiceCall table
//       const currentTime = getCurrentTimestamp();
//       await client.query(
//         "INSERT INTO ServiceCall (notification_id, worker_id, start_time) VALUES ($1, $2, $3)",
//         [notification_id, worker_id, currentTime]
//       );

//       // console.log("New start time inserted:", currentTime);
//       return res.status(200).json({ worked_time: currentTime, worker_id });
//     } else {
//       return res.status(404).json({ error: 'Notification ID not found in accepted table' });
//     }
//   } catch (error) {
//     console.error('Error fetching or inserting start time:', error);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// };


const getTimerValue = async (req, res) => {
  const { notification_id } = req.body; // Extract notification_id from query parameters
  // console.log("notification denedhe", notification_id);
  try {
    const result = await client.query(
      "SELECT time_worked FROM ServiceCall WHERE notification_id = $1",
      [notification_id]
    );
    // console.log(result.rows)

    if (result.rows.length > 0) {
      const workedTime = result.rows[0].time_worked;
      if (workedTime) {
        res.status(200).json(workedTime);
      } else {
        res.status(200).json('00:00:00');
      }
    } else {
      res.status(404).json({ error: 'Notification ID not found' });
    }
  } catch (error) {
    console.error('Error fetching timer value:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

let stopwatchInterval = null;
let workedTime = 0;
const activeNotifications = new Set();

const formatTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const mins = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
};

const parseTime = (timeString) => {
  if (typeof timeString !== "string") {
    return 0; // or some default value
  }
  const [hrs, mins, secs] = timeString.split(":").map(Number);
  return hrs * 3600 + mins * 60 + secs;
};

// Adjusted startStopwatch function
const startStopwatch = async (notificationId) => {
  // Check if stopwatch is already running for this notificationId
  if (activeNotifications.has(notificationId)) {
    // console.log(`Stopwatch for notification ID ${notificationId} is already running.`);
    // Return the current worked time if it's already running
    const result = await client.query(
      "SELECT time_worked FROM ServiceCall WHERE notification_id = $1",
      [notificationId]
    );
    if (result.rows.length > 0 && result.rows[0].time_worked !== null) {
      const workedTimeString = result.rows[0].time_worked;
      return workedTimeString; // Return the existing time worked
    }
  }

  try {
    // Query the database to get worker_id from notifications table
    const workerResult = await client.query(
      "SELECT worker_id FROM accepted WHERE notification_id = $1",
      [notificationId]
    );

    if (workerResult.rows.length === 0) {
      throw new Error("No worker found for the given notification ID");
    }

    const workerId = workerResult.rows[0].worker_id;

    // Query the database to check if there's already time worked for this notificationId
    const result = await client.query(
      "SELECT time_worked FROM ServiceCall WHERE notification_id = $1",
      [notificationId]
    );

    let workedTime = 0;

    if (result.rows.length > 0 && result.rows[0].time_worked !== null) {
      // If time worked exists, parse it from the database
      const workedTimeString = result.rows[0].time_worked;
      workedTime = parseTime(workedTimeString);
    } else {
      // If no time worked exists, initialize it to 0 in the database and insert worker_id
      workedTime = 0;
      await client.query(
        "INSERT INTO ServiceCall (notification_id, start_time, time_worked, worker_id) VALUES ($1, $2, $3, $4)",
        [notificationId, new Date(), formatTime(workedTime), workerId]
      );
    }

    // Add the notificationId to activeNotifications to indicate it's running
    activeNotifications.add(notificationId);

    // Set up the interval to update time worked every second
    if (!stopwatchInterval) {
      stopwatchInterval = setInterval(async () => {
        workedTime += 1;

        try {
          const formattedTime = formatTime(workedTime);
          // console.log(formattedTime)
          // Log formatted time for debugging

          // Update the time worked in the database
          await client.query(
            "UPDATE ServiceCall SET time_worked = $1 WHERE notification_id = $2",
            [formattedTime, notificationId]
          );
        } catch (error) {
          console.error("Error formatting or updating worked time:", error);
        }
      }, 1000);
    }
  } catch (error) {
    console.error("Error starting stopwatch:", error);
    throw error; // Ensure errors are properly handled
  }
};

const getTimeDifferenceInIST = (start_time, end_time) => {
  // Parse input times
  const startTime = new Date(start_time);
  const endTime = new Date(end_time);

  // Calculate the difference in milliseconds
  const differenceInMillis = endTime - startTime;

  // Convert milliseconds to seconds
  const differenceInSeconds = Math.floor(differenceInMillis / 1000);

  // Calculate hours, minutes, and seconds
  const hours = Math.floor(differenceInSeconds / 3600);
  const minutes = Math.floor((differenceInSeconds % 3600) / 60);
  const seconds = differenceInSeconds % 60;

  // Format to hh:mm:ss with leading zeros
  const formatTime = (value) => value.toString().padStart(2, '0');
  const time_worked = `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`
  return {time_worked};
};

// const serviceCompleted = async (req, res) => {
//   const { notification_id, encodedId } = req.body;
//   const encodedUserNotificationId = Buffer.from(notification_id.toString()).toString("base64");
//   // console.log(notification_id);

//   try {
//     const end_time = new Date();

//     // Check if end_time is already set
//     const checkQuery = `
//     SELECT start_time, end_time
//     FROM servicecall
//     WHERE notification_id = $1
//   `;
  
//     const checkResult = await client.query(checkQuery, [notification_id]);

//     if (checkResult.rows.length > 0) {
//       const existingEndTime = checkResult.rows[0].end_time;

//       if (existingEndTime) {
//         // end_time is already set
//         return res.status(205).json({ message: 'End time already set' });
//       }
//     }

//     const startTime = checkResult.rows[0].start_time;
//     const timeWorkedInSeconds = Math.floor((end_time - startTime) / 1000);
//     const hours = String(Math.floor(timeWorkedInSeconds / 3600)).padStart(2, '0');
//     const minutes = String(Math.floor((timeWorkedInSeconds % 3600) / 60)).padStart(2, '0');
//     const seconds = String(timeWorkedInSeconds % 60).padStart(2, '0');
    
//     const time_worked = `${hours}:${minutes}:${seconds}`;
  
//     // Update end_time and time_worked in the database
//     const updateQuery = `
//       UPDATE servicecall
//       SET end_time = $1, time_worked = $2
//       WHERE notification_id = $3
//     `;
  
//     const updateResult = await client.query(updateQuery, [end_time, time_worked, notification_id]);
    

//     if (updateResult.rowCount > 0) {
//       const result =  `
//       SELECT user_id,service
//       FROM accepted
//       WHERE notification_id = $1
//     `;
//     const userResult = await client.query(result, [notification_id]);
//     const userId = userResult.rows[0].user_id
//     const serviceBooked = userResult.rows[0].service
//     const screen ="Paymentscreen"
//     const route = await createUserBackgroundAction(userId,encodedId,screen,serviceBooked)

//     const fcmTokenResult = await client.query(
//       "SELECT fcm_token FROM userfcm WHERE user_id = $1",
//       [userId]
//     );

//     const fcmTokens = fcmTokenResult.rows.map(row => row.fcm_token);
//     // console.log(fcmTokens);
    
//     if (fcmTokens.length > 0) {
//       // Create a multicast message object for all tokens
//       const multicastMessage = {
//         tokens: fcmTokens, // An array of tokens to send the same message to
//         notification: {
//           title: "Click Solver",
//           body: `Commander has completed your work. Great to hear!`,
//         },
//         data: {
//           notification_id: notification_id.toString(),
//           screen:'Paymentscreen'
//         },
//       };
    
//       try {
//         // Use sendEachForMulticast to send the same message to multiple tokens
//         const response = await getMessaging().sendEachForMulticast(multicastMessage);
    
//         // Log the responses for each token
//         response.responses.forEach((res, index) => {
//           if (res.success) {
//             // console.log(`Message sent successfully to token ${fcmTokens[index]}`);
//           } else {
//             console.error(`Error sending message to token ${fcmTokens[index]}:`, res.error);
//           }
//         });
//         res.status(200).json({ notification_id });
//         // console.log('Success Count:', response.successCount);
//         // console.log('Failure Count:', response.failureCount);
    
//       } catch (error) {
//         console.error('Error sending notifications:', error);
//       }
//     } else {
//       console.error('No FCM tokens to send the message to.');
//     }
    
   
//     } else {
//       res.status(404).json({ error: 'Notification not found' });
//     }
//   } catch (error) {
//     console.error('Error updating end time:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

const serviceCompleted = async (req, res) => {
  const { notification_id, encodedId } = req.body;

  // Input Validation
  if (!notification_id || !encodedId) {
    return res.status(400).json({ error: 'Missing required fields: notification_id and encodedId.' });
  }

  const encodedUserNotificationId = Buffer.from(notification_id.toString()).toString("base64");

  try {
    const end_time = new Date();

    // Single query using CTEs to fetch, check, update, and return necessary data
    const query = `
      WITH fetched_data AS (
        SELECT 
          sc.notification_id,
          sc.start_time, 
          sc.end_time, 
          a.user_id, 
          a.service_booked
        FROM servicecall sc
        JOIN accepted a ON sc.notification_id = a.notification_id
        WHERE sc.notification_id = $1
        FOR UPDATE
      ),
      check_end_time AS (
        SELECT 
          fd.*, 
          CASE 
            WHEN fd.end_time IS NOT NULL THEN TRUE 
            ELSE FALSE 
          END AS is_end_time_set
        FROM fetched_data fd
      ),
      update_servicecall AS (
        UPDATE servicecall sc
        SET 
          end_time = $2,
          time_worked = TO_CHAR(EXTRACT(EPOCH FROM ($2 - sc.start_time)) / 3600, 'FM00') || ':' ||
                        TO_CHAR((EXTRACT(EPOCH FROM ($2 - sc.start_time)) / 60) % 60, 'FM00') || ':' ||
                        TO_CHAR(EXTRACT(EPOCH FROM ($2 - sc.start_time)) % 60, 'FM00')
        FROM fetched_data fd
        WHERE sc.notification_id = fd.notification_id AND sc.end_time IS NULL
        RETURNING sc.end_time, sc.time_worked
      ),
      update_accepted AS (
        UPDATE accepted a
        SET 
          time = jsonb_set(
            COALESCE(a.time, '{}'::jsonb),
            '{workCompleted}',
            to_jsonb(to_char($2, 'YYYY-MM-DD HH24:MI:SS'))
          )
        FROM fetched_data fd
        WHERE a.notification_id = fd.notification_id
        RETURNING a.time
      ),
      user_fcm AS (
        SELECT ARRAY_AGG(u.fcm_token) AS fcm_tokens
        FROM userfcm u
        WHERE u.user_id = (SELECT user_id FROM fetched_data)
      )
      SELECT 
        cd.*, 
        us.end_time AS updated_end_time, 
        us.time_worked AS updated_time_worked,
        ua.time AS updated_time,
        uf.fcm_tokens
      FROM check_end_time cd
      LEFT JOIN update_servicecall us ON TRUE
      LEFT JOIN update_accepted ua ON TRUE
      CROSS JOIN user_fcm uf;
    `;

    const values = [notification_id, end_time];

    const result = await client.query(query, values);

    // Check if any records were returned
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    const row = result.rows[0];
    const { 
      start_time, 
      end_time: existingEndTime, 
      user_id, 
      service_booked, 
      is_end_time_set, 
      updated_end_time, 
      updated_time_worked, 
      updated_time,
      fcm_tokens 
    } = row;

    // If end_time is already set, return a message
    if (is_end_time_set) {
      return res.status(205).json({ message: 'End time already set.' });
    }

    // Determine the time_worked value
    let time_worked = updated_time_worked;
    if (!is_end_time_set && updated_time_worked) {
      // If updated_time_worked is available from the UPDATE CTE
      time_worked = updated_time_worked;
    } else {
      // Fallback calculation in application code if needed
      const timeWorkedInSeconds = Math.floor((end_time - start_time) / 1000);
      const hours = String(Math.floor(timeWorkedInSeconds / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((timeWorkedInSeconds % 3600) / 60)).padStart(2, '0');
      const seconds = String(timeWorkedInSeconds % 60).padStart(2, '0');
      time_worked = `${hours}:${minutes}:${seconds}`;
    }

    // Retrieve FCM tokens
    const fcmTokens = fcm_tokens ? fcm_tokens.filter(token => token) : [];

    // Send notifications if FCM tokens are available
    if (fcmTokens.length > 0) {
      const multicastMessage = {
        tokens: fcmTokens,
        notification: {
          title: "Click Solver",
          body: `Commander has completed your work. Great to hear!`,
        },
        data: {
          notification_id: notification_id.toString(),
          screen: 'Paymentscreen',
        },
      };

      try {
        const response = await getMessaging().sendEachForMulticast(multicastMessage);

        response.responses.forEach((resItem, index) => {
          if (resItem.success) {
            // Optionally log successful sends
            // console.log(`Message sent successfully to token ${fcmTokens[index]}`);
          } else {
            console.error(`Error sending message to token ${fcmTokens[index]}:`, resItem.error);
          }
        });

      } catch (error) {
        console.error('Error sending notifications:', error);
        return res.status(500).json({ error: 'Error sending notifications.' });
      }
    } else {
      console.error('No FCM tokens to send the message to.');
      return res.status(200).json({ message: 'No FCM tokens to send the message to.' });
    }

    // Create a background action for the user (Uncomment if needed)
    const screen = "Paymentscreen";
    // console.log(screen, encodedId, user_id, service_booked)
    // createUserBackgroundAction(user_id, encodedId, screen, service_booked);

    // Respond with success
    return res.status(200).json({ notification_id, end_time: updated_end_time, time_worked, updated_time });

  } catch (error) {
    console.error('Error updating end time:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};


// const serviceCompleted = async (req, res) => {
//   const { notification_id, encodedId } = req.body;

//   // Input Validation
//   if (!notification_id || !encodedId) {
//     return res.status(400).json({ error: 'Missing required fields: notification_id and encodedId.' });
//   }

//   const encodedUserNotificationId = Buffer.from(notification_id.toString()).toString("base64");

//   try {
//     const end_time = new Date();

//     // Single query using CTEs to fetch, check, update, and return necessary data
//     const query = `
//       WITH fetched_data AS (
//         SELECT 
//           sc.notification_id,  -- Added notification_id
//           sc.start_time, 
//           sc.end_time, 
//           a.user_id, 
//           a.service_booked
//         FROM servicecall sc
//         JOIN accepted a ON sc.notification_id = a.notification_id
//         WHERE sc.notification_id = $1
//         FOR UPDATE
//       ),
//       check_end_time AS (
//         SELECT 
//           fd.*, 
//           CASE 
//             WHEN fd.end_time IS NOT NULL THEN TRUE 
//             ELSE FALSE 
//           END AS is_end_time_set
//         FROM fetched_data fd
//       ),
//       update_servicecall AS (
//         UPDATE servicecall sc
//         SET 
//           end_time = $2,
//           time_worked = TO_CHAR(EXTRACT(EPOCH FROM ($2 - sc.start_time)) / 3600, 'FM00') || ':' ||
//                         TO_CHAR((EXTRACT(EPOCH FROM ($2 - sc.start_time)) / 60) % 60, 'FM00') || ':' ||
//                         TO_CHAR(EXTRACT(EPOCH FROM ($2 - sc.start_time)) % 60, 'FM00')
//         FROM fetched_data fd
//         WHERE sc.notification_id = fd.notification_id AND sc.end_time IS NULL
//         RETURNING sc.end_time, sc.time_worked
//       ),
//       user_fcm AS (
//         SELECT ARRAY_AGG(u.fcm_token) AS fcm_tokens
//         FROM userfcm u
//         WHERE u.user_id = (SELECT user_id FROM fetched_data)
//       )
//       SELECT 
//         cd.*, 
//         us.end_time AS updated_end_time, 
//         us.time_worked AS updated_time_worked,
//         uf.fcm_tokens
//       FROM check_end_time cd
//       LEFT JOIN update_servicecall us ON TRUE
//       CROSS JOIN user_fcm uf;
//     `;

//     const values = [notification_id, end_time];

//     const result = await client.query(query, values);

//     // Check if any records were returned
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'Notification not found.' });
//     }

//     const row = result.rows[0];
//     const { 
//       start_time, 
//       end_time: existingEndTime, 
//       user_id, 
//       service_booked, 
//       is_end_time_set, 
//       updated_end_time, 
//       updated_time_worked, 
//       fcm_tokens 
//     } = row;

//     // If end_time is already set, return a message
//     if (is_end_time_set) {
//       return res.status(205).json({ message: 'End time already set.' });
//     }

//     // Determine the time_worked value
//     let time_worked = updated_time_worked;
//     if (!is_end_time_set && updated_time_worked) {
//       // If updated_time_worked is available from the UPDATE CTE
//       time_worked = updated_time_worked;
//     } else {
//       // Fallback calculation in application code if needed
//       const timeWorkedInSeconds = Math.floor((end_time - start_time) / 1000);
//       const hours = String(Math.floor(timeWorkedInSeconds / 3600)).padStart(2, '0');
//       const minutes = String(Math.floor((timeWorkedInSeconds % 3600) / 60)).padStart(2, '0');
//       const seconds = String(timeWorkedInSeconds % 60).padStart(2, '0');
//       time_worked = `${hours}:${minutes}:${seconds}`;
//     }

//     // Retrieve FCM tokens
//     const fcmTokens = fcm_tokens ? fcm_tokens.filter(token => token) : [];

//     // Send notifications if FCM tokens are available
//     if (fcmTokens.length > 0) {
//       const multicastMessage = {
//         tokens: fcmTokens,
//         notification: {
//           title: "Click Solver",
//           body: `Commander has completed your work. Great to hear!`,
//         },
//         data: {
//           notification_id: notification_id.toString(),
//           screen: 'Paymentscreen',
//         },
//       };

//       try {
//         const response = await getMessaging().sendEachForMulticast(multicastMessage);

//         response.responses.forEach((resItem, index) => {
//           if (resItem.success) {
//             // console.log(`Message sent successfully to token ${fcmTokens[index]}`);
//           } else {
//             console.error(`Error sending message to token ${fcmTokens[index]}:`, resItem.error);
//           }
//         });

//         // console.log('Success Count:', response.successCount);
//         // console.log('Failure Count:', response.failureCount);

//       } catch (error) {
//         console.error('Error sending notifications:', error);
//         return res.status(500).json({ error: 'Error sending notifications.' });
//       }
//     } else {
//       console.error('No FCM tokens to send the message to.');
//       return res.status(200).json({ message: 'No FCM tokens to send the message to.' });
//     }

//     // Create a background action for the user
//     const screen = "Paymentscreen";
//     // console.log(screen,encodedId,user_id,service_booked)
//     // createUserBackgroundAction(user_id, encodedId, screen, service_booked);

//     // Respond with success
//     return res.status(200).json({ notification_id, end_time: updated_end_time, time_worked });

//   } catch (error) {
//     console.error('Error updating end time:', error);
//     return res.status(500).json({ error: 'Internal server error.' });
//   }
// };






const stopStopwatch = async (notification_id) => {
  if (stopwatchInterval) {
    clearInterval(stopwatchInterval);
    stopwatchInterval = null;

    try {
      const end_time = new Date(); // Set end_time to the current time

      // SQL query to join servicecall and notifications
      const query = `
        UPDATE servicecall 
        SET end_time = $1 
        WHERE notification_id = $2
        RETURNING (
          SELECT notifications.worker_id 
          FROM notifications 
          WHERE notifications.notification_id = servicecall.notification_id
        ) AS worker_id;
      `;
      const values = [end_time, notification_id];

      const result = await client.query(query, values);

      if (result.rowCount === 0) {
        throw new Error('No service call found with the given notification_id');
      }

      const userIdDetails =  await client.query(
        "SELECT user_id FROM notifications WHERE notification_id = $1",
        [notification_id]
      );

      const userId = userIdDetails.rows[0].user_id

      const fcmTokenResult = await client.query(
        "SELECT fcm_token FROM userfcm WHERE user_id = $1",
        [userId]
      );

      const fcmTokens = fcmTokenResult.rows.map(row => row.fcm_token);
      // console.log(fcmTokens);
      
      if (fcmTokens.length > 0) {
        // Create a multicast message object for all tokens
        const multicastMessage = {
          tokens: fcmTokens, // An array of tokens to send the same message to
          notification: {
            title: "Click Solver",
            body: `Commander has completed your work. Great to hear!`,
          },
          data: {
            user_notification_id: notification_id.toString(),
          },
        };
      
        try {
          // Use sendEachForMulticast to send the same message to multiple tokens
          const response = await getMessaging().sendEachForMulticast(multicastMessage);
      
          // Log the responses for each token
          response.responses.forEach((res, index) => {
            if (res.success) {
              // console.log(`Message sent successfully to token ${fcmTokens[index]}`);
            } else {
              console.error(`Error sending message to token ${fcmTokens[index]}:`, res.error);
            }
          });
      
          // console.log('Success Count:', response.successCount);
          // console.log('Failure Count:', response.failureCount);
      
        } catch (error) {
          console.error('Error sending notifications:', error);
        }
      } else {
        console.error('No FCM tokens to send the message to.');
      }
      


      return result.rows[0].worker_id; // Return worker_id from the joined table
    } catch (error) {
      console.error('Error updating end_time:', error);
      throw new Error('Internal server error');
    }
  } else {
    throw new Error('Stopwatch is not running');
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
      throw new Error('No worker found with the given worker_id');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error updating workerlife details:', error);
    throw new Error('Internal server error');
  }
};


// Controller function to handle storing user location
const storeUserLocation = async (req, res) => {
  let { longitude, latitude } = req.body;

  const userId = req.user.id;
   // Log the received data


  try {

 
    const query = `
      INSERT INTO userLocation (longitude, latitude, user_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id)
      DO UPDATE SET longitude = EXCLUDED.longitude, latitude = EXCLUDED.latitude
    `;
    await client.query(query, [longitude, latitude, userId]);

    res.status(200).json({ message: "User location stored successfully" });
  } catch (error) {
    console.error("Error storing user location:", error);
    res.status(500).json({ error: "Failed to store user location" });
  }
};

const skillWorkerRegistration = async (req, res) => {
  const workerId = req.worker.id;
  const { selectedService, checkedServices, profilePic, proofPic, agree } = req.body;
  try {
    const query = `
      INSERT INTO workerskills (worker_id, service, subservices, profile, proof, agree)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (worker_id) DO UPDATE
      SET service = EXCLUDED.service, subservices = EXCLUDED.subservices, profile = EXCLUDED.profile, proof = EXCLUDED.proof, agree = EXCLUDED.agree
    `;
    await client.query(query, [workerId, selectedService, checkedServices, profilePic, proofPic, agree]);

    const workerLife = `
    INSERT INTO workerlife (worker_id, service_counts, money_earned)
    VALUES ($1, $2, $3)
    ON CONFLICT (worker_id) DO UPDATE
    SET service_counts = 0, money_earned = 0
  `;
  await client.query(workerLife, [workerId, 0, 0]);
    res.status(200).json({ message: "Skilled worker registration stored successfully" });
  } catch (error) {
    console.error("Error storing user location:", error);
    res.status(500).json({ error: "Failed to store Skilled worker registration" });
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
      workerId
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
      averageRating
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
      un.city,
      un.pincode,
      ws.profile
    FROM 
      accepted n
    JOIN 
      workersverified w ON n.worker_id = w.worker_id
    JOIN 
      usernotifications un ON n.user_notification_id = un.user_notification_id
    JOIN 
      workerskills ws ON n.worker_id = ws.worker_id
    WHERE 
      n.notification_id = $1
  `;
  

    const result = await client.query(query, [notificationId]);

    // If no results, return 404
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notification or worker not found" });
    }

    const { pin, name, phone_number, profile, pincode, area, city, service_booked } = result.rows[0];

    // Send the response
    return res.status(200).json({ pin, name, phone_number, profile, pincode, area, city, service_booked });
  } catch (error) {
    console.error("Error getting worker navigation details:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


const registrationStatus = async (req,res) => {
  const workerId = req.worker.id;

  try{
    const result = await client.query(
      "SELECT skill_id FROM workerskills WHERE worker_id = $1",
      [workerId]
    );
    // console.log(result.rows.length)
    if (result.rows.length === 0) {
      return res.status(204).json({ message: "worker not found" });
    } else{
      return res.status(200).json(result.rows)
    }
  }catch (error) {
    console.error("Error updating skill registration:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

const subservices = async (req,res) => {
  const {selectedService} = req.body;
  try {
    const result = await client.query(
      `SELECT 
            asv.service_tag
        FROM 
            servicecategories sc
        JOIN 
            relatedservices rs ON sc.service_name = rs.service 
        JOIN 
            allservices asv ON asv.service_category = rs.service_category
        WHERE 
            sc.service_name = $1;
        `,
      [selectedService]
    );
    // console.log(selectedService)
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "worker not found" });
    } else{
      return res.status(200).json(result.rows)
    }

  } catch (error) {
    console.error("Error updating skill registration:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
  
}

const userUpdateLastLogin = async (req,res) => {
  const userId = req.worker.id
  const time = getCurrentTimestamp()
  try {
    const query = {
      text: `UPDATE "user" SET last_active = $1 WHERE user_id = $2 RETURNING *`,
      values: [time,userId],
    };

    const result = await client.query(query);
    return result.rows[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
}

const checkInactiveUsers = async () => {
  // const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
  const query = {
    text: `
      SELECT u.*, ft.fcm_token
      FROM "user" u
      JOIN userfcm ft ON u.user_id = ft.user_id
      WHERE u.last_active < $1
    `,
    values: [oneMinuteAgo],
  };

  const result = await client.query(query);

  result.rows.forEach(async (user) => {
    // Send notification using FCM
    const message = {
      notification: {
        title: 'We Miss You!',
        body: 'It’s been a while since you last visited us. Come back and check out what’s new!',
      },
      token: user.fcm_token,
    };
    await getMessaging().send(message);
  });
};

cron.schedule('0 9 * * *', () => {
  checkInactiveUsers();
});

// ***
const cancelRequest = async (req, res) => {
  const { user_notification_id } = req.body;

  if (!user_notification_id) {
    return res.status(400).json({ error: "user_notification_id is required" });
  }

  try {
    // Combined query to check both 'accept' status and 'cancel_status'
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'accept') AS accept_count,
        MAX(cancel_status) AS cancel_status
      FROM 
        notifications 
      WHERE 
        user_notification_id = $1
    `;

    const result = await client.query(query, [user_notification_id]);

    const acceptCount = parseInt(result.rows[0].accept_count, 10);
    const currentStatus = result.rows[0].cancel_status;

    // Check if there is an 'accept' status
    if (acceptCount > 0) {
      return res
        .status(400)
        .json({ error: "Cannot cancel as status is already accepted" });
    }

    // Only update if the current cancel_status is not 'timeup'
    if (currentStatus !== "timeup") {
      await client.query(
        "UPDATE notifications SET cancel_status = $1 WHERE user_notification_id = $2",
        ["cancel", user_notification_id]
      );
      return res
        .status(200)
        .json({ message: "Cancel status updated to cancel" });
    } else {
      return res
        .status(400)
        .json({ error: "Cannot update status as it is already timeup" });
    }
  } catch (error) {
    console.error("Error updating cancel status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


 
// Function to verify OTP
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

const calculatePayment = (timeWorked) => {
 
  const [hours, minutes, seconds] = timeWorked.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;

  if (totalMinutes <= 30) {
      return 149;
  }

  const extraMinutes = totalMinutes - 30;
  const fullHalfHours = Math.floor(extraMinutes / 30);
  const remainingMinutes = extraMinutes % 30;

  let extraCharges = fullHalfHours * 49;
  if (remainingMinutes > 0) {
      const remainingCharge = Math.min(remainingMinutes * 5, 49);
      extraCharges += remainingCharge;
  }

  return 149 + extraCharges;
};

// Function to get service call details by notification_id
const paymentDetails = async (notification_id) => {
  try {
      const query = 'SELECT * FROM servicecall WHERE notification_id = $1';
      const values = [notification_id];

      const res = await client.query(query, values);

      if (res.rows.length > 0) {
          return res.rows[0];
      } else {
          throw new Error('No service call found with the given notification_id');
      }
  } catch (error) {
      console.error('Error fetching service call details:', error);
      throw error;
  }
};


const getPaymentDetails = async (notification_id) => {
  // console.log(notification_id)
  try {
    const query = `
      SELECT 
        n.service,
        u.name 
      FROM 
        accepted n
      JOIN 
        "user" u ON n.user_id = u.user_id 
      WHERE 
        n.notification_id = $1
    `;
    const values = [notification_id];

      const res = await client.query(query, values);
      
      if (res.rows.length > 0) {
        // console.log(res.rows[0])
          return res.rows[0];
      } else {
          throw new Error('No service payment details found with the given notification_id');
      }
  } catch (error) {
      console.error('Error fetching payment details details:', error);
      throw error;
  }
};

// Function to process payment ***
// const processPayment = async (req, res) => {
//   const { totalAmount, paymentMethod, decodedId } = req.body;

//   try {
//       // Update the servicecall table with payment details
//       const query = `
//           UPDATE servicecall
//           SET payment = $1, payment_type = $2
//           WHERE notification_id = $3
//       `;
 
//       await client.query(query, [totalAmount, paymentMethod, decodedId]);
      

//       const userIdDetails =  await client.query(
//         "SELECT user_id, worker_id FROM completenotifications WHERE notification_id = $1",
//         [decodedId]
//       );

//       const userId = userIdDetails.rows[0].user_id
//       const workerId = userIdDetails.rows[0].worker_id
//       const serviceResult = await updateWorkerLifeDetails(workerId, totalAmount);
      
//       const fcmTokenResult = await client.query(
//         "SELECT fcm_token FROM userfcm WHERE user_id = $1",
//         [userId]
//       );

//       const fcmTokens = fcmTokenResult.rows.map(row => row.fcm_token);
//       // console.log(fcmTokens);
      
//       if (fcmTokens.length > 0) {
//         // Create a multicast message object for all tokens
//         const multicastMessage = {
//           tokens: fcmTokens, // An array of tokens to send the same message to
//           notification: {
//             title: "Click Solver",
//             body: `Your payment has been successfully processed.`,
//           },
//           data: {
//             notification_id: decodedId.toString(),
//             screen:'Home'
//           },
//         };
      
//         try {
//           // Use sendEachForMulticast to send the same message to multiple tokens
//           const response = await getMessaging().sendEachForMulticast(multicastMessage);
      
//           // Log the responses for each token
//           response.responses.forEach((res, index) => {
//             if (res.success) {
//               // console.log(`Message sent successfully to token ${fcmTokens[index]}`);
//             } else {
//               console.error(`Error sending message to token ${fcmTokens[index]}:`, res.error);
//             }
//           });
      
//           // console.log('Success Count:', response.successCount);
//           // console.log('Failure Count:', response.failureCount);
      
//         } catch (error) {
//           console.error('Error sending notifications:', error);
//         }
//       } else {
//         console.error('No FCM tokens to send the message to.');
//       }
      


//       res.status(200).json({ message: 'Payment processed successfully' });
//   } catch (error) {
//       console.error('Error processing payment:', error);
//       res.status(500).json({ error: 'An error occurred while processing the payment' });
//   }
// };


const processPayment = async (req, res) => {
  const { totalAmount, paymentMethod, decodedId } = req.body;

  // Input Validation
  if (!totalAmount || !paymentMethod || !decodedId) {
    return res.status(400).json({ error: 'Missing required fields: totalAmount, paymentMethod, and decodedId.' });
  }

  try {
    const end_time = new Date();

    // Single query using CTEs to update servicecall and accepted tables
    const combinedQuery = `
      WITH update_servicecall AS (
        UPDATE servicecall
        SET 
          payment = $1, 
          payment_type = $2
        WHERE notification_id = $3
        RETURNING notification_id
      ),
      update_accepted AS (
        UPDATE accepted a
        SET 
          time = jsonb_set(
            COALESCE(a.time, '{}'::jsonb),
            '{paymentCompleted}',
            to_jsonb(to_char($4::timestamp, 'YYYY-MM-DD HH24:MI:SS'))
          )
        FROM update_servicecall us
        WHERE a.notification_id = us.notification_id
        RETURNING a.user_id, a.service_booked, a.worker_id
      ),
      fetch_fcm AS (
        SELECT 
          u.fcm_token 
        FROM userfcm u
        JOIN update_accepted ua ON u.user_id = ua.user_id
      ),
      update_workerlife AS (
        UPDATE workerlife wl
        SET 
          cashback_approved_times = COALESCE(service_counts / 6, 0)
        FROM update_accepted ua
        WHERE wl.worker_id = ua.worker_id
        RETURNING wl.worker_id, wl.cashback_approved_times
      )
      SELECT 
        ua.user_id, 
        ua.service_booked,
        ua.worker_id, 
        ARRAY_AGG(fcm.fcm_token) AS fcm_tokens
      FROM update_accepted ua
      LEFT JOIN fetch_fcm fcm ON TRUE
      GROUP BY ua.user_id, ua.service_booked, ua.worker_id;
    `;

    const values = [totalAmount, paymentMethod, decodedId, end_time];

    const combinedResult = await client.query(combinedQuery, values);

    // Check if any records were returned
    if (combinedResult.rows.length === 0) {
      return res.status(404).json({ error: "Notification not found." });
    }

    const row = combinedResult.rows[0];
    const { user_id, service_booked, worker_id, fcm_tokens } = row;

    // Update worker life details
    const serviceResult = await updateWorkerLifeDetails(worker_id, totalAmount);

    // Proceed to send notifications if FCM tokens are available
    if (fcm_tokens.length > 0) {
      // Create a multicast message object for all tokens
      const multicastMessage = {
        tokens: fcm_tokens, // An array of tokens to send the same message to
        notification: {
          title: "Click Solver",
          body: `Your payment of ₹${totalAmount} has been successfully processed via ${paymentMethod}.`,
        },
        data: {
          notification_id: decodedId.toString(),
          screen: 'Home'
        },
      };

      try {
        // Use sendEachForMulticast to send the same message to multiple tokens
        const response = await getMessaging().sendEachForMulticast(multicastMessage);

        // Log the responses for each token
        response.responses.forEach((resItem, index) => {
          if (resItem.success) {
            // Optionally log successful sends
            // console.log(`Message sent successfully to token ${fcm_tokens[index]}`);
          } else {
            console.error(`Error sending message to token ${fcm_tokens[index]}:`, resItem.error);
          }
        });
      } catch (error) {
        console.error('Error sending notifications:', error);
        return res.status(500).json({ error: 'Error sending notifications.' });
      }
    } else {
      console.error('No FCM tokens to send the message to.');
      // Optionally, decide whether to proceed or not. Here, we'll proceed.
    }

    // Create a background action for the user
    const screen = "";
    const encodedNotificationId = Buffer.from(decodedId.toString()).toString("base64");
    await createUserBackgroundAction(user_id, encodedNotificationId, screen, service_booked);

    // Respond with success
    return res.status(200).json({ message: 'Payment processed successfully' });

  } catch (error) {
    console.error('Error processing payment:', error);
    return res.status(500).json({ error: 'An error occurred while processing the payment' });
  }
};



const submitFeedback = async (req, res) => {
  const { notification_id, rating, comments } = req.body;

  try {
    // Step 1: Fetch worker_id, user_id, user_notification_id, user name, worker name, and FCM tokens in a single query
    const query = `
      SELECT 
        n.worker_id, 
        n.user_id, 
        n.user_notification_id, 
        u.name AS user_name, 
        w.name AS worker_name,
        uf.fcm_token 
      FROM 
        accepted n
      JOIN 
        "user" u ON n.user_id = u.user_id
      JOIN 
        workersverified w ON n.worker_id = w.worker_id
      LEFT JOIN 
        userfcm uf ON n.user_id = uf.user_id
      WHERE 
        n.notification_id = $1
    `;

    const notificationResult = await client.query(query, [notification_id]);

    if (notificationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Notification ID not found' });
    }

    const {
      worker_id,
      user_id,
      user_notification_id,
      user_name,
      worker_name,
    } = notificationResult.rows[0];

    // Step 2: Insert feedback into the feedback table
    const insertFeedbackQuery = `
      INSERT INTO feedback (notification_id, worker_id, user_id, user_notification_id, name, worker_name, rating, comment, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      RETURNING *;
    `;

    const insertFeedbackResult = await client.query(insertFeedbackQuery, [
      notification_id,
      worker_id,
      user_id,
      user_notification_id,
      user_name,
      worker_name,
      rating,
      comments,
    ]);

    // Collect FCM tokens
    const fcmTokens = notificationResult.rows.map(row => row.fcm_token).filter(token => token); // Filter out any undefined tokens

    if (fcmTokens.length > 0) {
      // Prepare multicast message
      const multicastMessage = {
        tokens: fcmTokens,
        notification: {
          title: "Click Solver",
          body: "Thanks for giving feedback to us, have a nice day.",
        },
        data: {
          user_notification_id: notification_id.toString(),
        },
      };

      try {
        const response = await getMessaging().sendEachForMulticast(multicastMessage);

        response.responses.forEach((res, index) => {
          if (res.success) {
            // console.log(`Message sent successfully to token ${fcmTokens[index]}`);
          } else {
            console.error(`Error sending message to token ${fcmTokens[index]}:`, res.error);
          }
        });

        // console.log('Success Count:', response.successCount);
        // console.log('Failure Count:', response.failureCount);
      } catch (error) {
        console.error('Error sending notifications:', error);
      }
    } else {
      console.error('No FCM tokens to send the message to.');
    }

    // Step 4: Send response after feedback submission and notification sending
    res.status(201).json({ message: 'Feedback submitted successfully', feedback: insertFeedbackResult.rows[0] });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


const sendSMSVerification = async (req, res) => {
  const { phoneNumber } = req.body;

  // Generate a random 6-digit verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000);
  const message = `Your verification code is ${verificationCode}`;

  const authString = Buffer.from(`${customerId}:${apiKey}`).toString('base64');

  try {
    // Send SMS using Telesign API
    const response = await axios.post(
      smsEndpoint,
      {
        phone_number: phoneNumber,
        message: message,
        message_type: 'OTP',
      },
      {
        headers: {
          Authorization: `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // On success, return the verification code (for testing purposes)
    res.status(200).json({ success: true, verificationCode });
  } catch (error) {
    // On failure, log and return the error
    console.error('Error sending SMS:', error.response ? error.response.data : error.message);
    res.status(500).json({ success: false, message: 'Error sending SMS' });
  }
};

// Function to get worker details
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
      return res.status(404).json({ error: 'Notification or related data not found' });
    }

    const { worker_name, service } = result.rows[0];

    // Return the worker's name and service
    res.json({ name: worker_name, service });
  } catch (error) {
    console.error('Error checking worker details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


const getServiceCompletedDetails = async (req, res) => {
  const { notification_id } = req.body;
  // console.log("getServiceCompletedDetails",notification_id)

  try {
    // Combine all steps into a single query with a transaction
    const query = `
      WITH retrieved_data AS (
          SELECT 
              n.accepted_id,
              n.notification_id, 
              n.user_notification_id,
              n.service_booked, 
              n.longitude, 
              n.latitude, 
              n.worker_id,
              un.user_id,
              sc.payment, 
              sc.payment_type, 
              un.city, 
              un.pincode, 
              un.area, 
              u.name,
              n.time -- Added time column
          FROM 
              accepted n
          JOIN 
              servicecall sc ON n.notification_id = sc.notification_id
          JOIN 
              usernotifications un ON n.user_notification_id = un.user_notification_id
          JOIN 
              "user" u ON un.user_id = u.user_id
          WHERE 
              n.notification_id = $1
      ),
      inserted_data AS (
          INSERT INTO completenotifications (
              accepted_id,
              notification_id,
              user_id,
              user_notification_id,
              service_booked,
              longitude,
              latitude,
              worker_id,
              time
          )
          SELECT 
              accepted_id,
              notification_id,
              user_id,
              user_notification_id,
              service_booked,
              longitude,
              latitude,
              worker_id,
              time
          FROM retrieved_data
          ON CONFLICT (accepted_id) DO NOTHING
          RETURNING *
      ),
      deleted_accepted_data AS (
          DELETE FROM accepted
          WHERE notification_id = $1
          RETURNING *
      ),
      deleted_service_tracking_data AS (
          DELETE FROM servicetracking
          WHERE notification_id = $1
          RETURNING *
      )
      SELECT 
          r.payment, 
          r.payment_type, 
          r.service_booked, 
          r.longitude, 
          r.latitude, 
          r.area, 
          r.city, 
          r.pincode, 
          r.name
      FROM retrieved_data r;
    `;

    const result = await client.query(query, [notification_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification or related data not found' });
    }

    // console.log("getServiceCompletedDetails",result.rows[0])

    // Extract the necessary details from the retrieved data
    const { payment, payment_type, service_booked, longitude, latitude, area, city, pincode, name } = result.rows[0];
    const jsonbServiceBooked = typeof service_booked === 'object' ? JSON.stringify(service_booked) : service_booked;

    // Return the response with the required details
    res.json({
      message: 'Service completed and data shifted successfully',
      payment,
      payment_type,
      service: jsonbServiceBooked,
      longitude,
      latitude,
      area,
      city,
      pincode,
      name
    });

  } catch (error) {
    console.error('Error checking worker details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



// const getServiceCompletedDetails = async (req, res) => {
//   const { notification_id } = req.body;
//   // console.log("getServiceCompletedDetails",notification_id)

//   try {
//     // Combine all steps into a single query with a transaction
//     const query = `
//       WITH retrieved_data AS (
//         SELECT 
//           n.accepted_id,
//           n.notification_id, 
//           n.user_notification_id,
//           n.service_booked, 
//           n.longitude, 
//           n.latitude, 
//           n.worker_id,
//           un.user_id,
//           sc.payment, 
//           sc.payment_type, 
//           un.city, 
//           un.pincode, 
//           un.area, 
//           u.name
//         FROM 
//           accepted n
//         JOIN 
//           servicecall sc ON n.notification_id = sc.notification_id
//         JOIN 
//           usernotifications un ON n.user_notification_id = un.user_notification_id
//         JOIN 
//           "user" u ON un.user_id = u.user_id
//         WHERE 
//           n.notification_id = $1
//       ),
//       inserted_data AS (
//         INSERT INTO completenotifications (
//           accepted_id,
//           notification_id,
//           user_id,
//           user_notification_id,
//           service_booked,
//           longitude,
//           latitude,
//           worker_id
//         )
//         SELECT 
//           accepted_id,
//           notification_id,
//           user_id,
//           user_notification_id,
//           service_booked,
//           longitude,
//           latitude,
//           worker_id
//         FROM retrieved_data
//         RETURNING *
//       ),
//       deleted_accepted_data AS (
//         DELETE FROM accepted
//         WHERE notification_id = $1
//         RETURNING *
//       ),
//       deleted_service_tracking_data AS (
//         DELETE FROM servicetracking
//         WHERE notification_id = $1
//         RETURNING *
//       )
//       SELECT 
//         r.payment, 
//         r.payment_type, 
//         r.service_booked, 
//         r.longitude, 
//         r.latitude, 
//         r.area, 
//         r.city, 
//         r.pincode, 
//         r.name
//       FROM retrieved_data r;
//     `;

//     const result = await client.query(query, [notification_id]);

//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'Notification or related data not found' });
//     }

//     // console.log("getServiceCompletedDetails",result.rows[0])

//     // Extract the necessary details from the retrieved data
//     const { payment, payment_type, service_booked, longitude, latitude, area, city, pincode, name } = result.rows[0];
//     const jsonbServiceBooked = typeof service_booked === 'object' ? JSON.stringify(service_booked) : service_booked;

//     // Return the response with the required details
//     res.json({
//       message: 'Service completed and data shifted successfully',
//       payment,
//       payment_type,
//       service: jsonbServiceBooked,
//       longitude,
//       latitude,
//       area,
//       city,
//       pincode,
//       name
//     });

//   } catch (error) {
//     console.error('Error checking worker details:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };


function convertToDateString(isoDate) {
  if (!isoDate) {
      // Handle case where isoDate is null or undefined
      return null;
  }
  
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) {
      // Handle invalid date format
      return null;
  }

  // Extract year, month, day, hours, minutes, seconds, and milliseconds
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is zero-based
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

  // Return the formatted date string
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

const getWorkerEarnings = async (req, res) => {
  const { date, startDate, endDate } = req.body;
  const workerId = req.worker.id;

  let selectStartDate;
  let selectEndDate;

  if (startDate && endDate) {
    selectStartDate = convertToDateString(startDate);
    selectEndDate = convertToDateString(endDate);

    if (!selectStartDate || !selectEndDate) {
      return res.status(400).json({ error: 'Invalid startDate or endDate format' });
    }

    if (new Date(selectStartDate) > new Date(selectEndDate)) {
      return res.status(400).json({ error: 'startDate cannot be after endDate' });
    }
  } else if (date) {
    selectStartDate = convertToDateString(date);
    selectEndDate = selectStartDate;

    if (!selectStartDate) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
  } else {
    return res.status(400).json({ error: 'No date provided' });
  }

  try {
    const query = `
      SELECT 
        SUM(payment) AS total_payment, 
        SUM(CASE WHEN payment_type = 'cash' THEN payment ELSE 0 END) AS cash_payment, 
        COUNT(*) AS payment_count,
        (SELECT SUM(payment) 
          FROM servicecall 
          WHERE worker_id = $1
            AND payment IS NOT NULL
        ) AS life_earnings, 
        (SELECT AVG(rating) 
          FROM feedback 
          WHERE worker_id = $1
        ) AS avg_rating, 
        (SELECT COUNT(*) 
          FROM notifications 
          WHERE worker_id = $1
            AND status = 'reject'
            AND DATE(created_at) BETWEEN DATE($2) AND DATE($3)
        ) AS rejected_count,
        (SELECT COUNT(*) 
          FROM notifications 
          WHERE worker_id = $1
            AND status = 'pending'
            AND DATE(created_at) BETWEEN DATE($2) AND DATE($3)
        ) AS pending_count,
        (SELECT EXTRACT(EPOCH FROM SUM(CAST(time_worked AS INTERVAL))) / 3600
          FROM servicecall
          WHERE worker_id = $1
            AND time_worked IS NOT NULL
            AND DATE(end_time) BETWEEN DATE($2) AND DATE($3)
        ) AS total_time_worked_hours,
        (SELECT service_counts FROM workerlife WHERE worker_id = $1) AS service_counts,
        (SELECT cashback_approved_times FROM workerlife WHERE worker_id = $1) AS cashback_approved_times,
        (SELECT cashback_gain FROM workerlife WHERE worker_id = $1) AS cashback_gain
      FROM servicecall s
      WHERE worker_id = $1
        AND payment IS NOT NULL
        AND DATE(end_time) BETWEEN DATE($2) AND DATE($3);
    `;

    const result = await client.query(query, [workerId, selectStartDate, selectEndDate]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No earnings data found' });
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
      cashback_gain
    } = result.rows[0];

    res.json({ 
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
      cashback_gain: Number(cashback_gain) || 0
    });

  } catch (error) {
    console.error('Error fetching worker earnings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



// const getWorkerEarnings = async (req, res) => {
//   // Destructure the possible date parameters from the request body
//   const { date, startDate, endDate } = req.body;
//   const workerId = req.worker.id;

//   let selectStartDate;
//   let selectEndDate;

//   // Determine whether to use a single date or a date range
//   if (startDate && endDate) {
//     // Convert and validate the startDate and endDate
//     selectStartDate = convertToDateString(startDate);
//     selectEndDate = convertToDateString(endDate);

//     if (!selectStartDate || !selectEndDate) {
//       return res.status(400).json({ error: 'Invalid startDate or endDate format' });
//     }

//     // Ensure that startDate is not after endDate
//     if (new Date(selectStartDate) > new Date(selectEndDate)) {
//       return res.status(400).json({ error: 'startDate cannot be after endDate' });
//     }
//   } else if (date) {
//     // If only a single date is provided, use it for both start and end dates
//     selectStartDate = convertToDateString(date);
//     selectEndDate = selectStartDate;

//     if (!selectStartDate) {
//       return res.status(400).json({ error: 'Invalid date format' });
//     }
//   } else {
//     // If neither date nor date range is provided, return an error
//     return res.status(400).json({ error: 'No date provided' });
//   }

//   try {
//     // Define the SQL query with placeholders for parameters
//     const query = `
//       SELECT 
//         SUM(payment) AS total_payment, 
//         SUM(CASE WHEN payment_type = 'cash' THEN payment ELSE 0 END) AS cash_payment, 
//         COUNT(*) AS payment_count,
//         (SELECT SUM(payment) 
//           FROM servicecall 
//           WHERE worker_id = $1
//             AND payment IS NOT NULL
//         ) AS life_earnings, 
//         (SELECT AVG(rating) 
//           FROM feedback 
//           WHERE worker_id = $1
//         ) AS avg_rating, 
//         (SELECT COUNT(*) 
//           FROM notifications 
//           WHERE worker_id = $1
//             AND status = 'reject'
//             AND DATE(created_at) BETWEEN DATE($2) AND DATE($3)
//         ) AS rejected_count, -- Count of 'rejected' statuses
//         (SELECT COUNT(*) 
//           FROM notifications 
//           WHERE worker_id = $1
//             AND status = 'pending'
//             AND DATE(created_at) BETWEEN DATE($2) AND DATE($3)
//         ) AS pending_count, -- Count of 'pending' statuses
//         (SELECT EXTRACT(EPOCH FROM SUM(CAST(time_worked AS INTERVAL))) / 3600
//           FROM servicecall
//           WHERE worker_id = $1
//             AND time_worked IS NOT NULL
//             AND DATE(end_time) BETWEEN DATE($2) AND DATE($3)
//         ) AS total_time_worked_hours -- Total time worked in hours
//       FROM servicecall s
//       WHERE worker_id = $1
//         AND payment IS NOT NULL
//         AND DATE(end_time) BETWEEN DATE($2) AND DATE($3);
//     `;

//     // Execute the SQL query with the appropriate parameters
//     const result = await client.query(query, [workerId, selectStartDate, selectEndDate]);

//     // If no records are found, return a 404 error
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'No earnings data found' });
//     }

//     // Destructure the results, ensuring consistent naming
//     const {
//       total_payment,
//       cash_payment,
//       payment_count,
//       life_earnings,
//       avg_rating,
//       rejected_count,
//       pending_count,
//       total_time_worked_hours,
//     } = result.rows[0];

//     // Send the response with the earnings data, ensuring numerical values
//     res.json({ 
//       total_payment: Number(total_payment) || 0, 
//       cash_payment: Number(cash_payment) || 0, 
//       payment_count: Number(payment_count) || 0, 
//       life_earnings: Number(life_earnings) || 0, 
//       avg_rating: Number(avg_rating) || 0, 
//       rejected_count: Number(rejected_count) || 0, 
//       pending_count: Number(pending_count) || 0, 
//       total_time_worked_hours: Number(total_time_worked_hours) || 0 
//     });

//   } catch (error) {
//     console.error('Error fetching worker earnings:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };


const getWorkDetails = async (req, res) => {
  const { notification_id } = req.body;
  // console.log(notification_id)

  try {
    const queryText = `
      SELECT 
        n.service_booked, 
        un.city, 
        un.area, 
        un.pincode 
      FROM 
        accepted n
      JOIN 
        usernotifications un 
      ON 
        n.user_notification_id = un.user_notification_id
      WHERE 
        n.notification_id = $1;
    `;
    const queryValues = [notification_id];

    const result = await client.query(queryText, queryValues);

    if (result.rows.length > 0) {
      const workDetails = result.rows[0];
      const service_booked = result.rows[0].service_booked

      const gstRate = 0.05;
      const discountRate = 0.05;
  
      const fetchedTotalAmount = service_booked.reduce((total, service) => total + (service.cost || 0), 0);
  
      const gstAmount = fetchedTotalAmount * gstRate;
      const cgstAmount = fetchedTotalAmount * gstRate;
      const discountAmount = fetchedTotalAmount * discountRate;
      const fetchedFinalTotalAmount = fetchedTotalAmount + gstAmount + cgstAmount - discountAmount;
  
      const paymentDetails = {
        gstAmount,
        cgstAmount,
        discountAmount,
        fetchedFinalTotalAmount,
      };
      res.status(200).json({workDetails,paymentDetails});
    } else {
      res.status(404).json({ error: 'Notification not found' });
    }
  } catch (error) {
    console.error('Error fetching work details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getUserById,
  getElectricianServices,
  verifyOTP,
  getServices,
  getPlumberServices,
  getCleaningServices,
  getPaintingServices,
  getVehicleServices,
  login,
  storeUserLocation,
  addWorker,
  storeWorkerLocation,
  storeFcmToken,
  getWorkersNearby,
  Partnerlogin,
  workerAuthentication,
  acceptRequest,
  rejectRequest,
  checkStatus,
  getServicesBySearch,
  getLocationDetails,
  userCancelNavigation,
  cancelRequest,
  checkCancellationStatus,
  updateUserNavigationStatus,
  fetchLocationDetails,
  workerCancelNavigation,
  workerCancellationStatus,
  userCancellationStatus,
  getUserAddressDetails,
  updateWorkerLocation,
  workerVerifyOtp,
  startStopwatch,
  stopStopwatch,
  getTimerValue,
  paymentDetails,
  calculatePayment,
  getWorkDetails,
  subservices,
  skillWorkerRegistration,
  workerLifeDetails,
  registrationStatus,
  updateWorkerLifeDetails,
  getWorkerNavigationDetails,
  workerProfileDetails,
  getVerificationStatus,
  workerDetails,
  submitFeedback,
  processPayment,
  getUserBookings,
  loginStatus,
  createUserAction,
  getUserTrackRoute,
  getWorkerTrackRoute,
  createWorkerAction,
  storeNotification,
  getWorkerNotifications,
  storeUserFcmToken,
  storeUserNotification,
  getUserNotifications,
  getIndividualServices,
  userUpdateLastLogin,
  workCompletedRequest,
  TimeStart,
  CheckStartTime,
  serviceCompleted,
  checkTaskStatus,
  getTimeDifferenceInIST,
  workCompletionCancel,
  getAllLocations,
  userActionRemove,
  getWorkerBookings,
  sendSMSVerification,
  sendOtp,
  validateOtp,
  getServiceByName,
  getWorkerProfleDetails,
  getWorkerReviewDetails,
  getPaymentDetails,
  getServiceCompletedDetails,
  getWorkerEarnings,
  getUserAndWorkerLocation,
  userNavigationCancel,
  workerNavigationCancel,
  workerCompleteSignUp,
  checkOnboardingStatus,
  getServicesPhoneNumber,
  registrationSubmit,
  addBankAccount,
  getAllBankAccounts,
  addUpiId,
  onboardingSteps,
  getWorkerProfileDetails,
  balanceAmmountToPay,
  getWorkerDetails,
  insertRelatedService,
  getUserAllBookings,
  userProfileDetails,
  accountDetailsUpdate,
  insertTracking,
  getWorkerTrackingServices,
  getServiceTrackingWorkerItemDetails,
  serviceTrackingUpdateStatus,
  getServiceTrackingUserItemDetails,
  getUserTrackingServices,
  serviceDeliveryVerification,
  getPendingWorkers,
  getPendingWorkerDetails,
  updateIssues,
  updateApproveStatus,
  checkApprovalVerificationStatus,
  workerApprove,
  getServiceBookingItemDetails,
  getWorkersPendingCashback,
  getWorkerCashbackDetails,
  workerCashbackPayed,
  userCompleteSignUp
};
