const admin = require("../../../config/firebase.config.js");
const { getMessaging } = require("firebase-admin/messaging");
const db = admin.firestore();
const { updateWorkerAction, sendFCMNotification } = require("./service.helpers.js");
const {
  insertServiceTracking: insertServiceTrackingQuery,
  getWorkerTrackingServices: getWorkerTrackingServicesQuery,
  getUserTrackingServices: getUserTrackingServicesQuery,
  getAllTrackingServices: getAllTrackingServicesQuery,
  getServiceTrackingWorkerItemDetails: getServiceTrackingWorkerItemDetailsQuery,
  getServiceTrackingUserItemDetails: getServiceTrackingUserItemDetailsQuery,
  updateServiceTrackingStatus: updateServiceTrackingStatusQuery,
  verifyServiceDeliveryOTP: verifyServiceDeliveryOTPQuery,
} = require("../../../database/queries/service.queries");

// Main functions
const insertTracking = async (req, res) => {
  try {
    const { notification_id, details } = req.body;

    // Generate a 4-digit random number for tracking_pin
    const trackingPin = Math.floor(1000 + Math.random() * 9000);

    // Generate a tracking_key: #cs followed by 13 random digits
    const trackingKey = `#cs${Math.floor(
      1000000000000 + Math.random() * 9000000000000
    )}`;

    // Set service_status as "Commander collected the service item"
    const serviceStatus = "Collected Item";

    const result = await insertServiceTrackingQuery(
      notification_id,
      trackingPin,
      trackingKey,
      serviceStatus,
      details
    );

    if (result.length === 0) {
      return res.status(400).json({
        message: "Tracking for this notification_id already exists.",
      });
    }

    const { user_id, service_booked, worker_id } = result[0];
    const screen = "";
    const encodedId = Buffer.from(notification_id.toString()).toString(
      "base64"
    );

    await createUserBackgroundAction(
      user_id,
      encodedId,
      screen,
      service_booked
    );
    await updateWorkerAction(worker_id, encodedId, screen);

    const fcmTokens = result
      .map((row) => row.fcm_tokens)
      .flat()
      .filter((token) => token);

    if (fcmTokens.length > 0) {
      try {
        await sendFCMNotification(
          fcmTokens,
          {
            title: "Click Solver",
            body: `Commander collected your Item to repair in his location.`,
          },
          {
            screen: "Home",
          }
        );
      } catch (error) {
        console.error("Error sending notifications:", error);
      }
    } else {
      console.error("No FCM tokens to send the message to.");
    }

    res.status(201).json({
      message: "Tracking inserted successfully",
      data: result[0],
    });
  } catch (error) {
    console.error("Error inserting tracking: ", error);
    res
      .status(500)
      .json({ message: "Failed to insert tracking", error: error.message });
  }
}

const getWorkerTrackingServices = async (req, res) => {
  try {
    const workerId = req.worker.id;

    // Use query layer to fetch worker tracking services
    const result = await getWorkerTrackingServicesQuery(workerId);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching worker tracking services: ", error);
    res.status(500).json({
      message: "Failed to fetch worker tracking services",
      error: error.message,
    });
  }
}

const getUserTrackingServices = async (req, res) => {
  try {
    const userId = req.user.id;

    // Use query layer to fetch user tracking services
    const result = await getUserTrackingServicesQuery(userId);

    if (result.length === 0) {
      return res.status(205).json({
        message: "No tracking services found for the given notification ID",
      });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching worker tracking services: ", error);
    res.status(500).json({
      message: "Failed to fetch worker tracking services",
      error: error.message,
    });
  }
}

const getAllTrackingServices = async (req, res) => {
  try {
    console.log("Hi");
    // Use query layer to fetch all tracking services
    const result = await getAllTrackingServicesQuery();

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching worker tracking services: ", error);
    res.status(500).json({
      message: "Failed to fetch worker tracking services",
      error: error.message,
    });
  }
}

const getServiceTrackingWorkerItemDetails = async (req, res) => {
  try {
    const { tracking_id } = req.body;
    console.log(tracking_id);

    if (!tracking_id) {
      return res.status(400).json({ message: "Tracking ID is required" });
    }

    const result = await getServiceTrackingWorkerItemDetailsQuery(tracking_id);

    if (result.length === 0) {
      return res.status(404).json({
        message: "No service tracking details found for the given tracking ID",
      });
    }

    const { service_booked } = result[0];

    if (!Array.isArray(service_booked)) {
      return res
        .status(400)
        .json({ message: "Invalid service_booked data format" });
    }

    return res.status(200).json({ data: result[0] });
  } catch (error) {
    console.error(
      `Error fetching details for tracking_id ${req.body.tracking_id}:`,
      error
    );
    return res.status(500).json({
      message: "Failed to fetch service tracking worker item details",
      error: error.message,
    });
  }
}

const getServiceTrackingUserItemDetails = async (req, res) => {
  try {
    const { tracking_id } = req.body;
    // console.log(tracking_id)

    const result = await getServiceTrackingUserItemDetailsQuery(tracking_id);

    // console.log("data",result[0])

    if (result.length === 0) {
      return res.status(404).json({
        message: "No service tracking details found for the given accepted ID",
      });
    }

    console.log("data", result[0]);
    res.status(200).json({ data: result[0] });
  } catch (error) {
    console.error(
      "Error fetching service tracking worker item details: ",
      error
    );
    res.status(500).json({
      message: "Failed to fetch service tracking worker item details",
      error: error.message,
    });
  }
}

const serviceTrackingUpdateStatus = async (req, res) => {
  const { tracking_id, newStatus } = req.body;

  try {
    // Validate required fields.
    if (!tracking_id || !newStatus) {
      return res
        .status(400)
        .json({ message: "tracking_id and newStatus are required." });
    }

    const rows = await updateServiceTrackingStatusQuery(newStatus, tracking_id);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Service tracking not found." });
    }

    // Extract FCM tokens from the returned rows.
    const tokens = rows.map((row) => row.fcm_token);

    // Prepare the multicast message payload.
    const multicastMessage = {
      tokens,
      data: {
        status: newStatus.toString(),
        message: "Service status updated.",
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

    // Send notifications using sendEachForMulticast.
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
    return res.status(500).json({ message: "Internal Server Error." });
  }
}

const serviceDeliveryVerification = async (req, res) => {
  const { trackingId, enteredOtp } = req.body;

  if (!trackingId || !enteredOtp) {
    return res
      .status(400)
      .json({ message: "Tracking ID and OTP are required" });
  }

  try {
    const result = await verifyServiceDeliveryOTPQuery(trackingId, enteredOtp);

    if (result.length === 0) {
      return res.status(404).json({ message: "Tracking ID not found" });
    }

    const { notification_id, otp_verified } = result[0];

    if (otp_verified) {
      const encodedId = Buffer.from(notification_id.toString()).toString(
        "base64"
      );
      return res.status(200).json({
        message: "OTP verified successfully",
        encodedId,
      });
    } else {
      return res.status(400).json({ message: "Invalid OTP" });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ message: "Server error" });
  }
}


module.exports = {
  insertTracking,
  getWorkerTrackingServices,
  getUserTrackingServices,
  getAllTrackingServices,
  getServiceTrackingWorkerItemDetails,
  getServiceTrackingUserItemDetails,
  serviceTrackingUpdateStatus,
  serviceDeliveryVerification
};
