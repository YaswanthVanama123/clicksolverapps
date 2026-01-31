/**
 * Payment Feature Module
 *
 * Exports all payment-related controllers
 *
 * Categories:
 * 1. Razorpay Order/Payment Operations (createOrder, verifyPayment)
 * 2. Payment Processing (processPayment, paymentDetails, calculatePayment, getPaymentDetails)
 * 3. Admin/Balance Queries (getWorkersPendingCashback, pendingBalanceWorkers)
 */

const {
  // Razorpay operations
  createOrder,
  verifyPayment,

  // Payment processing
  processPayment,
  paymentDetails,
  calculatePayment,
  getPaymentDetails,

  // Admin queries
  getWorkersPendingCashback,
  pendingBalanceWorkers,
} = require('./controllers/index');

module.exports = {
  // Razorpay operations
  createOrder,
  verifyPayment,

  // Payment processing
  processPayment,
  paymentDetails,
  calculatePayment,
  getPaymentDetails,

  // Admin queries
  getWorkersPendingCashback,
  pendingBalanceWorkers,
};
