// ============================================================================
// WORKER ONBOARDING ROUTES
// ============================================================================
// This module defines all worker onboarding-related routes including:
// - Worker signup and registration
// - Service category fetching
// - Skill registration
// - Onboarding step tracking
// ============================================================================

const express = require('express');
const router = express.Router();

// Import onboarding controller functions
const {
  workerCompleteSignUp,
  registrationSubmit,
  skillWorkerRegistration,
  onboardingSteps,
  getServicesPhoneNumber,
  getServicesRegisterPhoneNumber,
} = require('../controllers/index');

// Import middleware
const { authenticateWorkerToken } = require('../../../middlewares');

// ============================================================================
// WORKER SIGNUP ROUTE
// ============================================================================
// POST /worker/signup
// Description: Complete worker signup with phone number and name
// Access: Public (no authentication required)
// Body: { fullName, email?, phoneNumber }
// Returns: { token, contact_id, message }
router.post('/signup', workerCompleteSignUp);

// ============================================================================
// STEP STATUS ROUTES
// ============================================================================

// GET /step-status
// Description: Check the current onboarding status for a worker
// Access: Private (requires worker authentication)
// Returns: { message, onboarding_status }
router.get('/step-status', authenticateWorkerToken, (req, res) => {
  // This is handled by checkOnboardingStatus controller from router
  // But the endpoint returns onboarding progress/status
  res.status(501).json({ message: 'Use checkOnboardingStatus endpoint' });
});

// ============================================================================
// SKILL REGISTRATION ROUTE
// ============================================================================

// POST /worker/skill/registration/filled
// Description: Submit filled skill registration form
// Access: Private (requires worker authentication)
// Body: { selectedService, checkedServices, profilePic, proofPic, agree }
// Returns: { message }
router.post('/skill/registration/filled', authenticateWorkerToken, skillWorkerRegistration);

// ============================================================================
// SERVICE CATEGORIES ROUTES
// ============================================================================

// GET /service/categories
// Description: Fetch service categories for authenticated worker
// Access: Private (requires worker authentication)
// Query: worker_id (from token)
// Returns: Array of service categories with phone numbers
router.get('/categories', authenticateWorkerToken, getServicesPhoneNumber);

// GET /service/categories/registration
// Description: Fetch service categories for worker registration flow
// Access: Private (requires worker authentication)
// Query: worker_id (from token)
// Returns: Array of service categories from verified workers
router.get('/categories/registration', authenticateWorkerToken, getServicesRegisterPhoneNumber);

// ============================================================================
// REGISTRATION SUBMISSION ROUTES
// ============================================================================

// POST /registration/submit
// Description: Submit complete worker registration form with personal details
// Access: Private (requires worker authentication)
// Body: {
//   profileImageUri,
//   proofImageUri,
//   skillCategory,
//   subSkills,
//   firstName,
//   lastName,
//   gender,
//   workExperience,
//   dob,
//   education,
//   doorNo,
//   landmark,
//   city,
//   district,
//   state,
//   pincode
// }
// Returns: { message }
router.post('/registration/submit', authenticateWorkerToken, registrationSubmit);

// ============================================================================
// ONBOARDING STEP STATUS ROUTE
// ============================================================================

// POST /onboarding/step-status
// Description: Check onboarding completion status (step 1-3)
// Access: Private (requires worker authentication)
// Returns: {
//   message,
//   steps: {
//     step1: boolean (workers table),
//     step2: boolean (workerskills table),
//     bankAccount: boolean (bank_accounts table),
//     upiId: boolean (upi_accounts table)
//   }
// }
router.post('/step-status', authenticateWorkerToken, onboardingSteps);

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router;
