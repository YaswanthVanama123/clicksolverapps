// ============================================================================
// USER FEEDBACK CONTROLLER
// ============================================================================
// Handles user feedback submission and rating management for workers
// ============================================================================

const client = require("../../../database/connection");

/**
 * Submit user feedback and rating for a completed service
 * Updates worker's rating count and average rating
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const submitFeedback = async (req, res) => {
  try {
    // Convert and validate inputs
    const rawNotificationId = req.body.notification_id;
    const rawRating = req.body.rating;
    const rawUserId = req.user.id;

    // Convert to numbers and check for validity
    const notification_id = parseInt(rawNotificationId, 10);
    const rating = parseInt(rawRating, 10);
    const user_id = parseInt(rawUserId, 10);

    if (isNaN(notification_id) || isNaN(rating) || isNaN(user_id)) {
      return res.status(400).json({
        message: "Notification ID, rating, and user ID must be valid numbers.",
      });
    }

    // Using CTE to insert feedback and update worker's ratings count & average rating
    const query = `
      WITH inserted_feedback AS (
        INSERT INTO feedback (notification_id, rating, comment, user_id, worker_id, name)
        VALUES (
          $1,
          $2,
          $3,
          $4,
          (SELECT worker_id FROM completenotifications WHERE notification_id = $1),
          (SELECT name FROM "user" WHERE user_id = $4)
        )
        RETURNING worker_id, rating
      ),
      updated_worker AS (
        UPDATE workerlife
        SET
          ratings_count = ratings_count + 1,
          average_rating = ((average_rating::numeric * ratings_count) + (SELECT rating::numeric FROM inserted_feedback)) / (ratings_count + 1)
        WHERE worker_id = (SELECT worker_id FROM inserted_feedback)
        RETURNING worker_id, ratings_count, average_rating
      )
      SELECT * FROM updated_worker;
    `;

    const values = [notification_id, rating, req.body.comment || null, user_id];
    const result = await client.query(query, values);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Worker ID not found or update failed." });
    }

    res.status(201).json({
      message: "Feedback submitted and rating updated successfully.",
      feedback: {
        worker_id: result.rows[0].worker_id,
        ratings_count: result.rows[0].ratings_count,
        average_rating: Number(result.rows[0].average_rating).toFixed(2),
      },
    });
  } catch (error) {
    // If duplicate key error occurs, send a conflict response.
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Feedback already submitted for this notification.",
      });
    }
    console.error("Error submitting feedback:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  submitFeedback,
};
