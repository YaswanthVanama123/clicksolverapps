const crypto = require("crypto");
const axios = require("axios");
const { getMessaging } = require("firebase-admin/messaging");
const client = require("../../../connection.js");
const { generateToken } = require("../../utils/generateToken.js");

const userTrackingCall = async (req, res) => {
  try {
    const { tracking_id } = req.body;

    if (!tracking_id) {
      return res
        .status(400)
        .json({ message: "Valid tracking_id is required." });
    }

    // Fetch `from_number` from servicetracking table by joining with user and workersverified tables
    const query = `
      SELECT
        u.phone_number AS mobile_number,  -- User's phone number
        w.phone_number AS from_number    -- Worker's phone number
      FROM servicetracking s
      JOIN "user" u ON s.user_id = u.user_id
      JOIN workersverified w ON s.worker_id = w.worker_id
      WHERE s.tracking_id = $1
    `;

    const values = [tracking_id];
    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No matching data found." });
    }

    const { from_number, mobile_number } = result.rows[0];

    // Ensure these are valid strings
    if (typeof from_number !== "string" || typeof mobile_number !== "string") {
      return res.status(500).json({ message: "Invalid phone number format." });
    }

    console.log(
      "From Number:",
      from_number,
      "User's Mobile Number:",
      mobile_number
    );

    // Call the external API
    const apiResponse = await axios.post(
      "https://apiv1.cloudshope.com/api/outboundCall",
      { from_number, mobile_number },
      {
        headers: {
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEwMzgzLCJ1c2VybmFtZSI6Illhc2h3YW50NjU0OTQiLCJtYWluX3VzZXIiOjEwMzgzLCJpYXQiOjE3Mzk3NzIzOTB9.HKURS7DdnYsizBBDgeTn6E5JpkKk1C8qkuRDL3l3qDE`,
        },
      }
    );

    // Extract mobile from response, fallback to user's number if missing
    const responseData = apiResponse.data?.data?.mobile || mobile_number;

    console.log("Final Number (Masked or User's):", responseData);

    res.status(200).json({
      message: "Call initiated successfully.",
      mobile: responseData,
    });
  } catch (error) {
    console.error("Error initiating call:", error.message);

    res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};

const UserPhoneCall = async (req, res) => {
  try {
    const { decodedId } = req.body;

    if (!decodedId || typeof decodedId !== "string") {
      return res.status(400).json({ message: "Valid decodedId is required." });
    }

    // Fetch `from_number` from accepted table by joining with user and workersverified tables
    const query = `
      SELECT
        u.phone_number AS mobile_number,  -- User's phone number
        w.phone_number AS from_number    -- Worker's phone number
      FROM accepted a
      JOIN "user" u ON a.user_id = u.user_id
      JOIN workersverified w ON a.worker_id = w.worker_id
      WHERE a.notification_id = $1
    `;

    const values = [decodedId];
    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No matching data found." });
    }

    const { from_number, mobile_number } = result.rows[0];

    // Ensure these are valid strings
    if (typeof from_number !== "string" || typeof mobile_number !== "string") {
      return res.status(500).json({ message: "Invalid phone number format." });
    }

    console.log(
      "From Number:",
      from_number,
      "User's Mobile Number:",
      mobile_number
    );

    // Call the external API
    const apiResponse = await axios.post(
      "https://apiv1.cloudshope.com/api/outboundCall",
      { from_number, mobile_number },
      {
        headers: {
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEwMzgzLCJ1c2VybmFtZSI6Illhc2h3YW50NjU0OTQiLCJtYWluX3VzZXIiOjEwMzgzLCJpYXQiOjE3Mzk3NzIzOTB9.HKURS7DdnYsizBBDgeTn6E5JpkKk1C8qkuRDL3l3qDE`,
        },
      }
    );

    // Extract mobile from response, fallback to user's number if missing
    const responseData = apiResponse.data?.data?.mobile || mobile_number;

    console.log("Final Number (Masked or User's):", responseData);

    res.status(200).json({
      message: "Call initiated successfully.",
      mobile: responseData,
    });
  } catch (error) {
    console.error("Error initiating call:", error.message);

    res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};

const accountDetailsUpdate = async (req, res) => {
  const userId = req.user.id; // Get user ID from the request
  const { name, email, phone } = req.body; // Get name, email, phone from the request body
  // console.log(userId,name,email,phone)
  try {
    // SQL query to update user details
    const query = `
      UPDATE "user"
      SET name = $1,
          email = $2,
          phone_number = $3
      WHERE user_id = $4
    `;

    // Execute the query and get the result
    const result = await client.query(query, [name, email, phone, userId]);

    // Check if any row was updated
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
    // Start a transaction
    await client.query("BEGIN");

    // Insert the new user and get the new user_id
    const result = await client.query(
      `
      WITH referrer AS (
        SELECT user_id FROM "user" WHERE referral_code = $1
      ), new_user AS (
        INSERT INTO "user" (name, email, phone_number, referred_by)
        VALUES ($2, $3, $4, (SELECT user_id FROM referrer))
        RETURNING user_id
      ), referral_insert AS (
        INSERT INTO referrals (referrer_user_id, referred_user_id)
        SELECT referrer.user_id, new_user.user_id
        FROM referrer, new_user
        WHERE referrer.user_id IS NOT NULL
        RETURNING referrer_user_id
      )
      SELECT new_user.user_id AS user_id FROM new_user;
      `,
      [referralCode, fullName, email, phoneNumber]
    );

    // Extract the new user_id
    const newUserId = result.rows[0].user_id;

    // Generate a unique referral code for the new user
    const newReferralCode = `CS${newUserId}${crypto
      .randomBytes(2)
      .toString("hex")
      .toUpperCase()}`;

    // Update the user's referral code
    await client.query(
      'UPDATE "user" SET referral_code = $1 WHERE user_id = $2',
      [newReferralCode, newUserId]
    );

    // Commit the transaction
    await client.query("COMMIT");

    // <-- Change: pass user_id property instead of id
    const token = generateToken({ user_id: newUserId, fullName, email });

    // Set the token as an HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    // Return the response
    return res.status(201).json({
      message: "User registered successfully",
      token,
      referralCode: newReferralCode,
    });
  } catch (error) {
    // Rollback the transaction on error
    await client.query("ROLLBACK");
    console.error("Error in userCompleteSignUp:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const userProfileDetails = async (req, res) => {
  const userId = req.user.id;
  // console.log(userId);

  try {
    const query = `
      SELECT name, email, phone_number, profile
      FROM "user"
      WHERE user_id = $1;  -- Use $1 as a placeholder for the userId
    `;

    // Execute the query with the userId as a parameter
    const result = await client.query(query, [userId]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No worker details found for the provided user ID." });
    }

    const { name, email, phone_number, profile } = result.rows[0];

    // Return the result
    return res.json({ name, email, phone_number, profile });
  } catch (error) {
    console.error("Error fetching worker details:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching worker details." });
  }
};

const registerUser = async (req, res) => {
  const { name, email, phoneNumber, referralCode } = req.body;

  try {
    // Step 1: Combine all related operations in a single transaction
    const result = await client.query(
      `
      WITH referrer AS (
        SELECT id FROM users WHERE referral_code = $1
      ), new_user AS (
        INSERT INTO users (name, email, phone_number)
        VALUES ($2, $3, $4)
        RETURNING id
      ), insert_referral AS (
        INSERT INTO referrals (referrer_user_id, referred_user_id)
        SELECT referrer.id, new_user.id
        FROM referrer, new_user
        WHERE referrer.id IS NOT NULL
        RETURNING referrer_user_id
      )
      INSERT INTO referral_rewards (user_id, reward_amount, reward_type, status)
      SELECT referrer_user_id, 100, 'cashback', 'earned'
      FROM insert_referral
      RETURNING (SELECT new_user.id FROM new_user) AS user_id;
      `,
      [referralCode, name, email, phoneNumber]
    );

    // Step 2: Generate a unique referral code for the new user
    const newUserId = result.rows[0].user_id;
    const newReferralCode = `CS${newUserId}${crypto
      .randomBytes(2)
      .toString("hex")
      .toUpperCase()}`;

    // Step 3: Update the user's referral code in the database
    await client.query("UPDATE users SET referral_code = $1 WHERE id = $2", [
      newReferralCode,
      newUserId,
    ]);

    // Step 4: Send a success response
    res.status(201).json({
      message: "User registered successfully",
      referralCode: newReferralCode,
    });
  } catch (error) {
    console.error("Error during user registration:", error);
    res.status(500).json({ message: "An error occurred during registration" });
  }
};

const getUserBookings = async (req, res) => {
  const userId = req.user.id;

  try {
    const query = `
    SELECT
        u.user_notification_id,
        u.created_at,
        u.service,
        n.notification_id,
        s.payment,
        w.name AS provider,
        ws.profile AS worker_profile
    FROM usernotifications u
    JOIN notifications n ON u.user_notification_id = n.user_notification_id
    JOIN servicecall s ON n.notification_id = s.notification_id
    JOIN workersverified w ON s.worker_id = w.worker_id
    JOIN workerskills ws ON w.worker_id = ws.worker_id
    WHERE u.user_id = $1
    ORDER BY u.created_at DESC
`;

    const { rows } = await client.query(query, [userId]);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching user bookings" });
  }
};

const getUserAllBookings = async (req, res) => {
  const userId = req.user.id;

  try {
    const query = `
    SELECT
        n.notification_id,
        n.service_booked,
        n.created_at,
        n.complete_status,
        n.total_cost,
        w.name AS provider
    FROM completenotifications n
    JOIN "user" w ON n.user_id = w.user_id
    WHERE n.user_id = $1
    ORDER BY n.created_at DESC
    `;

    const { rows } = await client.query(query, [userId]);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching user bookings" });
  }
};

const getUserOngoingBookings = async (req, res) => {
  const userId = req.user.id;

  try {
    const query = `
    SELECT
        n.notification_id,
        n.service_booked,
        n.created_at,
        n.total_cost,
        w.name AS provider
    FROM accepted n
    JOIN "user" w ON n.user_id = w.user_id
    WHERE n.user_id = $1
    ORDER BY n.created_at DESC
    `;

    const { rows } = await client.query(query, [userId]);
    console.log("=roes ", rows[0]);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching user bookings" });
  }
};

const getUserById = async (req, res) => {
  const id = req.user.id;
  try {
    const result = await client.query(
      'SELECT phone_number,name FROM "user" WHERE user_id = $1',
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error fetching user with ID ${id}:`, err);
    throw err;
  }
};

const getUserNotifications = async (req, res) => {
  const userId = req.user.id;
  const fcmToken = req.query.fcmToken; // Access fcmToken from query parameters

  try {
    const result = await client.query(
      `
      SELECT title, body, encodedId, data, receivedat
      FROM userrecievednotifications
      WHERE user_id = $1 AND fcm_token = $2
      ORDER BY receivedat DESC
      LIMIT 10;
    `,
      [userId, fcmToken]
    ); // Pass fcmToken as the second parameter

    const notifications = result.rows;
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

const storeUserNotification = async (req, res) => {
  const userId = req.user.id;
  const { fcmToken, notification } = req.body;
  const { title, body, data, receivedAt, userNotificationId } = notification;
  try {
    const result = await client.query(
      "INSERT INTO userrecievednotifications (title, body, data, receivedat, user_id, encodedid, fcm_token) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [
        title,
        body,
        JSON.stringify(data),
        receivedAt,
        userId,
        userNotificationId,
        fcmToken,
      ]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error storing notification:", err);
    res.status(500).send("Error storing notification");
  }
};

const createUserAction = async (req, res) => {
  const userId = req.user.id; // Assuming req.user contains the authenticated user's information
  const {
    encodedId,
    screen,
    serviceBooked,
    area,
    city,
    alternateName,
    alternatePhoneNumber,
    pincode,
    location,
    discount,
    tipAmount,
    offer,
  } = req.body;

  // console.log("User action creation initiated", req.body);
  // console.log("Location is came or not", location);

  try {
    // Define the SQL query to get the existing user action
    const query = `
      SELECT * FROM useraction
      WHERE user_id = $1;
    `;

    // Execute the query to get the existing user action
    const result = await client.query(query, [userId]);
    const existingUserAction = result.rows[0];

    // Determine whether the additional fields are present
    const hasAdditionalFields =
      area || city || alternateName || alternatePhoneNumber || pincode;

    if (existingUserAction) {
      // If the user action exists, update the track array
      let updatedTrack = existingUserAction.track;

      if (screen === "") {
        // Remove the object with the matching encodedId if screen is empty
        updatedTrack = updatedTrack.filter(
          (item) => item.encodedId !== encodedId
        );
      } else {
        // Update or add the object with the new screen, encodedId, and additional fields
        updatedTrack = updatedTrack.filter(
          (item) => item.encodedId !== encodedId
        );

        const newAction = {
          screen,
          encodedId,
          serviceBooked,
        };
        // If additional fields are present, include them in the update
        if (hasAdditionalFields) {
          newAction.area = area;
          newAction.city = city;
          newAction.alternateName = alternateName;
          newAction.alternatePhoneNumber = alternatePhoneNumber;
          newAction.pincode = pincode;
          newAction.location = location;
          newAction.discount = discount;
          newAction.tipAmount = tipAmount;
          newAction.offer = offer;
        }
        // console.log("new action anta ", newAction);
        // console.log("new action anta ra location undha", newAction.location);

        updatedTrack.push(newAction);
      }

      // Update the user action with the new track array
      const updateQuery = `
        UPDATE useraction
        SET track = $1
        WHERE user_id = $2
        RETURNING *;
      `;
      const updateResult = await client.query(updateQuery, [
        JSON.stringify(updatedTrack),
        userId,
      ]);
      const updatedTrackScreen = updateResult.rows[0];

      // Respond with the updated user action data
      res.json(updatedTrackScreen);
    } else {
      // If the user action does not exist, create a new one
      let newTrack = [];

      if (screen) {
        const newAction = {
          screen,
          encodedId,
          serviceBooked,
        };

        // Include additional fields if they are present
        if (hasAdditionalFields) {
          newAction.area = area;
          newAction.city = city;
          newAction.alternateName = alternateName;
          newAction.alternatePhoneNumber = alternatePhoneNumber;
          newAction.pincode = pincode;
          newAction.location = location;
          newAction.discount = discount;
          newAction.tipAmount = tipAmount;
          newAction.offer = offer;
        }

        newTrack = [newAction];
      }

      const insertQuery = `
        INSERT INTO useraction (user_id, track)
        VALUES ($1, $2)
        RETURNING *;
      `;
      const insertResult = await client.query(insertQuery, [
        userId,
        JSON.stringify(newTrack),
      ]);
      const updatedTrackScreen = insertResult.rows[0];

      // Respond with the new user action data
      res.json(updatedTrackScreen);
    }
  } catch (error) {
    console.error("Error inserting or updating user action:", error);
    res
      .status(500)
      .json({ message: "Error inserting or updating user action" });
  }
};

const userActionRemove = async (req, res) => {
  const userId = req.user.id; // Assuming req.user contains the authenticated user's information
  const { screen, encodedId, offer } = req.body;

  console.log("offer applied", offer);

  // console.log("Removing user action");

  try {
    if (offer) {
      const offerCodeValue = offer.offer_code;
      console.log("offers applied changes", offerCodeValue);
      const queryText = `
        UPDATE "user" AS u
        SET offers_used = (
          SELECT jsonb_agg(
            CASE
              WHEN elem->>'offer_code' = $1
                THEN elem || '{"status":"pending"}'
              ELSE elem
            END
          )
          FROM jsonb_array_elements(u.offers_used) elem
        )
        WHERE u.user_id = $2
      `;

      const values = [offerCodeValue, userId];

      await client.query(queryText, values);
    }

    // Step 1: Get the track field directly (no need to select the entire row)
    const query = `
      SELECT track FROM useraction
      WHERE user_id = $1;
    `;

    // Execute the query to get the current user's track data
    const result = await client.query(query, [userId]);
    const existingTrack = result.rows[0]?.track;

    if (!existingTrack) {
      return res.status(404).json({ message: "User action not found" });
    }

    // Step 2: Filter out the object with the matching encodedId
    const updatedTrack = existingTrack.filter(
      (item) => item.encodedId !== encodedId
    );

    if (updatedTrack.length === existingTrack.length) {
      return res.status(404).json({ message: "No matching encodedId found" });
    }

    // Step 3: Update the track array in the database
    const updateQuery = `
      UPDATE useraction
      SET track = $1
      WHERE user_id = $2
      RETURNING *;
    `;
    const updateResult = await client.query(updateQuery, [
      JSON.stringify(updatedTrack),
      userId,
    ]);

    // Step 4: Respond with the updated user action
    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error("Error removing user action:", error);
    res.status(500).json({ message: "Error removing user action" });
  }
};

const getUserTrackRoute = async (req, res) => {
  const id = req.user.id;
  try {
    // Query using a JOIN to fetch the user's name and track in one go
    const query = `
      SELECT u.name, u.profile, ua.track
      FROM "user" u
      LEFT JOIN useraction ua ON u.user_id = ua.user_id
      WHERE u.user_id = $1;
    `;

    const result = await client.query(query, [id]);

    if (result.rows.length > 0) {
      const { name, track, profile } = result.rows[0];

      if (track) {
        // If track exists, return both the track and user name
        res.status(200).json({ track, user: name, profile });
      } else {
        // If no track, return only the user name
        res.status(203).json({ user: name, profile });
      }
    } else {
      // If no user found, return a 404 error
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    console.error(`Error fetching user with ID ${id}:`, err);
    res.status(500).json({ message: "Error fetching user data" });
  }
};

const storeUserFcmToken = async (req, res) => {
  const { fcmToken } = req.body;
  const userId = req.user.id;

  try {
    // Single query using CTE:
    // 1) Delete any row with the same fcm_token (to avoid duplicates across users)
    // 2) Insert new row with (user_id, fcm_token).
    // 3) ON CONFLICT DO NOTHING if the same row (user_id + fcm_token) already exists.
    // 4) Return the newly inserted row (if any).
    const upsertQuery = `
      WITH delete_matched AS (
        DELETE FROM userfcm
        WHERE fcm_token = $2
      )
      INSERT INTO userfcm (user_id, fcm_token)
      VALUES ($1, $2)
      ON CONFLICT (user_id, fcm_token)
      DO NOTHING
      RETURNING user_id, fcm_token;
    `;

    const result = await client.query(upsertQuery, [userId, fcmToken]);

    if (result.rowCount > 0) {
      // Successfully inserted a new row
      return res.status(200).json({ message: "FCM token stored successfully" });
    } else {
      // The row already existed for this user, or ON CONFLICT prevented insert
      return res
        .status(200)
        .json({ message: "FCM token already exists for this user" });
    }
  } catch (error) {
    console.error("Error storing FCM token:", error);
    return res.status(500).json({ error: "Failed to store FCM token" });
  }
};

const userCoupons = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await client.query(
      `
      SELECT
        u.service_completed,
        COALESCE(rr.coupons, NULL) AS coupons
      FROM
        public."user" u  -- "user" is a reserved keyword, so it's wrapped in double quotes
      LEFT JOIN
        referral_rewards rr
      ON
        u."referral_Code" = rr.referral_code  -- Corrected column reference
      WHERE
        u.user_id = $1
      `,
      [userId]
    );

    if (result.rows.length > 0) {
      const { service_completed, coupons } = result.rows[0];
      res.json({ service_completed, coupons: coupons || null });
    } else {
      res.status(404).json({ message: "User not found or no data available" });
    }
  } catch (error) {
    console.error("Error fetching user coupons:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const userProfileUpdate = async (req, res) => {
  const user_id = req.user.id;
  const { profileImage } = req.body;

  // Check if both parameters are provided
  if (!user_id || !profileImage) {
    return res
      .status(400)
      .json({ error: "user_id and profileImage are required." });
  }

  try {
    // Update the user's profile image
    const query = `
            UPDATE "user"
            SET profile = $1
            WHERE user_id = $2
            RETURNING *;
        `;

    const values = [profileImage, user_id];

    const result = await client.query(query, values);

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

const userCancellationStatus = async (req, res) => {
  const { notification_id } = req.query;

  if (!notification_id) {
    return res.status(400).json({ error: "Notification ID is required" });
  }

  try {
    // Using SELECT 1 to only check if a row exists without retrieving unnecessary data
    const result = await client.query(
      "SELECT 1 FROM accepted WHERE notification_id = $1",
      [notification_id]
    );

    if (result.rows.length > 0) {
      // If the row is present, return HTTP 200
      return res.status(200).json({ message: "Row found" });
    } else {
      // If no row is found, return HTTP 205 with a cancellation message
      return res.status(205).json({ message: "User cancelled" });
    }
  } catch (error) {
    console.error("Error checking cancellation status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getUserAddressDetails = async (req, res) => {
  const { notification_id } = req.query;

  try {
    // Query to fetch user address details by joining Notifications and UserNotifications tables
    const query = `
      SELECT
        N.messages,
        UN.city,
        UN.area,
        UN.pincode,
        UN.alternate_phone_number,
        UN.alternate_name,
        UN.service_booked,
        U.name,
        U.profile
      FROM accepted N
      JOIN UserNotifications UN ON N.user_notification_id = UN.user_notification_id
      JOIN "user" U ON UN.user_id = U.user_id
      WHERE N.notification_id = $1
    `;

    // Execute the JOIN query
    const result = await client.query(query, [notification_id]);

    // Check if data was found
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Notification or user address details not found" });
    }

    // Destructure and return the address details
    const {
      city,
      area,
      pincode,
      alternate_phone_number,
      alternate_name,
      service_booked,
    } = result.rows[0];
    // console.log(result.rows[0])

    res.json({
      city,
      area,
      pincode,
      alternate_phone_number,
      alternate_name,
      service_booked,
      messages: result.rows[0].messages,
      name: result.rows[0].name,
      profile: result.rows[0].profile,
    });
  } catch (error) {
    console.error("Error fetching user address details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const userNavigationCancel = async (req, res) => {
  const { notification_id, offer_code } = req.body;
  const encodedUserNotificationId = Buffer.from(
    notification_id.toString()
  ).toString("base64");

  try {
    await client.query("BEGIN");
    console.log("Transaction started for notification_id:", notification_id);

    // 1) Update 'accepted', insert into 'completenotifications', update user offers, and fetch data
    const combinedQuery = await client.query(
      `
      WITH verification AS (
        SELECT
          verification_status,
          user_id,
          worker_id,
          service_booked
        FROM accepted
        WHERE notification_id = $1
      ),
      updated AS (
        UPDATE accepted
        SET user_navigation_cancel_status = 'usercanceled'
        WHERE notification_id = $1
          AND verification_status = FALSE
        RETURNING *
      ),
      inserted AS (
        INSERT INTO completenotifications (
          accepted_id, notification_id, user_id, user_notification_id,
          longitude, latitude, created_at, worker_id, complete_status,
          service_booked, time, discount, total_cost, tip_amount
        )
        SELECT
          accepted_id, notification_id, user_id, user_notification_id,
          longitude, latitude, created_at, worker_id, 'usercanceled',
          service_booked, time, discount, total_cost, tip_amount
        FROM updated
        RETURNING user_id, service_booked, worker_id
      ),
      user_updated AS (
        UPDATE "user" u
        SET offers_used = (
          SELECT jsonb_agg(
            CASE
              WHEN elem->>'offer_code' = $2
              THEN elem || '{"status":"pending"}'
              ELSE elem
            END
          )
          FROM jsonb_array_elements(u.offers_used) AS elem
        )
        WHERE u.user_id = (SELECT user_id FROM verification)
          AND EXISTS (
            SELECT 1 FROM updated a
            WHERE a.user_id = u.user_id
              AND a.coupons_applied IS NOT NULL
              AND EXISTS (
                SELECT 1 FROM jsonb_array_elements(a.coupons_applied) ac
                WHERE ac->>'offer_code' = $2
              )
          )
        RETURNING u.user_id
      )
      SELECT
        v.verification_status AS verified,
        COALESCE(i.worker_id, v.worker_id) AS worker_id,
        v.user_id,
        v.service_booked,
        f.fcm_token
      FROM verification v
      LEFT JOIN inserted i      ON TRUE
      LEFT JOIN workersverified w ON w.worker_id = COALESCE(i.worker_id, v.worker_id)
      LEFT JOIN userfcm f       ON f.user_id   = v.user_id;
      `,
      [notification_id, offer_code]
    );

    // If no rows returned, nothing to cancel
    if (combinedQuery.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        error: "Cancellation not performed. Invalid ID or already canceled.",
      });
    }

    // 2) Delete the original 'accepted' record
    await client.query(
      `DELETE FROM accepted
         WHERE notification_id = $1
           AND verification_status = FALSE`,
      [notification_id]
    );

    await client.query("COMMIT");
    console.log(
      "Transaction committed successfully for notification_id:",
      notification_id
    );

    const { verified, worker_id, user_id, service_booked, fcm_token } =
      combinedQuery.rows[0];

    if (!verified) {
      // Send FCM notification if verification is false
      if (fcm_token) {
        const message = {
          notification: {
            title: "Booking Cancelled",
            body: `User has cancelled the booking for ${service_booked}`,
          },
          token: fcm_token,
          data: {
            notification_id: encodedUserNotificationId,
          },
        };

        try {
          await getMessaging().send(message);
          console.log("FCM notification sent successfully");
        } catch (fcmError) {
          console.error("Error sending FCM notification:", fcmError);
        }
      }

      return res.status(200).json({
        message: "Cancellation successful",
        verified: false,
      });
    }

    return res.status(200).json({
      message: "Booking verified, cannot cancel",
      verified: true,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error during cancellation:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const userCancelNavigation = async (req, res) => {
  const { notification_id } = req.body;

  if (!notification_id) {
    return res.status(400).json({ error: "Notification ID is required" });
  }

  try {
    // Update the status and check current status in a single query using RETURNING
    const query = `
      UPDATE accepted
      SET user_navigation_cancel_status = 'usercanceled'
      WHERE notification_id = $1
      AND (user_navigation_cancel_status IS NULL OR user_navigation_cancel_status != 'timeup')
      RETURNING user_navigation_cancel_status;
    `;

    const result = await client.query(query, [notification_id]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Cancellation time is up or Notification not found" });
    }

    const updatedStatus = result.rows[0].user_navigation_cancel_status;

    // Check if the status was already updated to 'timeup'
    if (updatedStatus === "timeup") {
      return res.status(404).json({ error: "Cancellation time is up" });
    }

    return res.status(200).json({ message: "Cancellation successful" });
  } catch (error) {
    console.error("Error updating cancellation status:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

const getSpecialOffers = async (req, res) => {
  try {
    const result = await client.query(`
      SELECT
        discount_percentage::INT   AS discount_percentage,
        title,
        summary,
        image,
        backgroundColor,
        description
      FROM public.offers
      WHERE summary IS NOT NULL
        AND is_active = true
      ORDER BY discount_percentage DESC
    `);

    return res.status(200).json({
      offers: result.rows,
    });
  } catch (error) {
    console.error("Error fetching special offers:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

const storeUserLocation = async (req, res) => {
  let { longitude, latitude } = req.body;

  const userId = req.user.id;
  // Log the received data

  try {
    const query = `
      INSERT INTO userLocation (longitude, latitude, user_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id)
      DO UPDATE SET longitude = EXCLUDED.longitude, latitude = EXCLUDED.latitude
    `;
    await client.query(query, [longitude, latitude, userId]);

    res.status(200).json({ message: "User location stored successfully" });
  } catch (error) {
    console.error("Error storing user location:", error);
    res.status(500).json({ error: "Failed to store user location" });
  }
};

const userUpdateLastLogin = async (req, res) => {
  const userId = req.worker.id;
  const time = getCurrentTimestamp();
  try {
    const query = {
      text: `UPDATE "user" SET last_active = $1 WHERE user_id = $2 RETURNING *`,
      values: [time, userId],
    };

    const result = await client.query(query);
    return result.rows[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const userReferrals = async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10); // Convert userId to an integer

    // Execute the query and return the result rows directly
    const result = await client.query(
      `
      SELECT
        u1.referral_code AS referralCode,
        u2.name,
        u2.service_completed
      FROM "user" u1
      LEFT JOIN "user" u2 ON u2.referred_by = u1.referral_code
      WHERE u1.user_id = $1
      `,
      [userId]
    );

    // If no rows are returned, send a 404 response
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "User not found or no referrals available" });
    }

    // Send the raw result rows directly
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching user referrals:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const fetchOffers = async (req, res) => {
  try {
    const user_id = req.user.id;
    const role = req.user && req.user.role ? req.user.role : "user";

    const query = `
      SELECT
        o.offer_code,
        o.title,
        o.description,
        o.discount_percentage,
        o.min_booking_amount,
        o.max_discount_amount,
        o.start_date,
        o.end_date,
        o.applicable_for
      FROM offers o
      LEFT JOIN (
        SELECT offers_used
        FROM "user"
        WHERE user_id = $1
      ) u ON true
      WHERE o.is_active = TRUE
        AND o.start_date <= NOW()
        AND o.end_date >= NOW()
        AND (o.applicable_for = 'both' OR o.applicable_for = $2)
        AND (
          -- For offers that contain "WELCOME" in the offer_code,
          -- check that no matching entry in offers_used has a status of "applied" or "used"
          o.offer_code NOT ILIKE '%WELCOME%' OR
          (
            NOT EXISTS (
              SELECT 1
              FROM jsonb_array_elements(u.offers_used) AS used_offer
              WHERE used_offer->>'offer_code' = o.offer_code
                AND (used_offer->>'status' = 'applied' OR used_offer->>'status' = 'used')
            )
          )
        );
    `;

    const values = [user_id, role];
    const result = await client.query(query, values);
    const offers = result.rows;

    return res.status(200).json({
      success: true,
      offers,
    });
  } catch (error) {
    console.error("Error fetching offers:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const offerValidation = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { offer_code, totalAmount } = req.body;

    if (!user_id || !offer_code || totalAmount == null) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required parameters: user_id, offer_code, or totalAmount",
      });
    }

    // 1) First check offer validity to avoid unnecessary user queries
    const offerDetailQuery = `
      SELECT discount_percentage, min_booking_amount, max_discount_amount
      FROM offers
      WHERE offer_code = $1
        AND is_active = TRUE
        AND start_date <= NOW()
        AND end_date >= NOW()
      LIMIT 1`;
    const offerResult = await client.query(offerDetailQuery, [offer_code]);

    if (offerResult.rowCount === 0) {
      return res.status(200).json({
        valid: false,
        error: "Offer not valid or expired",
        discountAmount: 0,
        newTotal: Number(totalAmount),
      });
    }

    // 2) Single user query for all subsequent checks
    const userQuery = `SELECT user_id, offers_used FROM "user" WHERE user_id = $1`;
    const userResult = await client.query(userQuery, [user_id]);

    if (userResult.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const user = userResult.rows[0];
    const offersUsed = user.offers_used || [];

    // 3) WELCOME offer specific validation
    if (offer_code.includes("WELCOME")) {
      const hasUsedWelcome = offersUsed.some(
        (item) =>
          item.offer_code === offer_code &&
          (item.status === "applied" || item.status === "used")
      );

      if (hasUsedWelcome) {
        return res.status(200).json({
          valid: false,
          error: "Offer already used",
          discountAmount: 0,
          newTotal: Number(totalAmount),
        });
      }
    }

    // 4) Single conditional update for missing offers using JSONB operations
    const offerExists = offersUsed.some(
      (item) => item.offer_code === offer_code
    );
    if (!offerExists) {
      const updateQuery = `
        UPDATE "user"
        SET offers_used = COALESCE(offers_used, '[]'::jsonb) || $1::jsonb
        WHERE user_id = $2
        AND NOT EXISTS (
          SELECT 1
          FROM jsonb_array_elements(COALESCE(offers_used, '[]'::jsonb)) AS item
          WHERE item->>'offer_code' = $3
        )`;
      await client.query(updateQuery, [
        JSON.stringify([{ offer_code, status: "pending", quantity: 0 }]),
        user_id,
        offer_code,
      ]);
    }

    // 5) Final validation and calculation
    const { discount_percentage, min_booking_amount, max_discount_amount } =
      offerResult.rows[0];

    if (Number(totalAmount) < Number(min_booking_amount)) {
      return res.status(200).json({
        valid: false,
        error: `Minimum booking amount required is ₹${min_booking_amount}`,
        discountAmount: 0,
        newTotal: Number(totalAmount),
      });
    }

    const discountCalc = Math.min(
      (Number(totalAmount) * Number(discount_percentage)) / 100,
      Number(max_discount_amount)
    );
    const newTotal = Number(totalAmount) - discountCalc;

    return res.status(200).json({
      valid: true,
      discountAmount: discountCalc,
      newTotal,
      error: null,
    });
  } catch (error) {
    console.error("Error in offer validation:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Helper function for getCurrentTimestamp (if not already available)
const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

module.exports = {
  getUserById,
  registerUser,
  userCompleteSignUp,
  userProfileDetails,
  userProfileUpdate,
  accountDetailsUpdate,
  getUserAddressDetails,
  storeUserLocation,
  getUserBookings,
  getUserAllBookings,
  getUserOngoingBookings,
  userUpdateLastLogin,
  userCoupons,
  userReferrals,
  fetchOffers,
  offerValidation,
  getSpecialOffers,
  storeUserFcmToken,
  storeUserNotification,
  getUserNotifications,
  createUserAction,
  userActionRemove,
  getUserTrackRoute,
  userCancelNavigation,
  userNavigationCancel,
  userCancellationStatus,
  UserPhoneCall,
  userTrackingCall,
};
