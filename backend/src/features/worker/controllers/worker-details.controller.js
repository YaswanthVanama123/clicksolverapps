const client = require("../../../../connection.js");
const workerQueries = require("../../../database/queries/worker.queries");

// Worker Details Query Functions
// Handles retrieval of worker information and details

/**
 * Get comprehensive worker details for a notification
 * Includes service info, cost, discount, and location
 * @route POST /api/worker/details
 */
const getWorkerDetails = async (req, res) => {
  const { notification_id } = req.body;
  try {
    const result = await client.query(workerQueries.getWorkerDetailsByNotification, [
      notification_id,
    ]);

    if (result.rows.length === 0) {
      return res.json({
        error: "No worker details found for the provided notification ID.",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching worker details:", error);
    return res.json({
      error: "An error occurred while fetching worker details.",
    });
  }
};

/**
 * Get basic worker details (name and service)
 * Used for notification-based lookups
 * @route GET /api/worker/basic-details
 */
const workerDetails = async (req, res, notification_id) => {
  try {
    // Combine queries using JOIN
    const result = await client.query(workerQueries.getBasicWorkerDetails, [
      notification_id,
    ]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Notification or related data not found" });
    }

    const { worker_name, service } = result.rows[0];

    // Return the worker's name and service
    res.json({ name: worker_name, service });
  } catch (error) {
    console.error("Error checking worker details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getWorkerDetails,
  workerDetails,
};
