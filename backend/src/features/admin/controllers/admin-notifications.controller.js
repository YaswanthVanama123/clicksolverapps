/**
 * Admin Notifications Controller
 *
 * This module handles admin operations for sending notifications to workers.
 * It manages FCM (Firebase Cloud Messaging) notifications with pagination,
 * chunking, and error handling for large-scale worker notifications.
 */

const client = require("../../../database/connection");
const { getMessaging } = require("firebase-admin/messaging");

// Configuration constants for pagination and chunking
const DB_PAGE_SIZE = 5000; // tokens fetched from DB per page
const FCM_CHUNK_SIZE = 500; // FCM hard limit
const MAX_WORKER_IDS = 50000; // protect against accidental huge payloads
const MAX_TOTAL_TOKENS = 250000; // hard cap to avoid runaway sends

/**
 * Helper function to split array into chunks
 * @param {Array} arr - Array to split
 * @param {number} size - Size of each chunk
 * @returns {Array[]} Array of chunks
 */
function toChunks(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

/**
 * Send notifications to multiple workers via FCM
 * POST /admin/send/notifications
 *
 * Request body:
 * - worker_ids: Array of worker IDs (required, max 50000)
 * - title: Notification title (optional, default: "New update from Click Solver")
 * - body: Notification body (optional, default: "You have a new notification.")
 * - data: Additional data object (optional)
 *
 * Response:
 * - message: Status message
 * - totalTokens: Total number of FCM tokens processed
 * - successCount: Number of successful notifications
 * - failureCount: Number of failed notifications
 * - pages: Number of pages processed
 * - perPageSummaries: Array of summaries for each page
 */
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
  const tokensSql = `
    SELECT fcm_token
    FROM workerfcm
    WHERE worker_id = ANY($1::int[])
      AND is_active = TRUE
      AND fcm_token IS NOT NULL
      AND fcm_token <> ''
    ORDER BY worker_id, fcm_token
    LIMIT $2 OFFSET $3
  `;

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

module.exports = {
  sendNotificationsToWorkers,
};
