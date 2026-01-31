const client = require("../../../database/connection");
const { user: userQueries } = require("../../../database/queries");

const userCoupons = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await client.query(userQueries.getUserCouponsQuery, [
      userId,
    ]);

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

module.exports = {
  userCoupons,
};
