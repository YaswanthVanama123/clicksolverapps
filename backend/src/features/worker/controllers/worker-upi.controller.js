const axios = require("axios");
const client = require("../../../../connection.js");
const {
  upsertUpiIdQuery,
  upsertUpiAccountQuery,
} = require("../../../database/queries/worker.queries.js");

// UPI Functions - UPI ID Management and Validation

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

module.exports = {
  addUpiId,
  validateAndSaveUPI,
};
