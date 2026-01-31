const crypto = require("crypto");
const client = require("../../../database/connection");
const { generateToken } = require("../../../utils/generateToken.js");
const { user: userQueries } = require("../../../database/queries");

const getUserById = async (req, res) => {
  const id = req.user.id;
  try {
    const result = await client.query(userQueries.getUserByIdQuery, [id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error fetching user with ID ${id}:`, err);
    throw err;
  }
};

const userProfileDetails = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await client.query(userQueries.getUserByIdQuery, [userId]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No worker details found for the provided user ID." });
    }

    const { name, email, phone_number, profile } = result.rows[0];

    return res.json({ name, email, phone_number, profile });
  } catch (error) {
    console.error("Error fetching worker details:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching worker details." });
  }
};

const userProfileUpdate = async (req, res) => {
  const user_id = req.user.id;
  const { profileImage } = req.body;

  if (!user_id || !profileImage) {
    return res
      .status(400)
      .json({ error: "user_id and profileImage are required." });
  }

  try {
    const result = await client.query(userQueries.updateUserQuery, [
      user_id,
      null,
      null,
      null,
      profileImage,
      null,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({
      message: "Profile updated successfully.",
      updatedUser: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const accountDetailsUpdate = async (req, res) => {
  const userId = req.user.id;
  const { name, email, phone } = req.body;

  try {
    const result = await client.query(userQueries.updateUserQuery, [
      userId,
      name,
      email,
      phone,
      null,
      null,
    ]);

    if (result.rowCount > 0) {
      return res
        .status(200)
        .json({ message: "Account details updated successfully" });
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error updating account details:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const userCompleteSignUp = async (req, res) => {
  const { fullName, email, phoneNumber, referralCode } = req.body;

  if (!fullName || !email || !phoneNumber) {
    return res
      .status(400)
      .json({ message: "Full name, email, and phone number are required" });
  }

  try {
    await client.query("BEGIN");

    const result = await client.query(userQueries.completeUserSignUpQuery, [
      referralCode,
      fullName,
      email,
      phoneNumber,
    ]);

    const newUserId = result.rows[0].user_id;

    const newReferralCode = `CS${newUserId}${crypto
      .randomBytes(2)
      .toString("hex")
      .toUpperCase()}`;

    await client.query(userQueries.updateUserReferralCodeQuery, [
      newReferralCode,
      newUserId,
    ]);

    await client.query("COMMIT");

    const token = generateToken({ user_id: newUserId, fullName, email });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    return res.status(201).json({
      message: "User registered successfully",
      token,
      referralCode: newReferralCode,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in userCompleteSignUp:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const registerUser = async (req, res) => {
  const { name, email, phoneNumber, referralCode } = req.body;

  try {
    const result = await client.query(
      userQueries.registerUserWithReferralQuery,
      [referralCode, name, email, phoneNumber]
    );

    const newUserId = result.rows[0].user_id;
    const newReferralCode = `CS${newUserId}${crypto
      .randomBytes(2)
      .toString("hex")
      .toUpperCase()}`;

    await client.query(userQueries.updateUserReferralCodeForNewUserQuery, [
      newReferralCode,
      newUserId,
    ]);

    res.status(201).json({
      message: "User registered successfully",
      referralCode: newReferralCode,
    });
  } catch (error) {
    console.error("Error during user registration:", error);
    res.status(500).json({ message: "An error occurred during registration" });
  }
};

module.exports = {
  getUserById,
  userProfileDetails,
  userProfileUpdate,
  accountDetailsUpdate,
  userCompleteSignUp,
  registerUser,
};
