const client = require("../../../database/connection");
const { user: userQueries } = require("../../../database/queries");

const getUserTrackRoute = async (req, res) => {
  const id = req.user.id;
  try {
    const result = await client.query(userQueries.getUserTrackRouteQuery, [
      id,
    ]);

    if (result.rows.length > 0) {
      const { name, track, profile } = result.rows[0];

      if (track) {
        res.status(200).json({ track, user: name, profile });
      } else {
        res.status(203).json({ user: name, profile });
      }
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    console.error(`Error fetching user with ID ${id}:`, err);
    res.status(500).json({ message: "Error fetching user data" });
  }
};

module.exports = {
  getUserTrackRoute,
};
