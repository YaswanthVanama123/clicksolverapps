// ============================================================================
// USER PROFILE ROUTES
// ============================================================================
// Routes for user profile management, registration, authentication, and feedback
// ============================================================================

const express = require('express');
const router = express.Router();
const {
  registerUser,
  userCompleteSignUp,
  userProfileDetails,
  accountDetailsUpdate,
  userProfileUpdate,
  getUserById,
  submitFeedback,
} = require('../controllers');
const { authenticateToken } = require('../../../middlewares');

// ============================================================================
// REGISTRATION ROUTES
// ============================================================================

// POST /register - Register a new user
router.post('/register', registerUser);

// POST /user/signup - Complete user signup process
router.post('/user/signup', userCompleteSignUp);

// ============================================================================
// PROFILE MANAGEMENT ROUTES
// ============================================================================

// POST /user/profile - Get user profile details
router.post('/user/profile', authenticateToken, userProfileDetails);

// POST /user/details/update - Update user account details
router.post('/user/details/update', authenticateToken, accountDetailsUpdate);

// POST /user/updateProfileImage - Update user profile image
router.post('/user/updateProfileImage', authenticateToken, userProfileUpdate);

// GET /get/user - Get user information by ID
router.get('/get/user', authenticateToken, getUserById);

// ============================================================================
// FEEDBACK ROUTES
// ============================================================================

// POST /user/feedback - Submit user feedback/rating
router.post('/user/feedback', authenticateToken, submitFeedback);

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router;
