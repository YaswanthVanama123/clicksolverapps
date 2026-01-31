const axios = require("axios");

/**
 * TRACKING ROUTE CONTROLLER
 * Handles Ola Maps API integration for route calculations
 *
 * Functions:
 * - getRoute: Get route between two points using Ola Maps API
 */

/**
 * Get route between two points using Ola Maps API
 * @route POST /route
 * @param {Array} startPoint - [lng, lat]
 * @param {Array} endPoint - [lng, lat]
 */
const getRoute = async (req, res) => {
  try {
    // Expect payload:
    // { startPoint: [lng, lat], endPoint: [lng, lat] }
    const { startPoint, endPoint } = req.body;
    console.log("Request body:", req.body);

    if (
      !startPoint ||
      !endPoint ||
      !Array.isArray(startPoint) ||
      !Array.isArray(endPoint) ||
      startPoint.length !== 2 ||
      endPoint.length !== 2
    ) {
      return res.status(400).json({
        error:
          "Missing or invalid parameters: startPoint and endPoint are required as arrays [lng, lat].",
      });
    }

    // Destructure values from the arrays.
    const [startLng, startLat] = startPoint;
    const [endLng, endLat] = endPoint;

    // Ola Maps API key
    const apiKey =
      process.env.OLA_API_KEY || "q0k6sOfYNxdt3bGvqF6W1yvANHeVtrsu9T5KW9a4";
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "API key not configured on server" });
    }

    // Format URL for Ola Maps Directions API.
    // Note that the API expects origin/destination as lat,lng pairs.
    const url = `https://api.olamaps.io/routing/v1/directions?origin=${startLat},${startLng}&destination=${endLat},${endLng}&api_key=${apiKey}`;

    // Use POST method and include required headers:
    const response = await axios.post(url, null, {
      headers: {
        "X-Request-Id": `req-${Date.now()}`,
        Origin: "https://clicksolver.com", // Replace with your actual domain
      },
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error(
      "Error fetching route:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: error.toString() });
  }
};

module.exports = {
  getRoute,
};
