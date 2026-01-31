const express = require("express");
const router = express.Router();

const {
  checkStatus,
  checkTaskStatus,
  checkCancellationStatus,
} = require("../controllers/index.js");

const { userCancellationStatus } = require("../../user/controllers");
const { workerCancellationStatus } = require("../../worker/controllers");

// GET /checking/status - Check if a notification exists
router.get("/checking/status", checkStatus);

// POST /task/confirm/status - Check task status
router.post("/task/confirm/status", checkTaskStatus);

// GET /cancelation/navigation/status - Get cancellation navigation status
router.get("/cancelation/navigation/status", checkCancellationStatus);

// POST /cancelation/navigation/status - Update cancellation navigation status
router.post("/cancelation/navigation/status", async (req, res) => {
  const { notification_id } = req.body;
  try {
    const pool = require("../../../database/connection");
    await pool.query(
      "UPDATE notifications SET navigation_status = 'cancel' WHERE notification_id = $1",
      [notification_id]
    );
    res.json({ message: "Navigation status updated to cancel" });
  } catch (error) {
    console.error("Error updating cancellation status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /user/cancelled/status - Get user cancellation status
router.get("/user/cancelled/status", userCancellationStatus);

// GET /worker/cancelled/status - Get worker cancellation status
router.get("/worker/cancelled/status", workerCancellationStatus);

module.exports = router;
