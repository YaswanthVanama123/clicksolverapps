const client = require("../../../database/connection");
const {
  user: userQueries,
  booking: bookingQueries,
} = require("../../../database/queries");

const getUserBookings = async (req, res) => {
  const userId = req.user.id;

  try {
    const { rows } = await client.query(userQueries.getUserBookingsQuery, [
      userId,
    ]);

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
    const { rows } = await client.query(userQueries.getUserAllBookingsQuery, [
      userId,
    ]);

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
    const { rows } = await client.query(
      userQueries.getUserOngoingBookingsQuery,
      [userId]
    );
    console.log("=roes ", rows[0]);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching user bookings" });
  }
};

module.exports = {
  getUserBookings,
  getUserAllBookings,
  getUserOngoingBookings,
};
