const client = require("../../../database/connection");
const authQueries = require("../../../database/queries/auth.queries");

// ============================================================================
// STATUS & VERIFICATION FUNCTIONS
// ============================================================================

const loginStatus = async (req, res) => {
  const id = req.user.id;
  try {
    const result = await client.query(authQueries.GET_USER_BY_USER_ID, [id]);

    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  } catch (err) {
    console.error(`Error fetching user with ID ${id}:`, err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const checkOnboardingStatus = async (req, res) => {
  const worker_id = req.worker.id;

  try {
    const { rows } = await client.query(authQueries.GET_WORKER_ONBOARDING_STATUS_PG, [worker_id]);

    if (!rows.length) {
      return res.status(404).json({ message: "Worker not found" });
    }

    res.status(200).json({ onboarding_status: rows[0].onboarding_status });
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const registrationStatus = async (req, res) => {
  const workerId = req.worker.id;

  try {
    const result = await client.query(authQueries.GET_WORKER_SKILLS, [workerId]);
    // console.log(result.rows.length)
    if (result.rows.length === 0) {
      return res.status(204).json({ message: "worker not found" });
    } else {
      return res.status(200).json(result.rows);
    }
  } catch (error) {
    console.error("Error updating skill registration:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const accountDelete = async (req, res) => {
  const workerId = req.user.id;
  console.log("worker", workerId);
  try {
    const { rows } = await client.query(authQueries.DELETE_USER_ACCOUNT, [workerId]);
    const result = rows[0].result;
    return res.status(result.status).json({ message: result.message });
  } catch (error) {
    console.error("Error in accountDelete:", error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  loginStatus,
  checkOnboardingStatus,
  registrationStatus,
  accountDelete,
};
