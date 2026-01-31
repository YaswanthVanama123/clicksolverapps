const admin = require("../../../config/firebase.config.js");
const client = require("../../../../connection.js");
const workerQueries = require("../../../database/queries/worker.queries");

// Verification and Approval Functions

const workerApprove = async (req, res) => {
  const { workerId } = req.body;

  if (!workerId) {
    return res.status(400).json({ error: "workerId is required." });
  }

  try {
    // Single query with multiple CTEs:
    // 1. Delete from workers, returning worker details
    // 2. Insert the returned row into workersverified
    // 3. Insert the same worker_id into workerlife
    // 4. Finally, select fcm_token for that worker
    const result = await client.query(workerQueries.approveWorker, [workerId]);

    // If no rows returned, the worker wasn't found or is already verified
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Worker not found or already verified" });
    }

    // Extract tokens from the result
    const tokens = result.rows.map((row) => row.fcm_token);

    // If tokens exist, send a notification to the worker
    if (tokens.length > 0) {
      const message = {
        notification: {
          title: "Account Approved",
          body: "Your account is approved and now you are a family in ClickSolver!",
        },
        data: {
          screen: "ApprovalScreen",
          type: "account_approved",
          timestamp: new Date().toISOString(),
        },
        tokens: tokens,
      };

      try {
        // Using Firebase Admin SDK's sendEachForMulticast
        const response = await admin.messaging().sendEachForMulticast(message);
        response.responses.forEach((resp, index) => {
          if (!resp.success) {
            console.error(
              `Error sending to token ${tokens[index]}: `,
              resp.error
            );
          }
        });
        console.log("Notifications sent to user");
      } catch (err) {
        console.error("Error sending user notification:", err);
      }
    }

    return res
      .status(200)
      .json({
        message:
          "Worker approved, moved to workersverified, and added to workerlife.",
      });
  } catch (error) {
    console.error("Error in workerApprove:", error.message);
    return res
      .status(500)
      .json({ error: "An error occurred while approving the worker" });
  }
};

const workerSearch = async (req, res) => {
  try {
    const { phone_number } = req.query;

    if (!phone_number) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Query to fetch worker details, skills, and life stats
    const { rows } = await client.query(workerQueries.searchWorkerByPhone, [
      phone_number,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Worker not found" });
    }

    // Return the first result (assuming phone_number is unique)
    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error searching worker:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  workerApprove,
  workerSearch,
};
