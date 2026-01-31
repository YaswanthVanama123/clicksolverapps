const client = require("../../../../connection.js");
const {
  getWorkerCashbackDetailsQuery,
  updateWorkerCashbackPayedQuery,
  getCashbackHistoryQuery,
} = require("../../../database/queries/worker.queries.js");

// Cashback Functions - Worker Cashback Operations and History

const getWorkerCashbackDetails = async (req, res) => {
  try {
    const { worker_id } = req.body;
    console.log(worker_id);

    const values = [worker_id];
    const result = await client.query(getWorkerCashbackDetailsQuery, values);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching worker cashback details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const workerCashbackPayed = async (req, res) => {
  const { worker_id, cashbackCount, cashbackPayed } = req.body;
  console.log(worker_id, cashbackPayed, cashbackCount);
  try {
    const currentTime = new Date().toISOString();

    // Construct the new cashback history entry as a JSON object
    const newHistoryEntry = JSON.stringify([
      {
        amount: cashbackPayed,
        time: currentTime,
        paid: "Paid by Click Solver",
        count: cashbackCount,
        status: "success",
      },
    ]);

    // Execute the query with parameters
    const { rows } = await client.query(updateWorkerCashbackPayedQuery, [
      cashbackCount,
      newHistoryEntry,
      worker_id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Worker not found" });
    }

    // Send the updated cashback information as response
    res.status(200).json({
      message: "Cashback updated successfully",
      cashback_gain: rows[0].cashback_gain,
      cashback_history: rows[0].cashback_history,
    });
  } catch (error) {
    console.error("Error updating cashback:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const cashbackHistory = async (req, res) => {
  const { worker_id } = req.query;

  // Validate input
  if (!worker_id) {
    return res.status(400).json({ error: "worker_id is required" });
  }

  try {
    const { rows } = await client.query(getCashbackHistoryQuery, [worker_id]);

    // Check if worker exists
    if (rows.length === 0) {
      return res.status(404).json({ error: "Worker not found" });
    }

    // Return the cashback data
    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error fetching cashback history:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getWorkerCashbackDetails,
  workerCashbackPayed,
  cashbackHistory,
};
