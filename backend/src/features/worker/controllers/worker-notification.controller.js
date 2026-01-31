const admin = require("../../../config/firebase.config.js");
const { getMessaging } = require("firebase-admin/messaging");
const client = require("../../../../connection.js");
const workerQueries = require("../../../database/queries/worker.queries");

// FCM Constants
const MAX_WORKER_IDS = 5000;
const MAX_TOTAL_TOKENS = 50000;
const DB_PAGE_SIZE = 1000;
const FCM_CHUNK_SIZE = 500;

// Helper function to chunk arrays
function toChunks(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// Notification and FCM Functions

const sendNotificationsToWorkers = async (req, res) => {
  let { worker_ids: workerIds, title, body, data } = req.body;

  // 1) Validate input early
  if (!Array.isArray(workerIds) || workerIds.length === 0) {
    return res
      .status(400)
      .json({ message: "worker_ids (non-empty array) is required." });
  }
  workerIds = [...new Set(workerIds.map(Number).filter(Number.isInteger))];
  if (workerIds.length === 0) {
    return res
      .status(400)
      .json({ message: "worker_ids must contain integers." });
  }
  if (workerIds.length > MAX_WORKER_IDS) {
    return res
      .status(413)
      .json({
        message: `Too many worker_ids. Max allowed is ${MAX_WORKER_IDS}.`,
      });
  }

  title = title ?? "New update from Click Solver";
  body = body ?? "You have a new notification.";
  data = Object.fromEntries(
    Object.entries(data ?? {}).map(([k, v]) => [String(k), String(v)])
  );

  // 2) Tight base payload (use data-only by removing "notification" block if desired)
  const basePayload = {
    notification: { title, body },
    data,
    android: { priority: "high" },
    apns: {
      headers: { "apns-priority": "10" },
      payload: { aps: { sound: "default" } },
    },
  };

  // 3) Page through tokens to keep memory low
  //    NOTE: Add this unique index in DB to avoid DISTINCT:
  //    CREATE UNIQUE INDEX IF NOT EXISTS ux_workerfcm_worker_token ON workerfcm(worker_id, fcm_token);
  const tokensSql = workerQueries.getWorkerFcmTokensPaginated;

  let offset = 0;
  let grandTotal = 0;
  let successCount = 0;
  let failureCount = 0;
  const perPageSummaries = [];

  try {
    while (true) {
      const { rows } = await client.query(tokensSql, [
        workerIds,
        DB_PAGE_SIZE,
        offset,
      ]);
      if (rows.length === 0) break;

      const pageTokens = rows.map((r) => r.fcm_token);
      grandTotal += pageTokens.length;

      if (grandTotal > MAX_TOTAL_TOKENS) {
        return res.status(413).json({
          message: `Aborting: total tokens exceed cap (${MAX_TOTAL_TOKENS}).`,
          scannedTokens: grandTotal,
        });
      }

      // 4) FCM chunking per page
      let pageSuccess = 0;
      let pageFailure = 0;
      const pageErrors = [];

      for (const chunk of toChunks(pageTokens, FCM_CHUNK_SIZE)) {
        const resp = await getMessaging().sendEachForMulticast({
          ...basePayload,
          tokens: chunk,
        });

        pageSuccess += resp.successCount;
        pageFailure += resp.failureCount;

        // gather token-level errors (only when needed)
        resp.responses.forEach((r, idx) => {
          if (!r.success) {
            pageErrors.push({
              token: chunk[idx],
              code: r.error?.code,
              message: r.error?.message,
            });
          }
        });

        // yield event loop between bursts to keep server responsive
        await new Promise((r) => setImmediate(r));
      }

      successCount += pageSuccess;
      failureCount += pageFailure;
      perPageSummaries.push({
        pageSize: rows.length,
        success: pageSuccess,
        failure: pageFailure,
        errorsSample: pageErrors.slice(0, 10), // include a small sample to keep response light
      });

      offset += DB_PAGE_SIZE;
    }

    return res.status(200).json({
      message: "Notifications processed.",
      totalTokens: grandTotal,
      successCount,
      failureCount,
      pages: perPageSummaries.length,
      perPageSummaries,
    });
  } catch (err) {
    console.error("sendNotificationsToWorkers error:", err);
    return res
      .status(500)
      .json({
        message: "Internal Server Error.",
        error: err?.message ?? String(err),
      });
  }
};

const getWorkerNotifications = async (req, res) => {
  const workerId = req.worker.id;
  const fcmToken = req.query.fcmToken; // Access fcmToken from query parameters

  try {
    const result = await client.query(workerQueries.getWorkerNotifications, [
      workerId,
      fcmToken,
    ]); // Pass fcmToken as the second parameter

    const notifications = result.rows;
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

const storeNotification = async (req, res) => {
  const workerId = req.worker.id;
  const { fcmToken, notification } = req.body;
  const { title, body, data, receivedAt, userNotificationId } = notification;
  const { cost } = data;
  try {
    const result = await client.query(workerQueries.storeWorkerNotification, [
      title,
      body,
      cost,
      receivedAt,
      workerId,
      userNotificationId,
      fcmToken,
    ]);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error storing notification:", err);
    res.status(500).send("Error storing notification");
  }
};

const storeFcmToken = async (req, res) => {
  const { fcmToken } = req.body;
  const workerId = req.worker.id;

  try {
    // Single query using CTE:
    // 1) Delete any row with the same fcm_token (to avoid duplicates across workers)
    // 2) Insert new row with (worker_id, fcm_token).
    // 3) ON CONFLICT DO NOTHING if the same row (worker_id + fcm_token) already exists.
    // 4) Return the newly inserted row (if any).
    const result = await client.query(workerQueries.storeFcmToken, [
      workerId,
      fcmToken,
    ]);

    if (result.rowCount > 0) {
      // Successfully inserted a new row
      res.status(200).json({ message: "FCM token stored successfully" });
    } else {
      // The row already existed for this worker, or ON CONFLICT prevented insert
      res
        .status(200)
        .json({ message: "FCM token already exists for this worker" });
    }
  } catch (error) {
    console.error("Error storing FCM token:", error);
    res.status(500).json({ error: "Failed to store FCM token" });
  }
};

module.exports = {
  sendNotificationsToWorkers,
  getWorkerNotifications,
  storeNotification,
  storeFcmToken,
};
