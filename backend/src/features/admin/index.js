/**
 * Admin Feature Module
 *
 * This module exports all admin-related controllers providing a unified interface
 * for admin authentication, dashboard, worker approval, and general admin operations.
 *
 * Sub-modules:
 * - admin-auth.controller: Admin login and authentication
 * - admin-dashboard.controller: Dashboard details and statistics
 * - admin-worker-approval.controller: Worker approval processes
 * - admin.controller: General admin operations (full functionality)
 */

// Import all admin controllers from controllers/index
const adminControllers = require('./controllers/index');

// Export all controller functions
module.exports = adminControllers;
