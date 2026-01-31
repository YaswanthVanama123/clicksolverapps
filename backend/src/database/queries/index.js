/**
 * Queries Index
 * Central export point for all database queries
 */

const userQueries = require('./user.queries');
const workerQueries = require('./worker.queries');
const bookingQueries = require('./booking.queries');
const paymentQueries = require('./payment.queries');
const serviceQueries = require('./service.queries');
const trackingQueries = require('./tracking.queries');
const messagingQueries = require('./messaging.queries');
const adminQueries = require('./admin.queries');
const authQueries = require('./auth.queries');

module.exports = {
  // Individual Named Exports
  userQueries,
  workerQueries,
  bookingQueries,
  paymentQueries,
  serviceQueries,
  trackingQueries,
  messagingQueries,
  adminQueries,
  authQueries,

  // Spread all query functions for backward compatibility
  ...userQueries,
  ...workerQueries,
  ...bookingQueries,
  ...paymentQueries,
  ...serviceQueries,
  ...trackingQueries,
  ...messagingQueries,
  ...adminQueries,
  ...authQueries,

  // Grouped exports (for organized access)
  queries: {
    user: userQueries,
    worker: workerQueries,
    booking: bookingQueries,
    payment: paymentQueries,
    service: serviceQueries,
    tracking: trackingQueries,
    messaging: messagingQueries,
    admin: adminQueries,
    auth: authQueries,
  },
};
