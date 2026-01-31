const client = require("../../../database/connection");
const bookingQueries = require("../../../database/queries/booking.queries.js");
const {
  getBookingByIdQuery,
  createBookingQuery,
  updateBookingStatusQuery,
  getBookingsByUserQuery,
  getBookingsByWorkerQuery,
  getActiveBookingsQuery,
  updateBookingActualAmountQuery,
  getBookingsByStatusQuery,
  cancelBookingQuery,
  getBookingCountByStatusQuery,
} = require("../../../database/queries/booking.queries.js");

// Status Checking Functions

const checkStatus = async (req, res) => {
  const { user_notification_id } = req.query;

  try {
    const result = await client.query(
      bookingQueries.checkNotificationExistsQuery,
      [user_notification_id]
    );

    if (result.rows.length > 0) {
      // user_notification_id exists in the notifications table
      res.sendStatus(200);
    } else {
      // user_notification_id does not exist in the notifications table
      res.sendStatus(201);
    }
  } catch (error) {
    console.error("Error checking notification:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const checkTaskStatus = async (req, res) => {
  const { notification_id } = req.body;

  try {
    // Directly check the result in the if condition to reduce extra variables
    const result = await client.query(
      bookingQueries.getServiceCallEndTimeQuery,
      [notification_id]
    );

    if (result.rows.length === 0) {
      // Return early if no notification is found
      return res.status(205).json({ message: "Notification not found" });
    }

    const end_time = result.rows[0].end_time;

    if (end_time) {
      // Return status if end_time is found
      return res.status(200).json({ status: end_time });
    }

    // If end_time is null, return a notification not found response
    return res.status(205).json({ message: "Notification not found" });
  } catch (error) {
    console.error("Error checking status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const checkCancellationStatus = async (req, res) => {
  try {
    const { notification_id } = req.query;
    const result = await client.query(
      bookingQueries.getNavigationStatusQuery,
      [notification_id]
    );
    if (result.rows.length > 0) {
      const { navigation_status } = result.rows[0];
      res.json({ navigation_status });
    } else {
      res.status(404).json({ error: "Notification not found" });
    }
  } catch (error) {
    console.error("Error checking cancellation status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  checkStatus,
  checkTaskStatus,
  checkCancellationStatus,
};
