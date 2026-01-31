const client = require("../../../../connection.js");
const workerQueries = require("../../../database/queries/worker.queries");

// Worker Booking Query Functions
// Handles all booking retrieval operations for workers

/**
 * Get all bookings for a worker (completed)
 * @route GET /api/worker/bookings
 */
const getWorkerBookings = async (req, res) => {
  const workerId = req.worker.id;

  try {
    const { rows } = await client.query(workerQueries.getWorkerBookings, [workerId]);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching user bookings" });
  }
};

/**
 * Get ongoing bookings for a worker (accepted but not completed)
 * @route GET /api/worker/bookings/ongoing
 */
const getWorkerOngoingBookings = async (req, res) => {
  console.log("called id");
  const workerId = req.worker.id;

  try {
    const { rows } = await client.query(workerQueries.getWorkerOngoingBookings, [
      workerId,
    ]);
    console.log("=roes ", rows[0]);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching user bookings" });
  }
};

/**
 * Get work in progress details for a specific notification
 * @route POST /api/worker/work-in-progress
 */
const WorkerWorkInProgressDetails = async (req, res) => {
  const { decodedId } = req.body;
  console.log(decodedId);
  try {
    const result = await client.query(workerQueries.getWorkInProgressDetails, [
      decodedId,
    ]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No details found for the given notification_id" });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching user worker in-progress details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getWorkerBookings,
  getWorkerOngoingBookings,
  WorkerWorkInProgressDetails,
};
