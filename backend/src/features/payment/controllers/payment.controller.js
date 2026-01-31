const admin = require("../../../config/firebase.config.js");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const { getMessaging } = require("firebase-admin/messaging");
const db = admin.firestore();
const client = require("../../../database/connection.js");
const paymentQueries = require("../../../database/queries/payment.queries.js");

// Initialize Razorpay
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

// ============================================
// AVAILABLE PAYMENT QUERIES (from payment.queries.js)
// ============================================
// The following queries are now being used from the paymentQueries module:
//
// RAZORPAY ORDER QUERIES:
// - insertOrderQuery: Insert new order into orders table
// - verifyPaymentCTEQuery: Update order status and insert payment record
// - updateWorkerlifeCTEQuery: Update workerlife balance and payment history
// - processPaymentCombinedQuery: Complex payment processing with service completion
// - deleteAcceptedByNotificationIdQuery: Delete accepted record after processing
//
// SERVICE CALL AND PAYMENT DETAILS:
// - getServiceCallByNotificationIdQuery: Get service call details by notification ID
// - getPaymentDetailsWithUserQuery: Get payment details with user information
//
// WORKER BALANCE AND CASHBACK:
// - getPendingBalanceWorkersQuery: Get workers with pending balances
// - getWorkersPendingCashbackQuery: Get workers with pending cashback
//
// STANDARD PAYMENT QUERIES (available but not currently used in this controller):
// - getPaymentDetailsQuery: Get payment by ID
// - createPaymentQuery: Insert a new payment record
// - updatePaymentStatusQuery: Update payment status
// - getPaymentsByBookingQuery: Get payments for a booking
// - getPaymentsByUserQuery: Get payments for a user (with pagination)
// - getPaymentsByWorkerQuery: Get payments for a worker (with pagination)
// - getPaymentsByStatusQuery: Get payments by status (with pagination)
// - getPaymentSummaryByWorkerQuery: Get payment summary for a worker
// - getPaymentSummaryByUserQuery: Get payment summary for a user
// - getRevenueByDateRangeQuery: Get revenue within date range
// - checkPaymentByTransactionIdQuery: Check payment by transaction ID
// - deletePaymentQuery: Soft delete a payment record

// ============================================
// PAYMENT MANAGEMENT FUNCTIONS
// ============================================

/**
 * Create a payment order with Razorpay
 * @route POST /api/payment/create-order
 * @param {Object} req - Express request object
 * @param {number} req.body.amount - Amount to be paid in rupees
 * @param {string} req.body.currency - Currency code (default: INR)
 * @param {Object} req.worker - Authenticated worker data
 * @returns {Object} Order details with order_id
 */
const createOrder = async (req, res) => {
  try {
    const { amount, currency = "INR" } = req.body;
    const worker_id = req.worker.id; // from authenticateWorkerToken
    console.log("wo", worker_id);
    // Convert amount from rupees to paise for Razorpay
    const rupeesAmount = parseFloat(amount).toFixed(2);
    const paiseAmount = Math.round(parseFloat(amount) * 100);

    // Set options for Razorpay order creation
    const options = {
      amount: paiseAmount, // Amount in paise
      currency,
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1, // Auto-capture payment
    };

    // Create the order with Razorpay
    const order = await razorpayInstance.orders.create(options);
    console.log("Razorpay Order:", order); // Debug log

    if (!order || !order.id) {
      throw new Error(
        "Order creation failed: No valid order returned from Razorpay."
      );
    }

    // Insert the pending order into the orders table
    await client.query(paymentQueries.insertOrderQuery, [
      worker_id,
      order.id,
      rupeesAmount,
      currency,
    ]);

    res.status(200).json({
      success: true,
      order_id: order.id,
      amount: rupeesAmount,
      currency,
    });
  } catch (error) {
    console.error("Error in createOrder:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Verify payment signature and update payment status
 * @route POST /api/payment/verify
 * @param {Object} req - Express request object
 * @param {string} req.body.razorpay_order_id - Order ID from Razorpay
 * @param {string} req.body.razorpay_payment_id - Payment ID from Razorpay
 * @param {string} req.body.razorpay_signature - Signature from Razorpay
 * @param {string} req.body.method - Payment method used
 * @returns {Object} Payment verification result
 */
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    const worker_id = req.worker.id; // from authenticateWorkerToken
    console.log("worker_id", worker_id);

    // Generate expected signature using HMAC with SHA256
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const paymentStatus =
      expectedSignature === razorpay_signature ? "success" : "failed";
    console.log("status", paymentStatus);
    const payment_method = req.body.method || "unknown";
    const error_message =
      paymentStatus === "failed" ? "Invalid payment signature" : null;

    // Begin transaction
    await client.query("BEGIN");

    // 1) Update orders and insert payment (using chained CTEs)
    const paymentResult = await client.query(paymentQueries.verifyPaymentCTEQuery, [
      razorpay_order_id,
      worker_id,
      paymentStatus,
      razorpay_payment_id,
      payment_method,
      error_message,
    ]);

    // 2) Update workerlife and workersverified with minimal data returned
    await client.query(paymentQueries.updateWorkerlifeCTEQuery, [
      razorpay_order_id,
      worker_id,
      paymentStatus,
    ]);

    // Commit the transaction
    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Payment verified successfully!",
      data: paymentResult.rows,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in verifyPayment:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Process payment for service completion
 * @route POST /api/payment/process
 * @param {Object} req - Express request object
 * @param {number} req.body.totalAmount - Total amount to be paid
 * @param {string} req.body.paymentMethod - Payment method (cash or online)
 * @param {string} req.body.decodedId - Notification ID for the service
 * @returns {Object} Payment processing result
 */
const processPayment = async (req, res) => {
  const { totalAmount, paymentMethod, decodedId } = req.body;

  if (!paymentMethod || !decodedId) {
    return res.status(402).json({
      error:
        "Missing required fields: totalAmount, paymentMethod, and decodedId.",
    });
  }

  try {
    const end_time = new Date();

    const values = [
      totalAmount, // $1: payment
      paymentMethod, // $2: payment_type
      decodedId, // $3: notification_id
      end_time, // $4: timestamp
      paymentMethod, // $5: for workerlife logic (cash vs non-cash)
      totalAmount, // $6: money earned
    ];

    const combinedResult = await client.query(paymentQueries.processPaymentCombinedQuery, values);
    if (combinedResult.rows.length === 0) {
      return res.status(404).json({ error: "Notification not found." });
    }

    // Remove the processed accepted row
    await client.query(paymentQueries.deleteAcceptedByNotificationIdQuery, [
      decodedId,
    ]);

    const {
      user_id,
      service_booked,
      worker_id,
      final_balance,
      user_fcm_tokens,
    } = combinedResult.rows[0];

    // Background actions
    const encodedNotificationId = Buffer.from(decodedId.toString()).toString(
      "base64"
    );
    await createUserBackgroundAction(
      user_id,
      encodedNotificationId,
      "",
      service_booked
    );
    await updateWorkerAction(worker_id, encodedNotificationId, "");

    // Send FCM to the user
    if (user_fcm_tokens.length) {
      await admin.messaging().sendEachForMulticast({
        tokens: user_fcm_tokens,
        notification: {
          title: "Payment Confirmation",
          body: `Payment of ${totalAmount} completed! New balance is ${final_balance}.`,
        },
        data: {
          notification_id: decodedId.toString(),
          type: "PAYMENT_CONFIRMATION",
          screen: "Home",
        },
      });
    }

    return res.status(200).json({ message: "Payment processed successfully" });
  } catch (error) {
    console.error("Error processing payment:", error);
    return res.status(500).json({ error: "Error while processing payment." });
  }
};

/**
 * Get payment details for a service by notification_id
 * Retrieves basic service call information from servicecall table
 * @param {number} notification_id - The notification ID for the service
 * @returns {Object} Service call details object
 * @throws {Error} If no service call found
 */
const paymentDetails = async (notification_id) => {
  try {
    // Note: This function queries servicecall table, not the payments table
    // Kept as-is since it serves a different purpose than the payment queries
    const values = [notification_id];

    const res = await client.query(paymentQueries.getServiceCallByNotificationIdQuery, values);

    if (res.rows.length > 0) {
      return res.rows[0];
    } else {
      throw new Error("No service call found with the given notification_id");
    }
  } catch (error) {
    console.error("Error fetching service call details:", error);
    throw error;
  }
};

/**
 * Calculate payment amount based on time worked
 * Base rate: Rs 149 for first 30 minutes
 * Extra: Rs 49 per 30 minutes (or proportional)
 * @param {string} timeWorked - Time worked in HH:MM:SS format
 * @returns {number} Payment amount in rupees
 */
const calculatePayment = (timeWorked) => {
  const [hours, minutes, seconds] = timeWorked.split(":").map(Number);
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

/**
 * Get detailed payment information for a service
 * Includes service name, discount, total cost, and user name
 * @param {number} notification_id - The notification ID for the service
 * @returns {Object} Payment details including service and user info
 * @throws {Error} If no payment details found
 */
const getPaymentDetails = async (notification_id) => {
  try {
    // Note: This function queries accepted table for service details, not payments table
    // Kept as-is since it serves a different purpose than the payment queries
    const values = [notification_id];

    const res = await client.query(paymentQueries.getPaymentDetailsWithUserQuery, values);

    if (res.rows.length > 0) {
      return res.rows[0];
    } else {
      throw new Error(
        "No service payment details found with the given notification_id"
      );
    }
  } catch (error) {
    console.error("Error fetching payment details details:", error);
    throw error;
  }
};

/**
 * Get workers with pending balance amounts
 * @route GET /api/payment/pending-balance
 * @returns {Array} List of workers with pending balance
 */
const pendingBalanceWorkers = async (req, res) => {
  try {
    const result = await client.query(paymentQueries.getPendingBalanceWorkersQuery);

    // Send the results as JSON
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching pending balance worker details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Get workers with pending cashback
 * @route GET /api/payment/pending-cashback
 * @returns {Array} List of workers with pending cashback
 */
const getWorkersPendingCashback = async (req, res) => {
  try {
    const result = await client.query(paymentQueries.getWorkersPendingCashbackQuery);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching pending cashback for workers:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Get worker details for payment
 * @route POST /api/payment/details
 * @param {Object} req - Express request object
 * @param {number} req.body.notification_id - The notification ID
 * @returns {Object} Worker details including service, discount, cost, name, and location
 */
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

/**
 * Get service completed details for payment
 * @route POST /api/payment/worker/payment/service/completed/details
 * @param {Object} req - Express request object
 * @param {number} req.body.notification_id - The notification ID
 * @returns {Object} Service completed details including payment, service, location, and user info
 */
const getServiceCompletedDetails = async (req, res) => {
  const { notification_id } = req.body;
  console.log("notification", notification_id);

  try {
    const query = `
      SELECT
          sc.payment,
          sc.payment_type,
          cn.service_booked,
          cn.longitude,
          cn.latitude,
          un.area,
          u.name
      FROM completenotifications cn
      JOIN servicecall sc ON cn.notification_id = sc.notification_id
      JOIN usernotifications un ON cn.user_notification_id = un.user_notification_id
      JOIN "user" u ON un.user_id = u.user_id
      WHERE cn.notification_id = $1;
    `;

    const result = await client.query(query, [notification_id]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Notification or related data not found" });
    }

    const {
      payment,
      payment_type,
      service_booked,
      longitude,
      latitude,
      area,
      name,
    } = result.rows[0];
    const jsonbServiceBooked =
      typeof service_booked === "object"
        ? JSON.stringify(service_booked)
        : service_booked;

    return res.json({
      message: "Service completed and data shifted successfully",
      payment,
      payment_type,
      service: jsonbServiceBooked,
      longitude,
      latitude,
      area,
      name,
    });
  } catch (error) {
    console.error("Error checking worker details:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ============================================
// HELPER FUNCTIONS (PLACEHOLDERS)
// ============================================

/**
 * Create user background action (placeholder - implement based on actual requirements)
 */
const createUserBackgroundAction = async (user_id, notification_id, extra, service) => {
  // Implementation needed
};

/**
 * Update worker action (placeholder - implement based on actual requirements)
 */
const updateWorkerAction = async (worker_id, notification_id, extra) => {
  // Implementation needed
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  createOrder,
  verifyPayment,
  processPayment,
  paymentDetails,
  calculatePayment,
  getPaymentDetails,
  pendingBalanceWorkers,
  getWorkersPendingCashback,
  getWorkerDetails,
  getServiceCompletedDetails,
};
