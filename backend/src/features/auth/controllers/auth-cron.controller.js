const admin = require("../../../config/firebase.config.js");
const client = require("../../../database/connection");
var cron = require("node-cron");
const authQueries = require("../../../database/queries/auth.queries");

// ============================================================================
// CRON FUNCTIONS
// ============================================================================

const updateWorkerNoDueStatus = async () => {
  try {
    const result = await client.query(authQueries.UPDATE_WORKER_NO_DUE_STATUS);
    console.log(`Updated ${result.rowCount} workers' no_due status at 10 AM.`);
  } catch (error) {
    console.error("Error updating no_due status:", error);
  }
};

cron.schedule(
  "0 10 * * *",
  () => {
    const now = new Date();
    console.log(
      `Job ran at ${now.toISOString()} (UTC) and ${now.toString()} (local time)`
    );
    updateWorkerNoDueStatus();
  },
  {
    timezone: "Asia/Kolkata",
  }
);

const sendDuePaymentNotifications = async () => {
  try {
    // Query to join workerlife and fcm to fetch workers having balance_amount < -50
    const result = await client.query(authQueries.GET_WORKERS_WITH_DUE_PAYMENTS);

    if (result.rows.length === 0) {
      console.log("No workers with due payments found.");
      return;
    }

    // Group rows by worker_id so that we can send one notification per worker
    const workerMap = new Map();
    for (const row of result.rows) {
      if (!workerMap.has(row.worker_id)) {
        workerMap.set(row.worker_id, {
          balance_amount: row.balance_amount,
          tokens: [row.fcm_token],
        });
      } else {
        workerMap.get(row.worker_id).tokens.push(row.fcm_token);
      }
    }

    // For each worker, build and send the notification message using sendEachForMulticast
    for (const [worker_id, data] of workerMap.entries()) {
      // Calculate the due amount (absolute value of negative balance)
      const dueAmount = Math.abs(data.balance_amount);

      // Build the notification message
      const message = {
        tokens: data.tokens,
        notification: {
          title: "Payment Due",
          body: `Hi, Your payment of ${dueAmount} rupees needs to be paid by 10 AM. If not, you will not receive services until you pay.`,
        },
        data: {
          worker_id: worker_id.toString(),
          dueAmount: dueAmount.toString(),
        },
      };

      try {
        // Send notification using sendEachForMulticast
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(
          `Notification sent to worker ${worker_id} (Tokens: ${data.tokens.join(
            ", "
          )})`
        );
        response.responses.forEach((resp, index) => {
          if (!resp.success) {
            console.error(
              `Error sending to token ${data.tokens[index]}: `,
              resp.error
            );
          }
        });
      } catch (error) {
        console.error(
          `Error sending notification to worker ${worker_id}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("Error fetching workers with due payments:", error);
  }
};

cron.schedule(
  "0 8 * * *",
  () => {
    console.log("Running due payment notification job at 8 AM");
    sendDuePaymentNotifications();
  },
  {
    timezone: "Asia/Kolkata",
  }
);

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  updateWorkerNoDueStatus,
  sendDuePaymentNotifications,
};
