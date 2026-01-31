const axios = require("axios");
const Razorpay = require("razorpay");
const { encrypt } = require("../../../utils/encrytion.js");
const client = require("../../../../connection.js");
const {
  upsertBankAccountQuery,
  getWorkerContactIdQuery,
  upsertFundAccountQuery,
  upsertUpiIdQuery,
  upsertUpiAccountQuery,
  getWorkerEarningsQuery,
  getBalanceAmountToPayQuery,
  getWorkerBalanceDetailsQuery,
  getWorkerCashbackDetailsQuery,
  updateWorkerCashbackPayedQuery,
  getCashbackHistoryQuery,
  getBalanceHistoryQuery,
} = require("../../../database/queries/worker.queries.js");

// Initialize Razorpay
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

// Financial, Banking, Earnings, and Cashback Functions

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
    // Call Razorpay API to verify the bank account details
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

    const verificationResult = razorpayResponse.data;
    console.log("Verification result:", verificationResult);

    // Encrypt sensitive fields
    const encryptedAccountNumber = encrypt(accountNumber);
    const encryptedIfscCode = encrypt(ifscCode);

    const values = [
      workerId,
      bankName,
      encryptedAccountNumber,
      encryptedIfscCode,
      accountHolderName,
    ];

    await client.query(upsertBankAccountQuery, values);

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
    const { id: worker_id } = req.worker;
    const { name, ifsc, account_number, bank_name } = req.body;

    if (!name || !ifsc || !account_number || !bank_name) {
      return res
        .status(400)
        .json({ message: "All bank account details are required." });
    }

    // Fetch the worker's Razorpay contact_id
    const contactResult = await client.query(getWorkerContactIdQuery, [
      worker_id,
    ]);
    if (contactResult.rows.length === 0 || !contactResult.rows[0].contact_id) {
      return res.status(400).json({
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

    const { id: fund_account_id } = razorpayResponse.data;

    // Encrypt sensitive data
    const encryptedAccountNumber = encrypt(account_number);

    const values = [
      worker_id,
      contact_id,
      fund_account_id,
      bank_name,
      ifsc,
      encryptedAccountNumber,
    ];
    await client.query(upsertFundAccountQuery, values);

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
  const upiId = req.body.upi_id;

  try {
    const values = [workerId, upiId];

    await client.query(upsertUpiIdQuery, values);

    res.status(201).json({ message: "Bank account added successfully" });
  } catch (error) {
    console.error(
      "Error inserting or updating data in bank account table:",
      error
    );
    res.status(500).json({ message: "Error adding account", error });
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
      const values = [
        workerId,
        upi_id,
        true,
        JSON.stringify(validationResponse),
      ];

      const result = await client.query(upsertUpiAccountQuery, values);
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

// Helper function to convert date strings
const convertToDateString = (dateStr) => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return null;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (err) {
    return null;
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
    const values = [workerId, start, end];
    console.log("🛠️ Executing SQL with values:", values);

    const { rows } = await client.query(getWorkerEarningsQuery, values);
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

const balanceAmmountToPay = async (req, res) => {
  const worker_id = req.worker.id;

  try {
    const result = await client.query(getBalanceAmountToPayQuery, [worker_id]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No payments found for this worker" });
    }

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching balance amount to pay:", err);
    res
      .status(500)
      .json({ error: "An error occurred while retrieving payments" });
  }
};

const getWorkerBalanceDetails = async (req, res) => {
  try {
    const { worker_id } = req.body;
    console.log(worker_id);

    const values = [worker_id];
    const result = await client.query(getWorkerBalanceDetailsQuery, values);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching worker cashback details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getWorkerCashbackDetails = async (req, res) => {
  try {
    const { worker_id } = req.body;
    console.log(worker_id);

    const values = [worker_id];
    const result = await client.query(getWorkerCashbackDetailsQuery, values);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching worker cashback details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const workerCashbackPayed = async (req, res) => {
  const { worker_id, cashbackCount, cashbackPayed } = req.body;
  console.log(worker_id, cashbackPayed, cashbackCount);
  try {
    const currentTime = new Date().toISOString();

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
    const { rows } = await client.query(updateWorkerCashbackPayedQuery, [
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

const cashbackHistory = async (req, res) => {
  const { worker_id } = req.query;

  // Validate input
  if (!worker_id) {
    return res.status(400).json({ error: "worker_id is required" });
  }

  try {
    const { rows } = await client.query(getCashbackHistoryQuery, [worker_id]);

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
    const { rows } = await client.query(getBalanceHistoryQuery, [worker_id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Worker not found" });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error fetching balance history:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  addBankAccount,
  createFundAccount,
  addUpiId,
  validateAndSaveUPI,
  getWorkerEarnings,
  balanceAmmountToPay,
  getWorkerBalanceDetails,
  getWorkerCashbackDetails,
  workerCashbackPayed,
  cashbackHistory,
  balanceHistory,
};
