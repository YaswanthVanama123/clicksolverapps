const admin = require("../../../config/firebase.config.js");
const client = require("../../../database/connection");
const {
  generateToken,
  generateWorkerToken,
  generateAdminToken,
} = require("../../../utils/token.util.js");
const authQueries = require("../../../database/queries/auth.queries");

// Lazy-load to avoid circular dependency
let sendLogoutNotificationAndDeleteTokens;
const getSessionController = () => {
  if (!sendLogoutNotificationAndDeleteTokens) {
    const sessionController = require("./auth-session.controller.js");
    sendLogoutNotificationAndDeleteTokens = sessionController.sendLogoutNotificationAndDeleteTokens;
  }
  return sendLogoutNotificationAndDeleteTokens;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getUserByPhoneNumber = async (phone_number) => {
  try {
    const result = await client.query(authQueries.GET_USER_BY_PHONE_NUMBER, [phone_number]);

    return result.rows.length ? result.rows[0] : null;
  } catch (error) {
    console.error("Error fetching user by phone number:", error);
    throw new Error("Database query failed");
  }
};

// ============================================================================
// LOGIN FUNCTIONS
// ============================================================================

const Partnerlogin = async (req, res) => {
  const { phone_number } = req.body;
  if (!phone_number) {
    return res.status(400).json({ message: "Phone number is required" });
  } else if (phone_number === "my name is veerappa") {
    return res.status(202).json({ message: "Internal server error" });
  }

  try {
    // Query to check for worker existence in verified and non-verified tables
    const result = await client.query(authQueries.CHECK_WORKER_LOGIN_STATUS, [phone_number]);
    const statusCode = result.rows[0].status_code;
    const workerId = result.rows[0].worker_id;
    const stepsCompleted =
      result.rows[0].step1 && result.rows[0].step2 && result.rows[0].step3;

    if (workerId) {
      // Generate a new session token for the worker
      const token = generateWorkerToken({ worker_id: workerId });

      // Update the session token in the database
      await client.query(authQueries.UPDATE_WORKER_SESSION_TOKEN, [token, workerId]);

      // Optionally, send a logout notification and remove any existing FCM tokens
      await getSessionController()(workerId);

      if (statusCode === 200) {
        res.cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "Strict",
        });
        return res.status(200).json({ token, workerId });
      } else if (statusCode === 201) {
        res.cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "Strict",
        });
        return res.status(201).json({
          message: "Phone number found in workers, please complete sign up",
          token,
          workerId,
          stepsCompleted,
        });
      }
    } else {
      return res
        .status(203)
        .json({ message: "Phone number not registered", phone_number });
    }
  } catch (error) {
    console.error("Error logging in worker:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const adminLogin = async (req, res) => {
  const { phone_number } = req.query;

  if (!phone_number) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  if (phone_number === "9392365494") {
    // Generate admin token
    const token = generateAdminToken();

    // Send the token in the response
    return res.status(200).json({ token });
  } else {
    return res.status(205).json({ message: "Invalid credentials" });
  }
};

const login = async (req, res) => {
  const { phone_number } = req.body;
  console.log("phonenumber", phone_number);
  if (!phone_number) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  try {
    // Find the user by phone number
    const user = await getUserByPhoneNumber(phone_number);
    console.log("user there are not ", user);
    if (user) {
      // Generate a token for the user
      const token = generateToken(user);
      // Set token as an HTTP-only cookie (for web) or return it in the JSON response
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
      });
      return res.status(200).json({ token });
    } else {
      console.log("user there are not there 205");
      // Use status 205 (or an alternative status) to indicate that the user does not exist
      return res.status(205).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const workerAuthentication = async (req, res) => {
  const workerId = req.worker.id;
  try {
    if (workerId) {
      return res.status(200).json({ success: true });
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Worker not authenticated" });
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  Partnerlogin,
  adminLogin,
  login,
  workerAuthentication,
};
