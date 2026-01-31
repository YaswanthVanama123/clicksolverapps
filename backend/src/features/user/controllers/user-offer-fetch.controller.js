const client = require("../../../database/connection");
const { user: userQueries } = require("../../../database/queries");

const fetchOffers = async (req, res) => {
  try {
    const user_id = req.user.id;
    const role = req.user && req.user.role ? req.user.role : "user";

    const result = await client.query(userQueries.fetchOffersQuery, [
      user_id,
      role,
    ]);
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

const getSpecialOffers = async (req, res) => {
  try {
    const result = await client.query(userQueries.getSpecialOffersQuery);

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

module.exports = {
  fetchOffers,
  getSpecialOffers,
};
