const client = require("../../../../connection.js");
const {
  getPendingBalanceWorkersQuery,
  getWorkersPendingCashbackQuery,
} = require("../../../database/queries/worker.queries.js");

// Financial Administration Functions - Worker Pending Balance and Cashback Management

const pendingBalanceWorkers = async (req, res) => {
  try {
    const result = await client.query(getPendingBalanceWorkersQuery);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching pending balance worker details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getWorkersPendingCashback = async (req, res) => {
  try {
    const result = await client.query(getWorkersPendingCashbackQuery);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching pending cashback for workers:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  pendingBalanceWorkers,
  getWorkersPendingCashback,
};
