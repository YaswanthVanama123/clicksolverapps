const axios = require("axios");
const client = require("../../../connection.js");

const storeUserLocation = async (req, res) => {
  let { longitude, latitude } = req.body;

  const userId = req.user.id;

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

const getUserAddressDetails = async (req, res) => {
  const { notification_id } = req.query;

  try {
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

    const result = await client.query(query, [notification_id]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Notification or user address details not found" });
    }

    const {
      city,
      area,
      pincode,
      alternate_phone_number,
      alternate_name,
      service_booked,
    } = result.rows[0];

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

const UserPhoneCall = async (req, res) => {
  try {
    const { decodedId } = req.body;

    if (!decodedId || typeof decodedId !== "string") {
      return res.status(400).json({ message: "Valid decodedId is required." });
    }

    const query = `
      SELECT
        u.phone_number AS mobile_number,
        w.phone_number AS from_number
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

    if (typeof from_number !== "string" || typeof mobile_number !== "string") {
      return res.status(500).json({ message: "Invalid phone number format." });
    }

    console.log(
      "From Number:",
      from_number,
      "User's Mobile Number:",
      mobile_number
    );

    const apiResponse = await axios.post(
      "https://apiv1.cloudshope.com/api/outboundCall",
      { from_number, mobile_number },
      {
        headers: {
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEwMzgzLCJ1c2VybmFtZSI6Illhc2h3YW50NjU0OTQiLCJtYWluX3VzZXIiOjEwMzgzLCJpYXQiOjE3Mzk3NzIzOTB9.HKURS7DdnYsizBBDgeTn6E5JpkKk1C8qkuRDL3l3qDE`,
        },
      }
    );

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

const userTrackingCall = async (req, res) => {
  try {
    const { tracking_id } = req.body;

    if (!tracking_id) {
      return res
        .status(400)
        .json({ message: "Valid tracking_id is required." });
    }

    const query = `
      SELECT
        u.phone_number AS mobile_number,
        w.phone_number AS from_number
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

    if (typeof from_number !== "string" || typeof mobile_number !== "string") {
      return res.status(500).json({ message: "Invalid phone number format." });
    }

    console.log(
      "From Number:",
      from_number,
      "User's Mobile Number:",
      mobile_number
    );

    const apiResponse = await axios.post(
      "https://apiv1.cloudshope.com/api/outboundCall",
      { from_number, mobile_number },
      {
        headers: {
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEwMzgzLCJ1c2VybmFtZSI6Illhc2h3YW50NjU0OTQiLCJtYWluX3VzZXIiOjEwMzgzLCJpYXQiOjE3Mzk3NzIzOTB9.HKURS7DdnYsizBBDgeTn6E5JpkKk1C8qkuRDL3l3qDE`,
        },
      }
    );

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

const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

module.exports = {
  storeUserLocation,
  getUserAddressDetails,
  UserPhoneCall,
  userTrackingCall,
  userUpdateLastLogin,
};
