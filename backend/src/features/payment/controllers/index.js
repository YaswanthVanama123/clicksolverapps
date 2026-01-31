/**
 * Payment Controllers Index
 *
 * Exports all payment-related controller functions
 *
 * Categories:
 * 1. Razorpay Order/Payment Operations (createOrder, verifyPayment)
 * 2. Payment Processing (processPayment, paymentDetails, calculatePayment, getPaymentDetails)
 * 3. Worker/Service Details (getWorkerDetails, getServiceCompletedDetails)
 * 4. Admin/Balance Queries (getWorkersPendingCashback, pendingBalanceWorkers)
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

  // Worker/Service details
  getWorkerDetails,
  getServiceCompletedDetails,

  // Admin queries
  getWorkersPendingCashback,
  pendingBalanceWorkers,
} = require('./payment.controller');

module.exports = {
  // Razorpay operations
  createOrder,
  verifyPayment,

  // Payment processing
  processPayment,
  paymentDetails,
  calculatePayment,
  getPaymentDetails,

  // Worker/Service details
  getWorkerDetails,
  getServiceCompletedDetails,

  // Admin queries
  getWorkersPendingCashback,
  pendingBalanceWorkers,
};
