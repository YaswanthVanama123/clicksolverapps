const admin = require("../../../config/firebase.config.js");
const { getMessaging } = require("firebase-admin/messaging");
const db = admin.firestore();
const client = require("../../../../connection.js");
const {
  insertUserNotificationAndFindWorkersQuery,
  insertNotificationsAndGetFcmTokensQuery,
  updateOfferStatusQuery,
} = require("../../../database/queries/worker.queries.js");

// Worker Discovery Functions

/**
 * Calculates the Haversine distance between two geographic points
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth's radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

/**
 * Fetches worker locations from Firestore
 * @param {Array<number>} worker_ids - Array of worker IDs to fetch locations for
 * @returns {Array<Object>} Array of worker location data
 */
const getAllLocations = async (worker_ids) => {
  try {
    const snapshot = await db
      .collection("workerLocations")
      .where("worker_id", "in", worker_ids)
      .get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.error("Error fetching locations from Firestore:", error);
    return [];
  }
};

/**
 * Generates a random 4-digit PIN
 * @returns {string} 4-digit PIN as string
 */
const generatePin = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Returns current date in locale format
 * @returns {string} Formatted date
 */
const formattedDate = () => {
  const now = new Date();
  return now.toLocaleDateString();
};

/**
 * Returns current time in locale format
 * @returns {string} Formatted time
 */
const formattedTime = () => {
  const now = new Date();
  return now.toLocaleTimeString();
};

/**
 * Returns current timestamp in PostgreSQL format
 * @returns {string} Timestamp in YYYY-MM-DD HH:MM:SS format
 */
const getCurrentTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Finds nearby workers for a service request
 *
 * This function:
 * 1. Inserts a user notification with service request details
 * 2. Finds workers with matching subservices (no_due = TRUE)
 * 3. Filters workers within 2km radius using Firestore locations
 * 4. Inserts notifications for nearby workers
 * 5. Updates offer status if applicable
 * 6. Sends FCM notifications to nearby workers
 *
 * @requires req.user.id - Authenticated user ID
 * @requires req.body.area - Service location area
 * @requires req.body.pincode - Service location pincode
 * @requires req.body.city - Service location city
 * @requires req.body.serviceBooked - Array of {serviceName, cost}
 * @requires req.body.discount - Discount amount
 * @requires req.body.tipAmount - Tip amount
 */
const getWorkersNearby = async (req, res) => {
  try {
    // ------------------------------------------------------------------
    //  1) Extract request data
    // ------------------------------------------------------------------
    const user_id = req.user.id;
    const {
      area,
      pincode,
      city,
      alternateName,
      alternatePhoneNumber,
      serviceBooked,
      discount,
      tipAmount,
      offer,
    } = req.body;

    console.log("req.body", req.body);

    const created_at = getCurrentTimestamp();
    const serviceArray = JSON.stringify(serviceBooked);
    const serviceNames = serviceBooked.map((s) => s.serviceName);
    const totalCost =
      serviceBooked.reduce((acc, s) => acc + s.cost, 0) - discount + tipAmount;

    // ------------------------------------------------------------------
    //  2) Postgres Query #1: Insert userNotifications, find matching workers
    // ------------------------------------------------------------------
    const query1Params = [
      user_id,
      created_at,
      area,
      pincode,
      city,
      alternateName,
      alternatePhoneNumber,
      serviceArray,
      serviceNames,
    ];

    const result1 = await client.query(
      insertUserNotificationAndFindWorkersQuery,
      query1Params
    );
    if (result1.rows.length === 0) {
      return res
        .status(404)
        .json("No user found or no worker matches subservices");
    }

    const { user_notification_id, worker_ids, user_lat, user_lon } =
      result1.rows[0];

    if (!user_notification_id) {
      return res.status(404).json("Failed to insert user notification");
    }
    if (!worker_ids || worker_ids.length === 0) {
      return res.status(200).json("No workers match the requested subservices");
    }

    // ------------------------------------------------------------------
    //  3) Firestore: Get worker locations once, filter by 2km radius
    // ------------------------------------------------------------------
    const workerDb = await getAllLocations(worker_ids);
    if (!workerDb || workerDb.length === 0) {
      return res
        .status(200)
        .json("No Firestore location data for these workers");
    }

    const MAX_DISTANCE = 2; // 2km
    const nearbyWorkers = [];
    for (const doc of workerDb) {
      const dist = haversineDistance(
        user_lat,
        user_lon,
        doc.location._latitude,
        doc.location._longitude
      );
      if (dist <= MAX_DISTANCE) {
        nearbyWorkers.push(doc.worker_id);
      }
    }

    if (nearbyWorkers.length === 0) {
      return res.status(200).json("No workers found within 2 km radius");
    }

    // ------------------------------------------------------------------
    //  4) Postgres Query #2: Insert notifications & retrieve FCM tokens
    // ------------------------------------------------------------------
    const pin = generatePin();
    const query2Params = [
      user_notification_id,
      user_id,
      user_lon,
      user_lat,
      created_at,
      pin,
      serviceArray,
      nearbyWorkers,
      discount,
      totalCost,
      tipAmount,
      offer,
    ];

    const result2 = await client.query(
      insertNotificationsAndGetFcmTokensQuery,
      query2Params
    );
    const tokens = result2.rows[0].tokens || [];

    // ------------------------------------------------------------------
    //  5) If Offer Provided, Update "offers_used" with 'status: applied'
    // ------------------------------------------------------------------
    if (offer) {
      const offerCodeValue = offer.offer_code;
      await client.query(updateOfferStatusQuery, [offerCodeValue, user_id]);
    }

    // ------------------------------------------------------------------
    //  6) Send FCM notifications (if tokens exist)
    // ------------------------------------------------------------------
    const encodedUserNotificationId = Buffer.from(
      user_notification_id.toString()
    ).toString("base64");

    if (tokens.length > 0) {
      const normalNotificationMessage = {
        tokens,
        notification: {
          title: "🔔 ClickSolver Has a Job for You!",
          body: "💼 A user needs help! Accept now to support your ClickSolver family. 🤝",
        },
        data: {
          user_notification_id: encodedUserNotificationId,
          service: serviceArray,
          location: `${area}, ${city}, ${pincode}`,
          click_action: "FLUTTER_NOTIFICATION_CLICK",
          cost: totalCost.toString(),
          targetUrl: `/acceptance/${encodedUserNotificationId}`,
          screen: "Acceptance",
          date: formattedDate(),
          time: formattedTime(),
          type: "normal",
        },
        android: { priority: "high" },
      };

      try {
        const fcmResponse = await getMessaging().sendEachForMulticast(
          normalNotificationMessage
        );

        let successCount = 0;
        let failureCount = 0;
        fcmResponse.responses.forEach((resp, idx) => {
          if (resp.success) {
            successCount++;
          } else {
            failureCount++;
            console.error(
              `❌ Error sending to token ${tokens[idx]}:`,
              resp.error
            );
          }
        });
        console.log(
          `FCM Summary: ${successCount} success, ${failureCount} failures.`
        );
      } catch (err) {
        console.error("❌ Error sending FCM notifications:", err);
      }
    }

    // ------------------------------------------------------------------
    //  7) Return to Client
    // ------------------------------------------------------------------
    return res.status(200).json(encodedUserNotificationId);
  } catch (error) {
    console.error("Error in getWorkersNearby:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getWorkersNearby,
};
