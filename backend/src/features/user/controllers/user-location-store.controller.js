const client = require("../../../database/connection");
const { user: userQueries } = require("../../../database/queries");

const storeUserLocation = async (req, res) => {
  let { longitude, latitude } = req.body;

  const userId = req.user.id;

  try {
    await client.query(userQueries.storeUserLocationQuery, [
      longitude,
      latitude,
      userId,
    ]);

    res.status(200).json({ message: "User location stored successfully" });
  } catch (error) {
    console.error("Error storing user location:", error);
    res.status(500).json({ error: "Failed to store user location" });
  }
};

module.exports = {
  storeUserLocation,
};
