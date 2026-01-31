const admin = require("../../../config/firebase.config.js");
const { getMessaging } = require("firebase-admin/messaging");
const db = admin.firestore();
const client = require("../../../database/connection");
const bookingQueries = require("../../../database/queries/booking.queries.js");
const {
  getBookingByIdQuery,
  createBookingQuery,
  updateBookingStatusQuery,
  getBookingsByUserQuery,
  getBookingsByWorkerQuery,
  getActiveBookingsQuery,
  updateBookingActualAmountQuery,
  getBookingsByStatusQuery,
  cancelBookingQuery,
  getBookingCountByStatusQuery,
} = require("../../../database/queries/booking.queries.js");

// Helper function - createUserBackgroundAction
const createUserBackgroundAction = async (
  userId,
  encodedId,
  screen,
  serviceBooked,
  userNotificationEncodedId = null
) => {
  // console.log('Service Booked:', screen,encodedId,serviceBooked);

  try {
    // Prepare the new action object if 'screen' is provided
    const newAction = screen
      ? {
          screen,
          encodedId,
          serviceBooked,
        }
      : null;

    // Convert newAction to JSON string if it exists
    const newActionJson = newAction ? JSON.stringify(newAction) : null;

    // Prepare the initial track array for insertion
    const initialTrack = newAction
      ? JSON.stringify([newAction])
      : JSON.stringify([]);

    // Define the UPSERT query with explicit casting for $4 and $5
    const upsertQuery = bookingQueries.upsertUserActionQuery;

    // Parameters for the query
    const params = [
      userId, // $1: user_id
      initialTrack, // $2: initial track array (JSONB)
      encodedId, // $3: encodedId to remove
      userNotificationEncodedId, // $4: userNotificationEncodedId to remove (can be null)
      newActionJson, // $5: new action JSON (if screen is provided)
      newActionJson ? `[${newActionJson}]` : "[]", // $6: new action as JSONB array or empty array
    ];

    // Execute the UPSERT query
    const result = await client.query(upsertQuery, params);

    // The result will contain the inserted or updated row
    const updatedTrackScreen = result.rows[0];

    // Return the updated user action data
    return updatedTrackScreen;
  } catch (error) {
    console.error("Error inserting or updating user background action:", error);
    throw error; // Re-throw the error after logging
  }
};

// Helper function - updateWorkerAction
const updateWorkerAction = async (workerId, encodedId, screen) => {
  try {
    console.log("updateWorkerAction called with:", {
      workerId,
      encodedId,
      screen,
    });

    const params = JSON.stringify({ encodedId });
    console.log("Constructed params:", params);

    const query = bookingQueries.upsertWorkerActionQuery;

    console.log("Executing SQL query:", query);
    const result = await client.query(query, [workerId, screen, params]);
    console.log("Query executed successfully. Result:", result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error("Error inserting user action:", error);
  }
};

// Request Management Functions

const acceptRequest = async (req, res) => {
  const { user_notification_id } = req.body;
  const worker_id = req.worker.id;

  try {
    // Start a transaction
    await client.query("BEGIN");

    // Combined CTE to perform multiple operations

    const combinedQuery = bookingQueries.acceptRequestCombinedQuery;

    const combinedResult = await client.query(combinedQuery, [
      user_notification_id,
      worker_id,
    ]);

    // Extract the first row (since the query should return only one row)
    const row = combinedResult.rows[0];

    // **Check if someone already accepted the request**
    if (row.existing_notification_id) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "Someone already accepted the request." });
    }

    // **Check if notification exists**
    if (!row.cancel_status && !row.user_id && !row.notification_id) {
      // If 'get_notification' didn't find any row, these fields would be undefined
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Notification not found." });
    }
    if (row.cancel_status === "cancel") {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "Cannot accept request; it has been canceled." });
    }

    const insertedNotificationId = row.inserted_notification_id;
    const fcmResult = await client.query(
      bookingQueries.getUserFcmTokensQuery,
      [row.user_id]
    );

    const fcmTokens = fcmResult.rows
      .map((r) => r.fcm_token)
      .filter((token) => token);
    await client.query("COMMIT");
    if (fcmTokens.length > 0) {
      const multicastMessage = {
        tokens: fcmTokens,
        notification: {
          title: "Click Solver",
          body: `Commander has accepted your request; he will be there within 5 minutes.`,
        },
        data: {
          notification_id: insertedNotificationId.toString(),
          screen: "UserNavigation",
        },
      };
      const response = await getMessaging().sendEachForMulticast(
        multicastMessage
      );
      response.responses.forEach((resp, index) => {
        if (resp.success) {
        } else {
          console.error(
            `Error sending message to token ${fcmTokens[index]}:`,
            resp.error
          );
        }
      });
    } else {
      console.error("No FCM tokens to send the message to.");
    }
    const userNotificationEncodedId = Buffer.from(
      user_notification_id.toString()
    ).toString("base64");
    const encodedId = Buffer.from(insertedNotificationId.toString()).toString(
      "base64"
    );
    const screen = "UserNavigation";
    let parsedServiceBooked;
    if (typeof row.service_booked === "string") {
      try {
        parsedServiceBooked = JSON.parse(row.service_booked);
      } catch (parseError) {
        console.error("Error parsing service_booked JSON:", parseError);
        parsedServiceBooked = row.service_booked;
      }
    } else {
      parsedServiceBooked = row.service_booked;
    }
    const backgroundActionResult = await createUserBackgroundAction(
      row.user_id,
      encodedId,
      screen,
      parsedServiceBooked,
      userNotificationEncodedId
    );
    await updateWorkerAction(worker_id, encodedId, screen);
    res.status(200).json({
      message: "Status updated to accept",
      notificationId: insertedNotificationId,
      backgroundAction: backgroundActionResult,
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Error during ROLLBACK:", rollbackError);
    }
    console.error("Error updating status:", error.message);
    console.error("Error Stack:", error.stack);
    res.status(500).json({ message: "Internal server error" });
  }
};

const rejectRequest = async (req, res) => {
  const { user_notification_id } = req.body;
  const worker_id = req.worker.id;

  try {
    const result = await client.query(
      bookingQueries.rejectRequestQuery,
      ["reject", user_notification_id, worker_id]
    );

    if (result.rowCount === 0) {
      res
        .status(404)
        .json({ message: "Notification not found or worker mismatch" });
    } else {
      res.status(200).json({
        message: "Status updated to reject",
        notification: result.rows[0],
      });
    }
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const cancelRequest = async (req, res) => {
  const { user_notification_id } = req.body;

  if (!user_notification_id) {
    return res.status(400).json({ error: "user_notification_id is required" });
  }

  try {
    // Combined query to check both 'accept' status and 'cancel_status'
    const query = bookingQueries.checkAcceptStatusQuery;

    const result = await client.query(query, [user_notification_id]);

    const acceptCount = parseInt(result.rows[0].accept_count, 10);
    const currentStatus = result.rows[0].cancel_status;

    // Check if there is an 'accept' status
    if (acceptCount > 0) {
      return res
        .status(400)
        .json({ error: "Cannot cancel as status is already accepted" });
    }

    // Only update if the current cancel_status is not 'timeup'
    if (currentStatus !== "timeup") {
      await client.query(
        bookingQueries.updateCancelStatusQuery,
        ["cancel", user_notification_id]
      );
      return res
        .status(200)
        .json({ message: "Cancel status updated to cancel" });
    } else {
      return res
        .status(400)
        .json({ error: "Cannot update status as it is already timeup" });
    }
  } catch (error) {
    console.error("Error updating cancel status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  acceptRequest,
  rejectRequest,
  cancelRequest,
};
