const { getMessaging } = require("firebase-admin/messaging");
const client = require("../../../../connection.js");
const workerQueries = require("../../../database/queries/worker.queries");

// Worker Service Status Functions
// Handles service status updates and notifications

/**
 * Update worker's working status and notify user via FCM
 * @route POST /api/worker/status/update
 */
const workerWorkingStatusUpdated = async (req, res) => {
  const { serviceName, statusKey, currentTime, decodedId } = req.body;

  try {
    // Update the accepted table's service_status column and return only necessary fields.
    const query = workerQueries.updateServiceStatusTemplate(statusKey);
    const values = [serviceName, currentTime, decodedId];
    const { rows } = await client.query(query, values);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Record not found or update failed." });
    }

    // Extract FCM tokens from the result (if multiple rows, there might be duplicates)
    const tokens = rows.map((row) => row.fcm_token);

    // Prepare the multicast message payload with a data payload.
    const multicastMessage = {
      tokens,
      data: {
        status: currentTime.toString(),
        statusKey,
        message: "Status updated",
      },
      android: {
        priority: "high",
      },
      apns: {
        payload: {
          aps: {
            contentAvailable: true,
          },
        },
      },
    };

    // Send notifications using sendEachForMulticast
    try {
      const fcmResponse = await getMessaging().sendEachForMulticast(
        multicastMessage
      );
      fcmResponse.responses.forEach((resp, index) => {
        if (!resp.success) {
          console.error(
            `Error sending message to token ${tokens[index]}:`,
            resp.error
          );
        }
      });

      return res.status(200).json({
        message: "Service status updated successfully and FCM message sent.",
        data: rows[0],
        fcmResponse,
      });
    } catch (fcmError) {
      console.error("Error sending notifications:", fcmError);
      return res
        .status(500)
        .json({ message: "Internal server error", error: fcmError });
    }
  } catch (error) {
    console.error("Error updating service status:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

module.exports = {
  workerWorkingStatusUpdated,
};
