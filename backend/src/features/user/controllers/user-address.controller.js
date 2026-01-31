const client = require("../../../database/connection");
const { user: userQueries } = require("../../../database/queries");

const getUserAddressDetails = async (req, res) => {
  const { notification_id } = req.query;

  try {
    const result = await client.query(
      userQueries.getUserAddressDetailsQuery,
      [notification_id]
    );

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

module.exports = {
  getUserAddressDetails,
};
