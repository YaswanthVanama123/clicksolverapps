/**
 * Admin Controllers Index
 *
 * This module exports all admin-related controllers providing a unified interface
 * for admin authentication, dashboard, worker approval, notifications, and general admin operations.
 *
 * Sub-modules:
 * - admin-auth.controller: Admin login and authentication
 * - admin-dashboard.controller: Dashboard details and statistics
 * - admin-worker-approval.controller: Worker approval processes
 * - admin-notifications.controller: Worker notification management
 * - admin.controller: General admin operations (full functionality)
 */

// Import all admin controllers
const adminAuthController = require('./admin-auth.controller');
const adminDashboardController = require('./admin-dashboard.controller');
const adminWorkerApprovalController = require('./admin-worker-approval.controller');
const adminNotificationsController = require('./admin-notifications.controller');
const adminController = require('./admin.controller');

// Export all functions from all controllers
module.exports = {
  // Admin Authentication (admin-auth.controller)
  ...adminAuthController,

  // Admin Dashboard (admin-dashboard.controller)
  ...adminDashboardController,

  // Admin Worker Approval (admin-worker-approval.controller)
  ...adminWorkerApprovalController,

  // Admin Notifications (admin-notifications.controller)
  ...adminNotificationsController,

  // General Admin Operations (admin.controller)
  ...adminController,
};
