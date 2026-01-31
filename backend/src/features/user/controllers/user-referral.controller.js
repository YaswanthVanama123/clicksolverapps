const client = require("../../../database/connection");
const { user: userQueries } = require("../../../database/queries");

const userReferrals = async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);

    const result = await client.query(userQueries.getUserReferralsQuery, [
      userId,
    ]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "User not found or no referrals available" });
    }

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching user referrals:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  userReferrals,
};
