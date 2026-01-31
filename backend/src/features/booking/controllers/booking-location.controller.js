const admin = require("../../../config/firebase.config.js");
const db = admin.firestore();
const client = require("../../../database/connection");
const bookingQueries = require("../../../database/queries/booking.queries.js");

// Helper function - getWorkerLocation
const getWorkerLocation = async (workerId) => {
  try {
    if (!workerId) {
      return [];
    }

    const locationsRef = db.collection("locations");
    const query = locationsRef.where("worker_id", "==", workerId);

    const snapshot = await query.get();

    if (snapshot.empty) {
      return [];
    }

    let locations = [];
    snapshot.forEach((doc) => {
      locations.push({ id: doc.id, ...doc.data() });
    });
    // console.log(locations);
    return locations;
  } catch (error) {
    console.error("Error getting location:", error);
    return [];
  }
};

// Helper function - getAllLocations
const getAllLocations = async (workerIds) => {
  try {
    if (workerIds.length < 1) {
      return [];
    }
    const locationsRef = db.collection("locations");

    // Create a query to filter documents where workerId is in the workerIds array
    const query = locationsRef.where("worker_id", "in", workerIds);

    const snapshot = await query.get();

    if (snapshot.empty) {
      return [];
    }

    let locations = [];
    snapshot.forEach((doc) => {
      locations.push({ id: doc.id, ...doc.data() });
    });
    // console.log(locations)
    return locations;
  } catch (error) {
    console.error("Error getting locations:", error);
    return [];
  }
};

// Helper for interval tracking
const intervalSetForNotifications = new Set();

// Helper function - updateNavigationStatus
const updateNavigationStatus = async (notification_id) => {
  try {
    const result = await client.query(
      bookingQueries.updateNavigationStatusQuery,
      [notification_id]
    );
  } catch (error) {
    console.error("Error updating navigation status to timeup:", error);
    throw error; // Throw the error to handle it in calling functions
  }
};

// Location and Navigation Functions

const getUserAndWorkerLocation = async (req, res) => {
  const { notification_id } = req.body;

  try {
    // Step 1: Get user longitude, latitude, and worker_id from accepted table using notification_id
    const query = bookingQueries.getUserAndWorkerLocationQuery;
    const result = await client.query(query, [notification_id]);

    // Check if the notification exists in the table
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const {
      longitude: userLongitude,
      latitude: userLatitude,
      worker_id,
    } = result.rows[0];

    // Step 2: Query Firestore for the worker's location by worker_id
    const workerLocationSnapshot = await db
      .collection("locations")
      .where("worker_id", "==", worker_id)
      .limit(1)
      .get();

    // Check if the worker's location was found
    if (workerLocationSnapshot.empty) {
      return res
        .status(404)
        .json({ message: "Worker location not found in Firestore" });
    }

    // Assuming only one document is returned (matching worker_id)
    const workerLocationData = workerLocationSnapshot.docs[0].data();

    // Extract the GeoPoint object from the worker's location data
    const workerLocationGeoPoint = workerLocationData.location;
    if (
      !workerLocationGeoPoint ||
      !workerLocationGeoPoint.latitude ||
      !workerLocationGeoPoint.longitude
    ) {
      return res
        .status(500)
        .json({ message: "Worker GeoPoint data is missing or incomplete" });
    }

    const workerLongitude = workerLocationGeoPoint.longitude;
    const workerLatitude = workerLocationGeoPoint.latitude;

    // Step 3: Return both user and worker locations as arrays
    return res.status(200).json({
      endPoint: [Number(userLongitude), Number(userLatitude)], // User's location
      startPoint: [workerLongitude, workerLatitude], // Worker's location
    });
  } catch (error) {
    console.error("Error fetching locations:", error.message);
    return res
      .status(500)
      .json({ message: "Error fetching locations", error: error.message });
  }
};

const getLocationDetails = async (req, res) => {
  try {
    const { notification_id } = req.query;

    if (!notification_id) {
      return res.status(400).json({ error: "Missing notification_id" });
    }

    const locationDetails = await fetchLocationDetails(notification_id);
    res.json(locationDetails);

    // Start the interval to update the navigation status to timeup after 4 minutes
    if (notification_id && !intervalSetForNotifications.has(notification_id)) {
      intervalSetForNotifications.add(notification_id);
      setTimeout(() => updateNavigationStatus(notification_id), 4 * 60 * 1000);
    }
  } catch (err) {
    console.error("Error fetching location details:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Function to fetch location details from the database
const fetchLocationDetails = async (notificationId) => {
  console.log(notificationId);
  try {
    // Query to get the start and endpoint details using a JOIN between accepted and workerlocation tables
    const query = bookingQueries.getWorkerLocationFromAcceptedQuery;

    const result = await client.query(query, [notificationId]);

    if (result.rows.length === 0) {
      throw new Error("Notification or Worker location not found");
    }

    const { end_longitude, end_latitude, worker_id } = result.rows[0];

    const location = await getWorkerLocation(worker_id);
    let start_latitude = null;
    let start_longitude = null;
    location.forEach((locationData) => {
      const {
        location: { _latitude: latitude, _longitude: longitude },
      } = locationData;
      start_longitude = longitude;
      start_latitude = latitude;
    });

    // console.log("worker", location);

    // Return the start and end points
    return {
      startPoint: [start_latitude, start_longitude],
      endPoint: [end_latitude, end_longitude],
    };
  } catch (err) {
    console.error("Error fetching location details:", err);
    throw err;
  }
};

const updateUserNavigationStatus = async (notification_id) => {
  try {
    await client.query(
      bookingQueries.updateUserNavigationStatusQuery,
      [notification_id]
    );
  } catch (error) {
    console.error("Error updating user navigation status to timeup:", error);
  }
};

module.exports = {
  getUserAndWorkerLocation,
  getLocationDetails,
  fetchLocationDetails,
  updateUserNavigationStatus,
  getAllLocations,
};
