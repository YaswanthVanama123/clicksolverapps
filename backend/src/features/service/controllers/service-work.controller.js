const admin = require("../../../config/firebase.config.js");
const { getMessaging } = require("firebase-admin/messaging");
const db = admin.firestore();
const client = require("../../../database/connection");
const {
  updateWorkerAction,
  getTimeDifferenceInIST,
  sendFCMNotification,
} = require("./service.helpers.js");

// Note: createUserBackgroundAction should be imported from its actual location
// This is a placeholder - adjust the import path as needed
// const { createUserBackgroundAction } = require("../../user/user.helpers.js");

/**
 * Sends work completion request notification to worker
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const workCompletedRequest = async (req, res) => {
  const { notification_id } = req.body;
  const encodedUserNotificationId = Buffer.from(
    notification_id.toString()
  ).toString("base64");

  try {
    // Query to get worker_id and fcm_tokens in one go using JOIN
    const result = await client.query(
      `
      SELECT f.worker_id, f.fcm_token
      FROM accepted a
      JOIN fcm f ON a.worker_id = f.worker_id
      WHERE a.notification_id = $1
    `,
      [notification_id]
    );

    if (result.rows.length > 0) {
      const fcmTokens = result.rows.map((row) => row.fcm_token);

      if (fcmTokens.length > 0) {
        try {
          await sendFCMNotification(
            fcmTokens,
            {
              title: "Click Solver",
              body: `It is the request from user with work has completed successfully. Click the notification and confirm the work completion.`,
            },
            {
              notification_id: encodedUserNotificationId.toString(),
              screen: "TaskConfirmation",
            }
          );
        } catch (error) {
          console.error("Error sending notifications:", error);
        }
      } else {
        console.error("No FCM tokens to send the message to.");
      }

      res.status(200).json({
        message: "Status updated to accept",
      });
    } else {
      res.status(205).json({
        message: "Nothing sent",
      });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Cancels work completion
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const workCompletionCancel = async (req, res) => {
  const { notification_id } = req.body;
  try {
    if (notification_id) {
      const updateResult = await client.query(
        "UPDATE accepted SET complete_status = $1 WHERE notification_id = $2 RETURNING *",
        ["cancel", notification_id]
      );
      if (updateResult.rowCount > 0) {
        res.status(200).json({
          message: "Status updated to accept",
        });
      }
    } else {
      res.status(400).json({ message: "notification_id not there" });
    }
  } catch (error) {
    console.error("Error canceling work completion:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Marks service as completed and updates all related records
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const serviceCompleted = async (req, res) => {
  const { notification_id, encodedId } = req.body;

  if (!notification_id || !encodedId) {
    return res.status(400).json({
      error: "Missing required fields: notification_id and encodedId.",
    });
  }

  try {
    const end_time = new Date();

    // Single query using CTEs, with prev_end_time instead of end_time
    const query = `
      WITH fetched_data AS (
        SELECT
          sc.notification_id,
          sc.start_time,
          sc.end_time      AS prev_end_time,
          a.user_id,
          a.service_booked,
          a.worker_id
        FROM servicecall sc
        JOIN accepted a USING (notification_id)
        WHERE sc.notification_id = $1
        FOR UPDATE
      ),
      check_end_time AS (
        SELECT
          start_time,
          user_id,
          service_booked,
          worker_id,
          (prev_end_time IS NOT NULL) AS is_end_time_set
        FROM fetched_data
      ),
      update_servicecall AS (
        UPDATE servicecall sc
        SET
          end_time   = $2,
          time_worked =
            TO_CHAR(EXTRACT(EPOCH FROM ($2 - sc.start_time)) / 3600, 'FM00') || ':' ||
            TO_CHAR((EXTRACT(EPOCH FROM ($2 - sc.start_time)) / 60) % 60, 'FM00') || ':' ||
            TO_CHAR(EXTRACT(EPOCH FROM ($2 - sc.start_time)) % 60, 'FM00')
        FROM fetched_data fd
        WHERE sc.notification_id = fd.notification_id
          AND sc.end_time IS NULL
        RETURNING
          sc.end_time    AS updated_end_time,
          sc.time_worked AS updated_time_worked
      ),
      update_accepted AS (
        UPDATE accepted a
        SET
          time = jsonb_set(
            COALESCE(a.time, '{}'::jsonb),
            '{workCompleted}',
            to_jsonb(to_char($2, 'YYYY-MM-DD HH24:MI:SS'))
          )
        FROM fetched_data fd
        WHERE a.notification_id = fd.notification_id
        RETURNING a.time AS updated_time
      ),
      user_fcm AS (
        SELECT ARRAY_AGG(u.fcm_token) AS fcm_tokens
        FROM userfcm u
        WHERE u.user_id = (SELECT user_id FROM fetched_data LIMIT 1)
      )
      SELECT
        cd.start_time,
        cd.user_id,
        cd.service_booked,
        cd.worker_id,
        cd.is_end_time_set,
        us.updated_end_time,
        us.updated_time_worked,
        ua.updated_time,
        uf.fcm_tokens
      FROM check_end_time cd
      LEFT JOIN update_servicecall us ON TRUE
      LEFT JOIN update_accepted ua     ON TRUE
      CROSS JOIN user_fcm uf;
    `;
    const values = [notification_id, end_time];
    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notification not found." });
    }

    const {
      start_time,
      user_id,
      service_booked,
      worker_id,
      is_end_time_set,
      updated_end_time,
      updated_time_worked,
      updated_time,
      fcm_tokens,
    } = result.rows[0];

    // If already completed
    if (is_end_time_set) {
      return res.status(205).json({ message: "End time already set." });
    }

    // Determine time_worked
    let time_worked = updated_time_worked;
    if (!time_worked) {
      const seconds = Math.floor((end_time - start_time) / 1000);
      const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
      const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
      const secs = String(seconds % 60).padStart(2, "0");
      time_worked = `${hrs}:${mins}:${secs}`;
    }

    // Send FCM notifications
    const tokens = (fcm_tokens || []).filter((t) => t);
    if (tokens.length > 0) {
      try {
        await sendFCMNotification(
          tokens,
          {
            title: "Click Solver",
            body: `Commander has completed your work. Great to hear!`,
          },
          {
            notification_id: `${notification_id}`,
            screen: "Paymentscreen",
          }
        );
      } catch (err) {
        console.error("Error sending FCM:", err);
        return res.status(500).json({ error: "Error sending notifications." });
      }
    } else {
      console.warn("No FCM tokens available.");
    }

    // Background actions
    // Note: Uncomment these when createUserBackgroundAction is properly imported
    // await createUserBackgroundAction(
    //   user_id,
    //   encodedId,
    //   "Paymentscreen",
    //   service_booked
    // );
    await updateWorkerAction(worker_id, encodedId, "Paymentscreen");

    // Final response
    return res.status(200).json({
      notification_id,
      end_time: updated_end_time,
      time_worked,
      updated_time,
    });
  } catch (error) {
    console.error("Error updating end time:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * Gets work details for a notification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getWorkDetails = async (req, res) => {
  const { notification_id } = req.body;

  try {
    const queryText = `
      SELECT
        n.service_booked,
        n.discount,
        n.total_cost,
        un.city,
        un.area,
        un.pincode
      FROM
        accepted n
      JOIN
        usernotifications un
      ON
        n.user_notification_id = un.user_notification_id
      WHERE
        n.notification_id = $1;
    `;
    const queryValues = [notification_id];

    const result = await client.query(queryText, queryValues);

    if (result.rows.length > 0) {
      const workDetails = result.rows[0];
      res.status(200).json({ workDetails });
    } else {
      res.status(404).json({ error: "Notification not found" });
    }
  } catch (error) {
    console.error("Error fetching work details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Gets service completed details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getServiceCompletedDetails = async (req, res) => {
  const { notification_id } = req.body;
  console.log("notification", notification_id);

  try {
    const query = `
      SELECT
          sc.payment,
          sc.payment_type,
          cn.service_booked,
          cn.longitude,
          cn.latitude,
          un.area,
          u.name
      FROM completenotifications cn
      JOIN servicecall sc ON cn.notification_id = sc.notification_id
      JOIN usernotifications un ON cn.user_notification_id = un.user_notification_id
      JOIN "user" u ON un.user_id = u.user_id
      WHERE cn.notification_id = $1;
    `;

    const result = await client.query(query, [notification_id]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Notification or related data not found" });
    }

    const {
      payment,
      payment_type,
      service_booked,
      longitude,
      latitude,
      area,
      name,
    } = result.rows[0];
    const jsonbServiceBooked =
      typeof service_booked === "object"
        ? JSON.stringify(service_booked)
        : service_booked;

    return res.json({
      message: "Service completed and data shifted successfully",
      payment,
      payment_type,
      service: jsonbServiceBooked,
      longitude,
      latitude,
      area,
      name,
    });
  } catch (error) {
    console.error("Error checking worker details:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Gets user-worker in-progress details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const userWorkerInProgressDetails = async (req, res) => {
  const { decodedId } = req.body;
  console.log(decodedId);
  try {
    const query = `
          SELECT
              a.service_booked,
              a.time,
              a.created_at,
              a.service_status,
              u.area,
              w.name,
              ws.profile
          FROM
              accepted a
          JOIN
              usernotifications u ON a.user_notification_id = u.user_notification_id
          JOIN
              workersverified w ON a.worker_id = w.worker_id
          JOIN
              workerskills ws ON a.worker_id = ws.worker_id
          WHERE
              a.notification_id = $1
      `;

    const result = await client.query(query, [decodedId]);

    console.log("data", result.rows);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No details found for the given notification_id" });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching user worker in-progress details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  workCompletedRequest,
  workCompletionCancel,
  serviceCompleted,
  getWorkDetails,
  getServiceCompletedDetails,
  userWorkerInProgressDetails,
  // Re-export getTimeDifferenceInIST for backward compatibility
  getTimeDifferenceInIST,
};
