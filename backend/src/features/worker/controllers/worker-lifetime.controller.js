const client = require("../../../../connection.js");
const workerQueries = require("../../../database/queries/worker.queries");

// Worker Lifetime Statistics Functions
// Handles worker lifetime earnings, service counts, and ratings

/**
 * Get worker lifetime details including earnings, service counts, ratings, and recent feedback
 * @route GET /api/worker/lifetime
 */
const workerLifeDetails = async (req, res) => {
  const workerId = req.worker.id;

  try {
    const result = await client.query(workerQueries.getWorkerLifeDetails, [workerId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Worker not found" });
    }

    const workerProfile = {
      profileDetails: result.rows,
      workerId,
    };

    // Since the average_rating is included in each row, you can take it from the first result.
    workerProfile.averageRating = result.rows[0].average_rating;

    return res.status(200).json(workerProfile);
  } catch (error) {
    console.error("Error getting worker life details:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Update worker lifetime statistics (earnings and service count)
 * Internal function called by payment processing
 * @param {string} workerId - The worker's ID
 * @param {number} totalAmount - The payment amount to add
 * @returns {Promise<Object>} Updated money_earned and service_counts
 */
const updateWorkerLifeDetails = async (workerId, totalAmount) => {
  try {
    // Ensure totalAmount is an integer
    const integerAmount = Math.round(totalAmount); // Use Math.floor(totalAmount) to truncate instead

    const values = [integerAmount, workerId];
    const result = await client.query(workerQueries.updateWorkerLifeStats, values);

    if (result.rowCount === 0) {
      throw new Error("No worker found with the given worker_id");
    }

    return result.rows[0];
  } catch (error) {
    console.error("Error updating workerlife details:", error);
    throw new Error("Internal server error");
  }
};

module.exports = {
  workerLifeDetails,
  updateWorkerLifeDetails,
};
