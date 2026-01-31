const admin = require("../../../config/firebase.config.js");
const client = require("../../../database/connection");
const {
  getPendingWorkersWithSkillsQuery,
  getPendingWorkersNotStartedQuery,
  getPendingWorkerDetailsQuery,
  updateWorkerIssuesAndGetTokensQuery,
  updateWorkerApproveStatusQuery,
  checkApprovalVerificationStatusQuery,
  workerApproveQuery,
} = require("../../../database/queries/admin.queries.js");

/**
 * Admin Worker Approval Controller
 * Handles worker verification, approval, and status management
 */

/**
 * Get list of pending workers who have started the registration process
 * Returns workers who have skills registered
 */
const getPendingWorkers = async (req, res) => {
  try {
    const { rows } = await client.query(getPendingWorkersWithSkillsQuery);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Error fetching pending workers:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get list of pending workers who have not started the registration process
 * Returns workers who have no skills registered yet
 */
const getPendingWorkersNotStarted = async (req, res) => {
  try {
    const { rows } = await client.query(getPendingWorkersNotStartedQuery);
    console.log(rows);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Error fetching pending workers:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get detailed information about a specific pending worker
 * Returns worker details including profile, skills, and verification status
 */
const getPendingWorkerDetails = async (req, res) => {
  try {
    const { workerId } = req.body;

    const { rows } = await client.query(getPendingWorkerDetailsQuery, [workerId]);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Error fetching pending worker details:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Update issues for a specific worker and send notifications
 * Updates worker issues and notifies all worker devices
 */
const updateIssues = async (req, res) => {
  const { workerId, issues } = req.body;

  if (!workerId || !issues) {
    return res
      .status(400)
      .json({ message: "workerId and issues are required." });
  }

  try {
    // Use a CTE to update the worker's issues and then retrieve all FCM tokens
    const result = await client.query(updateWorkerIssuesAndGetTokensQuery, [
      workerId,
      JSON.stringify(issues),
    ]);
    const tokens = result.rows.map((row) => row.fcm_token);

    // If tokens exist, send notifications to all devices
    if (tokens.length > 0) {
      const message = {
        notification: {
          title: "Issue Updated",
          body: "Worker issues have been updated.",
        },
        data: {
          screen: "ApprovalScreen", // Ensure IDs are strings
          issues: JSON.stringify(issues), // Send issues as a string
          type: "issue_update", // Example custom type
          timestamp: new Date().toISOString(), // Timestamp for reference
        },
        tokens: tokens, // Sends the notification to all retrieved tokens
      };

      try {
        // If using Firebase Admin SDK's sendEachForMulticast:
        const response = await admin.messaging().sendEachForMulticast(message);
        response.responses.forEach((resp, index) => {
          if (!resp.success) {
            console.error(
              `Error sending to token ${tokens[index]}: `,
              resp.error
            );
          }
        });
        console.log("Notifications sent to worker devices");
      } catch (err) {
        console.error("Error sending worker notification:", err);
      }
    }

    return res.status(200).json({
      message: "Issues updated and notifications sent successfully.",
    });
  } catch (error) {
    console.error("Error updating issues:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while updating issues." });
  }
};

/**
 * Update approval status for a worker
 * Changes the verification status of a worker
 */
const updateApproveStatus = async (req, res) => {
  const { newStatus, workerId } = req.body;

  if (!newStatus || !workerId) {
    return res
      .status(400)
      .json({ message: "status and workerId are required." });
  }

  try {
    // Update the verification_status for the specified worker_id
    const result = await client.query(updateWorkerApproveStatusQuery, [newStatus, workerId]);

    // Check if any rows were updated
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Worker not found." });
    }

    return res
      .status(200)
      .json({ message: "Verification status updated successfully." });
  } catch (error) {
    console.error("Error updating verification status:", error);
    return res.status(500).json({
      message: "An error occurred while updating verification status.",
    });
  }
};

/**
 * Check approval and verification status for a worker
 * Returns worker details and verification status
 */
const checkApprovalVerificationStatus = async (req, res) => {
  const workerId = req.worker.id;

  if (!workerId) {
    return res.status(400).json({ message: "workerId is required." });
  }

  try {
    const result = await client.query(checkApprovalVerificationStatusQuery, [workerId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Worker not found." });
    }

    const workerData = result.rows[0];
    console.log(workerData);

    if (workerData.source === "workersverified") {
      return res.status(201).json({ message: "Worker is verified." });
    }

    return res.status(200).json({
      name: workerData.name,
      issues: workerData.issues,
      verification_status: workerData.verification_status,
      service: workerData.service,
      profile: workerData.profile,
    });
  } catch (error) {
    console.error("Error fetching approval verification status:", error);
    return res.status(500).json({
      message: "An error occurred while fetching approval verification status.",
    });
  }
};

/**
 * Approve a worker and move them to verified workers table
 * Moves worker from pending to verified, creates workerlife entry, and sends notification
 */
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
    const result = await client.query(workerApproveQuery, [workerId]);

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
        console.log("Notifications sent to worker");
      } catch (err) {
        console.error("Error sending worker notification:", err);
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

module.exports = {
  getPendingWorkers,
  getPendingWorkersNotStarted,
  getPendingWorkerDetails,
  updateIssues,
  updateApproveStatus,
  checkApprovalVerificationStatus,
  workerApprove,
};
