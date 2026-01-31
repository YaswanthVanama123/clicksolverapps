const client = require("../../../database/connection");
const {
  getDashboardDetailsQuery,
  getDashboardDetailsDateRangeQuery,
  getAdministratorDetailsQuery,
  getAdministratorDetailsDateRangeQuery,
} = require("../../../database/queries/admin.queries.js");

/**
 * Admin Dashboard Controller
 * Handles dashboard analytics and statistics
 */

/**
 * Get dashboard details for admin panel
 * Returns statistics based on date or date range
 */
const getDashboardDetails = async (req, res) => {
  try {
    const { date, startDate, endDate } = req.body;

    // Prepare the query and values based on the input
    let query;
    const values = [];

    if (date) {
      // Single date condition
      query = getDashboardDetailsQuery;
      values.push(date);
    } else if (startDate && endDate) {
      // Date range condition
      query = getDashboardDetailsDateRangeQuery;
      values.push(startDate, endDate);
    } else {
      return res.status(400).json({
        error:
          "Please provide either 'date' or both 'startDate' and 'endDate'.",
      });
    }

    const result = await client.query(query, values);

    // Return results as JSON response
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching dashboard details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Get administrator details with comprehensive statistics
 * Returns detailed analytics for admin panel
 */
const administratorDetails = async (req, res) => {
  try {
    const { date, startDate, endDate } = req.body;
    console.log("Received payload:", req.body); // Debugging log

    // Prepare query and parameters
    let query;
    let queryParams = [];

    if (date) {
      // Single date condition
      query = getAdministratorDetailsQuery;
      queryParams = [date, date, date, date];
    } else if (startDate && endDate) {
      // Date range condition
      query = getAdministratorDetailsDateRangeQuery;
      queryParams = [startDate, endDate, startDate, endDate, startDate, endDate];
    } else {
      // No filter - use single date query with a default condition that matches all
      return res.status(400).json({
        error: "Please provide either 'date' or both 'startDate' and 'endDate'.",
      });
    }

    // Execute Query Securely
    const result = await client.query(query, queryParams);

    res.status(200).json({
      success: true,
      message: "Administrator details fetched successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching administrator details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardDetails,
  administratorDetails,
};
