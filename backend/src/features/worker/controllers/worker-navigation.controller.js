const client = require("../../../../connection.js");
const {
  getWorkerNavigationDetailsQuery,
} = require("../../../database/queries/worker.queries.js");

// Worker Navigation Functions

/**
 * Retrieves worker navigation details for a notification
 *
 * This function fetches comprehensive worker and service information including:
 * - Worker details (name, phone, profile)
 * - Service details (pin, service booked, area)
 * - Worker ratings and service counts
 *
 * @requires req.body.notificationId - Notification ID to fetch details for
 */
const getWorkerNavigationDetails = async (req, res) => {
  const { notificationId } = req.body;

  if (!notificationId) {
    return res.status(400).json({ error: "Notification ID is required" });
  }

  try {
    const result = await client.query(getWorkerNavigationDetailsQuery, [
      notificationId,
    ]);

    // If no results, return 404
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Notification or worker not found" });
    }

    const {
      pin,
      name,
      phone_number,
      profile,
      pincode,
      area,
      city,
      service_booked,
      average_rating,
      service_counts,
    } = result.rows[0];

    // Send the response
    return res.status(200).json({
      pin,
      name,
      phone_number,
      profile,
      pincode,
      area,
      city,
      service_booked,
      average_rating,
      service_counts,
    });
  } catch (error) {
    console.error("Error getting worker navigation details:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getWorkerNavigationDetails,
};
