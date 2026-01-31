const { generateAdminToken } = require("../../../utils/generateToken.js");

/**
 * Admin Authentication Controller
 * Handles admin login and authentication
 */

/**
 * Admin login endpoint
 * Validates phone number and generates admin token
 */
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

module.exports = {
  adminLogin,
};
