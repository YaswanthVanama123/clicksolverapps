/**
 * Central Route Aggregator
 *
 * This file imports and mounts all feature-specific routes from the modular architecture.
 * All routes are mounted at the root level (/) since they already include their path prefixes.
 *
 * Features:
 * - Auth: Authentication and session management
 * - User: User profile, bookings, locations, actions, offers, notifications
 * - Worker: Worker profile, onboarding, bookings, locations, financial, notifications, actions
 * - Service: Service catalog, tracking, and work management
 * - Booking: Booking requests, status, and details
 * - Payment: Payment processing and verification
 * - Tracking: Location tracking and navigation
 * - Messaging: Chat and call functionality
 * - Admin: Administrative operations
 */

const express = require('express');
const router = express.Router();

// ============================================================================
// Authentication Routes
// ============================================================================
const authRoutes = require('../features/auth/routes/auth.routes');

// ============================================================================
// User Routes
// ============================================================================
const userProfileRoutes = require('../features/user/routes/user-profile.routes');
const userBookingRoutes = require('../features/user/routes/user-booking.routes');
const userLocationRoutes = require('../features/user/routes/user-location.routes');
const userActionRoutes = require('../features/user/routes/user-action.routes');
const userOfferRoutes = require('../features/user/routes/user-offer.routes');
const userNotificationRoutes = require('../features/user/routes/user-notification.routes');

// ============================================================================
// Worker Routes
// ============================================================================
const workerProfileRoutes = require('../features/worker/routes/worker-profile.routes');
const workerOnboardingRoutes = require('../features/worker/routes/worker-onboarding.routes');
const workerBookingRoutes = require('../features/worker/routes/worker-booking.routes');
const workerLocationRoutes = require('../features/worker/routes/worker-location.routes');
const workerFinancialRoutes = require('../features/worker/routes/worker-financial.routes');
const workerNotificationRoutes = require('../features/worker/routes/worker-notification.routes');
const workerActionRoutes = require('../features/worker/routes/worker-action.routes');

// ============================================================================
// Service Routes
// ============================================================================
const serviceCatalogRoutes = require('../features/service/routes/service-catalog.routes');
const serviceTrackingRoutes = require('../features/service/routes/service-tracking.routes');
const serviceWorkRoutes = require('../features/service/routes/service-work.routes');

// ============================================================================
// Booking Routes
// ============================================================================
const bookingRequestRoutes = require('../features/booking/routes/booking-request.routes');
const bookingStatusRoutes = require('../features/booking/routes/booking-status.routes');
const bookingDetailsRoutes = require('../features/booking/routes/booking-details.routes');

// ============================================================================
// Payment Routes
// ============================================================================
const paymentRoutes = require('../features/payment/routes/payment.routes');

// ============================================================================
// Tracking Routes
// ============================================================================
const trackingRoutes = require('../features/tracking/routes/tracking.routes');

// ============================================================================
// Messaging Routes
// ============================================================================
const messagingChatRoutes = require('../features/messaging/routes/messaging-chat.routes');
const messagingCallRoutes = require('../features/messaging/routes/messaging-call.routes');

// ============================================================================
// Admin Routes
// ============================================================================
const adminRoutes = require('../features/admin/routes/admin.routes');

// ============================================================================
// Mount All Routes
// ============================================================================
// All routes are mounted at root (/) since they already include their path prefixes

// Authentication
router.use('/', authRoutes);

// User Routes
router.use('/', userProfileRoutes);
router.use('/', userBookingRoutes);
router.use('/', userLocationRoutes);
router.use('/', userActionRoutes);
router.use('/', userOfferRoutes);
router.use('/', userNotificationRoutes);

// Worker Routes
router.use('/', workerProfileRoutes);
router.use('/', workerOnboardingRoutes);
router.use('/', workerBookingRoutes);
router.use('/', workerLocationRoutes);
router.use('/', workerFinancialRoutes);
router.use('/', workerNotificationRoutes);
router.use('/', workerActionRoutes);

// Service Routes
router.use('/', serviceCatalogRoutes);
router.use('/', serviceTrackingRoutes);
router.use('/', serviceWorkRoutes);

// Booking Routes
router.use('/', bookingRequestRoutes);
router.use('/', bookingStatusRoutes);
router.use('/', bookingDetailsRoutes);

// Payment Routes
router.use('/', paymentRoutes);

// Tracking Routes
router.use('/', trackingRoutes);

// Messaging Routes
router.use('/', messagingChatRoutes);
router.use('/', messagingCallRoutes);

// Admin Routes
router.use('/', adminRoutes);

// ============================================================================
// Health Check Route
// ============================================================================
router.get('/', (req, res) => {
  res.status(200).json("working");
});

module.exports = router;
