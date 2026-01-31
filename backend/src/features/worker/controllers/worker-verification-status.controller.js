// ============================================================================
// WORKER VERIFICATION STATUS CONTROLLER
// ============================================================================
// Handles worker verification status checks for service bookings
// ============================================================================

const client = require("../../../database/connection");

/**
 * Get verification status for a worker based on notification ID
 * Checks if the worker has been verified for a specific service booking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getVerificationStatus = async (req, res) => {
  const { notification_id } = req.query;

  if (!notification_id) {
    return res.status(400).json({ error: "Notification ID is required" });
  }

  try {
    const result = await client.query(
      "SELECT verification_status FROM accepted WHERE notification_id = $1",
      [notification_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notification ID not found" });
    }

    const verificationStatus = result.rows[0].verification_status;
    res.json(verificationStatus);
  } catch (error) {
    console.error("Error checking verification status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  getVerificationStatus,
};
