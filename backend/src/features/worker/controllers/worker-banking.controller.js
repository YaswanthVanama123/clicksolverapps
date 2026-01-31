const axios = require("axios");
const { encrypt } = require("../../../utils/encrytion.js");
const client = require("../../../../connection.js");
const {
  upsertBankAccountQuery,
  getWorkerContactIdQuery,
  upsertFundAccountQuery,
} = require("../../../database/queries/worker.queries.js");

// Banking Functions - Bank Account and Fund Account Management

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

module.exports = {
  addBankAccount,
  createFundAccount,
};
