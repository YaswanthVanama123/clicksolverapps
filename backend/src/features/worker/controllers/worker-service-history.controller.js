const client = require("../../../../connection.js");
const workerQueries = require("../../../database/queries/worker.queries");

// Worker Service History Functions
// Handles current service tracking and service history retrieval

/**
 * Get current active service for a worker
 * @route GET /api/worker/current-service
 */
const currentService = async (req, res) => {
  const { worker_id } = req.query;

  // Validate input
  if (!worker_id) {
    return res.status(400).json({ error: "worker_id is required" });
  }

  try {
    // Query to fetch the current service details
    const { rows } = await client.query(workerQueries.getCurrentService, [worker_id]);

    // Check if any data is found
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No current service found for the worker" });
    }

    // Respond with the fetched data
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error fetching current service:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Get service history for a worker (completed services with payments)
 * @route GET /api/worker/service-history
 */
const getWorkerServiceHistory = async (req, res) => {
  try {
    const { worker_id } = req.query; // Get worker_id from the request body
    console.log(worker_id);

    const values = [worker_id];
    const result = await client.query(workerQueries.getWorkerServiceHistory, values);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching WorkerServiceHistory:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  currentService,
  getWorkerServiceHistory,
};
