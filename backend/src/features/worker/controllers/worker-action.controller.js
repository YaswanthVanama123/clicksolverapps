const client = require("../../../../connection.js");
const workerQueries = require("../../../database/queries/worker.queries");

// Action and Tracking Functions

const createWorkerAction = async (req, res) => {
  const workerId = req.worker.id; // Assuming req.user contains the authenticated user's information
  const { encodedId, screen } = req.body;

  try {
    // Create the params object and convert it to JSON string
    const params = JSON.stringify({ encodedId });

    // Execute the query with the provided parameters
    const result = await client.query(workerQueries.createWorkerAction, [
      workerId,
      screen,
      params,
    ]);

    // The result should contain the updated or inserted row
    const userAction = result.rows[0];

    // Respond with the user action data
    res.json(userAction);
  } catch (error) {
    console.error("Error inserting user action:", error);
    res.status(500).json({ message: "Error inserting user action" });
  }
};

const getWorkerTrackRoute = async (req, res) => {
  const id = req.worker.id;
  try {
    // Query to select route and parameters based on user_id
    const result = await client.query(workerQueries.getWorkerTrackRoute, [id]);

    if (result.rows.length > 0) {
      const route = result.rows[0].screen_name;
      const parameter = result.rows[0].params;
      const name = result.rows[0].name;
      const no_due = result.rows[0].no_due;
      res.status(200).json({ route, parameter, name, no_due });
    } else {
      res
        .status(200)
        .json({ error: "No action found for the specified worker_id" });
    }
  } catch (err) {
    console.error(`Error fetching user with ID ${id}:`, err);
    throw err;
  }
};

const workerScreenChange = async (req, res) => {
  try {
    let { worker_id, params, screen } = req.body;
    console.log("req.body is", req.body);

    // If params is a string, parse it into JSON.
    if (typeof params === "string") {
      try {
        params = JSON.parse(params);
      } catch (parseError) {
        console.warn("Failed to parse params string:", params);
        return res.status(400).json({
          success: false,
          message:
            "Params should be a valid JSON object or a stringified JSON object.",
        });
      }
    }

    // Validate params and check for encodedId.
    if (!params || typeof params !== "object" || !params.encodedId) {
      console.warn("Invalid params structure:", params);
      return res.status(400).json({
        success: false,
        message:
          "Invalid params format. Expected { encodedId: <Base64String> }",
      });
    }

    // Use the provided encodedId.
    const encodedId = params.encodedId;

    // Execute the query
    const result = await client.query(workerQueries.workerScreenChange, [
      worker_id,
      screen,
      encodedId,
    ]);

    console.log("rows", result.rows);

    return res.status(200).json({
      success: true,
      message: "Worker screen updated successfully",
      data: result.rows,
    });
  } catch (error) {
    console.error("Error updating worker screen:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createWorkerAction,
  getWorkerTrackRoute,
  workerScreenChange,
};
