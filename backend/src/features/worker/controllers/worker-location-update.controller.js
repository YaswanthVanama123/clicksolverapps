const client = require("../../../../connection.js");
const {
  upsertWorkerLocationQuery,
} = require("../../../database/queries/worker.queries.js");

// Location Update Functions

/**
 * Stores or updates worker location (without authentication)
 * Used for initial location storage or manual updates
 */
const storeWorkerLocation = async (req, res) => {
  const { longitude, latitude, workerId } = req.body;

  try {
    await client.query(upsertWorkerLocationQuery, [
      longitude,
      latitude,
      workerId,
    ]);

    res.status(200).json({ message: "User location stored successfully" });
  } catch (error) {
    console.error("Error storing user location:", error);
    res.status(500).json({ error: "Failed to store user location" });
  }
};

/**
 * Updates authenticated worker's location
 * Requires authentication middleware (req.worker.id)
 */
const updateWorkerLocation = async (req, res) => {
  const workerId = req.worker.id;
  const { longitude, latitude } = req.body;

  try {
    await client.query(upsertWorkerLocationQuery, [
      longitude,
      latitude,
      workerId,
    ]);

    res.status(200).json({ message: "User location stored successfully" });
  } catch (error) {
    console.error("Error storing user location:", error);
    res.status(500).json({ error: "Failed to store user location" });
  }
};

module.exports = {
  storeWorkerLocation,
  updateWorkerLocation,
};
