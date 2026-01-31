const client = require("../../../../connection.js");
const {
  getBalanceAmountToPayQuery,
  getWorkerBalanceDetailsQuery,
  getBalanceHistoryQuery,
} = require("../../../database/queries/worker.queries.js");

// Balance Functions - Worker Balance Management and History

const balanceAmmountToPay = async (req, res) => {
  const worker_id = req.worker.id;

  try {
    const result = await client.query(getBalanceAmountToPayQuery, [worker_id]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No payments found for this worker" });
    }

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching balance amount to pay:", err);
    res
      .status(500)
      .json({ error: "An error occurred while retrieving payments" });
  }
};

const getWorkerBalanceDetails = async (req, res) => {
  try {
    const { worker_id } = req.body;
    console.log(worker_id);

    const values = [worker_id];
    const result = await client.query(getWorkerBalanceDetailsQuery, values);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching worker cashback details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const balanceHistory = async (req, res) => {
  const { worker_id } = req.query;

  if (!worker_id) {
    return res.status(400).json({ error: "worker_id is required" });
  }

  try {
    const { rows } = await client.query(getBalanceHistoryQuery, [worker_id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Worker not found" });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error fetching balance history:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  balanceAmmountToPay,
  getWorkerBalanceDetails,
  balanceHistory,
};
