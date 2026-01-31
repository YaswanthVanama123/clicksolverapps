const { getMessaging } = require("firebase-admin/messaging");
const client = require("../../../../connection.js");
const workerQueries = require("../../../database/queries/worker.queries");

// Booking and Service Functions

const getWorkerBookings = async (req, res) => {
  const workerId = req.worker.id;

  try {
    const { rows } = await client.query(workerQueries.getWorkerBookings, [workerId]);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching user bookings" });
  }
};

const getWorkerOngoingBookings = async (req, res) => {
  console.log("called id");
  const workerId = req.worker.id;

  try {
    const { rows } = await client.query(workerQueries.getWorkerOngoingBookings, [
      workerId,
    ]);
    console.log("=roes ", rows[0]);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching user bookings" });
  }
};

const currentService = async (req, res) => {
  const { worker_id } = req.query;

  // Validate input
  if (!worker_id) {
    return res.status(400).json({ error: "worker_id is required" });
  }

  try {
    // Query to fetch the current service details
    const { rows } = await client.query(workerQueries.getCurrentService, [worker_id]);

    // Check if any data is found
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No current service found for the worker" });
    }

    // Respond with the fetched data
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error fetching current service:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getWorkerServiceHistory = async (req, res) => {
  try {
    const { worker_id } = req.query; // Get worker_id from the request body
    console.log(worker_id);

    const values = [worker_id];
    const result = await client.query(workerQueries.getWorkerServiceHistory, values);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching WorkerServiceHistory:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const WorkerWorkInProgressDetails = async (req, res) => {
  const { decodedId } = req.body;
  console.log(decodedId);
  try {
    const result = await client.query(workerQueries.getWorkInProgressDetails, [
      decodedId,
    ]);

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

const workerLifeDetails = async (req, res) => {
  const workerId = req.worker.id;

  try {
    const result = await client.query(workerQueries.getWorkerLifeDetails, [workerId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Worker not found" });
    }

    const workerProfile = {
      profileDetails: result.rows,
      workerId,
    };

    // Since the average_rating is included in each row, you can take it from the first result.
    workerProfile.averageRating = result.rows[0].average_rating;

    return res.status(200).json(workerProfile);
  } catch (error) {
    console.error("Error getting worker life details:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updateWorkerLifeDetails = async (workerId, totalAmount) => {
  try {
    // Ensure totalAmount is an integer
    const integerAmount = Math.round(totalAmount); // Use Math.floor(totalAmount) to truncate instead

    const values = [integerAmount, workerId];
    const result = await client.query(workerQueries.updateWorkerLifeStats, values);

    if (result.rowCount === 0) {
      throw new Error("No worker found with the given worker_id");
    }

    return result.rows[0];
  } catch (error) {
    console.error("Error updating workerlife details:", error);
    throw new Error("Internal server error");
  }
};

const getWorkerDetails = async (req, res) => {
  const { notification_id } = req.body;
  try {
    const result = await client.query(workerQueries.getWorkerDetailsByNotification, [
      notification_id,
    ]);

    if (result.rows.length === 0) {
      return res.json({
        error: "No worker details found for the provided notification ID.",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching worker details:", error);
    return res.json({
      error: "An error occurred while fetching worker details.",
    });
  }
};

const workerDetails = async (req, res, notification_id) => {
  try {
    // Combine queries using JOIN
    const result = await client.query(workerQueries.getBasicWorkerDetails, [
      notification_id,
    ]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Notification or related data not found" });
    }

    const { worker_name, service } = result.rows[0];

    // Return the worker's name and service
    res.json({ name: worker_name, service });
  } catch (error) {
    console.error("Error checking worker details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getWorkerBookings,
  getWorkerOngoingBookings,
  currentService,
  getWorkerServiceHistory,
  WorkerWorkInProgressDetails,
  workerWorkingStatusUpdated,
  workerLifeDetails,
  updateWorkerLifeDetails,
  getWorkerDetails,
  workerDetails,
};
