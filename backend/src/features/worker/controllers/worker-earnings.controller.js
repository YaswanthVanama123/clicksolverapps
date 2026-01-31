const client = require("../../../../connection.js");
const {
  getWorkerEarningsQuery,
} = require("../../../database/queries/worker.queries.js");

// Earnings Functions - Worker Earnings Retrieval and Calculation

// Helper function to convert date strings
const convertToDateString = (dateStr) => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return null;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (err) {
    return null;
  }
};

const getWorkerEarnings = async (req, res) => {
  const { date, startDate, endDate } = req.body;
  const workerId = req.worker.id;

  let selectStartDate, selectEndDate;

  // 1) Parse incoming dates
  if (startDate && endDate) {
    selectStartDate = convertToDateString(startDate);
    selectEndDate = convertToDateString(endDate);

    if (!selectStartDate || !selectEndDate) {
      console.log("❌ Invalid start/end format:", startDate, endDate);
      return res
        .status(400)
        .json({ error: "Invalid startDate or endDate format" });
    }
    if (new Date(selectStartDate) > new Date(selectEndDate)) {
      console.log("❌ startDate > endDate:", selectStartDate, selectEndDate);
      return res
        .status(400)
        .json({ error: "startDate cannot be after endDate" });
    }
  } else if (date) {
    selectStartDate = convertToDateString(date);
    selectEndDate = selectStartDate;
    if (!selectStartDate) {
      console.log("❌ Invalid single date:", date);
      return res.status(400).json({ error: "Invalid date format" });
    }
  } else {
    console.log("❌ No date provided in request");
    return res.status(400).json({ error: "No date provided" });
  }

  // 2) Trim to YYYY-MM-DD only
  const start = selectStartDate.slice(0, 10);
  const end = selectEndDate.slice(0, 10);

  console.log("🕵️ getWorkerEarnings params:", { workerId, start, end });

  try {
    const values = [workerId, start, end];
    console.log("🛠️ Executing SQL with values:", values);

    const { rows } = await client.query(getWorkerEarningsQuery, values);
    console.log("🏷️  SQL returned rows:", rows);

    if (rows.length === 0) {
      console.log("⚠️ No rows for workerlife—no earnings data");
      return res.status(404).json({ error: "No earnings data found" });
    }

    const {
      total_payment,
      cash_payment,
      payment_count,
      life_earnings,
      avg_rating,
      rejected_count,
      pending_count,
      total_time_worked_hours,
      service_counts,
      cashback_approved_times,
      cashback_gain,
    } = rows[0];

    console.log("📊 Computed metrics:", {
      total_payment,
      cash_payment,
      payment_count,
      life_earnings,
      avg_rating,
      rejected_count,
      pending_count,
      total_time_worked_hours,
      service_counts,
      cashback_approved_times,
      cashback_gain,
    });

    return res.json({
      total_payment: Number(total_payment) || 0,
      cash_payment: Number(cash_payment) || 0,
      payment_count: Number(payment_count) || 0,
      life_earnings: Number(life_earnings) || 0,
      avg_rating: Number(avg_rating) || 0,
      rejected_count: Number(rejected_count) || 0,
      pending_count: Number(pending_count) || 0,
      total_time_worked_hours: Number(total_time_worked_hours) || 0,
      service_counts: Number(service_counts) || 0,
      cashback_approved_times: Number(cashback_approved_times) || 0,
      cashback_gain: Number(cashback_gain) || 0,
    });
  } catch (error) {
    console.error("🔥 Error fetching worker earnings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getWorkerEarnings,
};
