const express = require("express");
const router = express.Router();

// Import controllers from controllers module
const {
  login,
  Partnerlogin,
  workerAuthentication,
  adminLogin,
  sendOtp,
  partnerSendOtp,
  WorkerSendOtp,
  validateOtp,
  partnerValidateOtp,
  WorkerValidateOtp,
  verifyOTP,
  workerVerifyOtp,
  sendSMSVerification,
  userLogout,
  workerLogout,
  workerTokenVerification,
  loginStatus,
  checkOnboardingStatus,
  registrationStatus,
  accountDelete,
} = require("../controllers");

// Import middlewares
const {
  authenticateToken,
  authenticateWorkerToken,
} = require("../../../middlewares");

// ============================================================================
// LOGIN ROUTES
// ============================================================================

// POST /login - User login
router.post("/login", login);

// POST /user/login - User login (alias)
router.post("/user/login", login);

// POST /worker/login - Worker/Partner login
router.post("/worker/login", Partnerlogin);

// GET /admin/login - Admin login
router.get("/admin/login", adminLogin);

// ============================================================================
// OTP ROUTES
// ============================================================================

// POST /otp/send - Send OTP to user
router.post("/otp/send", sendOtp);

// POST /partner/otp/send - Send OTP to partner
router.post("/partner/otp/send", partnerSendOtp);

// POST /partner/sendOtp - Send OTP to partner (alias)
router.post("/partner/sendOtp", partnerSendOtp);

// POST /worker/sendOtp - Send OTP to worker
router.post("/worker/sendOtp", WorkerSendOtp);

// GET /validate - Validate OTP for user
router.get("/validate", validateOtp);

// GET /partner/validateOtp - Validate OTP for partner
router.get("/partner/validateOtp", partnerValidateOtp);

// GET /worker/validateOtp - Validate OTP for worker
router.get("/worker/validateOtp", WorkerValidateOtp);

// POST /otp-verify - Verify OTP
router.post("/otp-verify", verifyOTP);

// ============================================================================
// VERIFICATION & PIN ROUTES
// ============================================================================

// POST /pin/verification - Verify PIN (OTP verification for users)
router.post("/pin/verification", authenticateToken, workerVerifyOtp);

// POST /worker/token/verification - Verify worker token
router.post(
  "/worker/token/verification",
  authenticateWorkerToken,
  workerTokenVerification
);

// ============================================================================
// SMS ROUTES
// ============================================================================

// POST /send-sms - Send SMS verification
router.post("/send-sms", sendSMSVerification);

// ============================================================================
// LOGOUT ROUTES
// ============================================================================

// POST /userLogout - User logout
router.post("/userLogout", userLogout);

// POST /workerLogout - Worker logout
router.post("/workerLogout", workerLogout);

// ============================================================================
// ACCOUNT MANAGEMENT ROUTES
// ============================================================================

// POST /user/details/delete - Delete user account
router.post("/user/details/delete", authenticateToken, accountDelete);

// ============================================================================
// TOKEN VALIDATION ROUTES
// ============================================================================

// POST /validate-token - Validate authentication token
router.post("/validate-token", authenticateToken, (req, res) => {
  res.json({ isValid: true });
});

// ============================================================================
// AUTHENTICATION & STATUS ROUTES
// ============================================================================

// POST /worker/authenticate - Authenticate worker
router.post(
  "/worker/authenticate",
  authenticateWorkerToken,
  workerAuthentication
);

// GET /step-status - Check worker onboarding step status
router.get("/step-status", authenticateWorkerToken, checkOnboardingStatus);

// POST /registration/status - Get worker registration status
router.post(
  "/registration/status",
  authenticateWorkerToken,
  registrationStatus
);

// GET /user/login/status - Get user login status
router.get("/user/login/status", authenticateToken, loginStatus);

// ============================================================================

module.exports = router;
