/**
 * Service Database Queries
 * Contains comprehensive SQL queries for service operations including:
 * - Service catalog operations
 * - Service tracking
 * - Service timers
 * - Work completion
 * - Service relationships
 */

// ==================== SERVICE CATALOG QUERIES ====================

/**
 * Get service by ID
 * @param {number} id - Service ID
 */
const getServiceByIdQuery = `
  SELECT id, name, category_id, description, base_price, duration_minutes,
         rating, total_bookings, worker_id, status, image_url, created_at, updated_at
  FROM services
  WHERE id = $1 AND deleted_at IS NULL;
`;

/**
 * Get all services by category
 * @param {number} categoryId - Category ID
 * @param {number} limit - Limit
 * @param {number} offset - Offset
 */
const getServicesByCategoryQuery = `
  SELECT id, name, category_id, description, base_price, duration_minutes,
         rating, total_bookings, worker_id, status, image_url, created_at, updated_at
  FROM services
  WHERE category_id = $1 AND status = 'active' AND deleted_at IS NULL
  ORDER BY rating DESC, total_bookings DESC
  LIMIT $2 OFFSET $3;
`;

/**
 * Get service count by category
 * @param {number} categoryId - Category ID
 */
const getServiceCountByCategoryQuery = `
  SELECT COUNT(*) as total
  FROM services
  WHERE category_id = $1 AND status = 'active' AND deleted_at IS NULL;
`;

/**
 * Search services by name or description
 * @param {string} searchTerm - Search term
 * @param {number} limit - Limit
 * @param {number} offset - Offset
 */
const searchServicesQuery = `
  SELECT id, name, category_id, description, base_price, duration_minutes,
         rating, total_bookings, worker_id, status, image_url, created_at, updated_at
  FROM services
  WHERE (name ILIKE '%' || $1 || '%' OR description ILIKE '%' || $1 || '%')
    AND status = 'active' AND deleted_at IS NULL
  ORDER BY rating DESC, total_bookings DESC
  LIMIT $2 OFFSET $3;
`;

/**
 * Get services by worker ID
 * @param {number} workerId - Worker ID
 * @param {number} limit - Limit
 * @param {number} offset - Offset
 */
const getServicesByWorkerIdQuery = `
  SELECT id, name, category_id, description, base_price, duration_minutes,
         rating, total_bookings, worker_id, status, image_url, created_at, updated_at
  FROM services
  WHERE worker_id = $1 AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT $2 OFFSET $3;
`;

/**
 * Get active services with optional category filter
 * @param {number} categoryId - Optional category ID
 * @param {number} limit - Limit
 * @param {number} offset - Offset
 */
const getActiveServicesQuery = `
  SELECT id, name, category_id, description, base_price, duration_minutes,
         rating, total_bookings, worker_id, status, image_url, created_at, updated_at
  FROM services
  WHERE status = 'active' AND deleted_at IS NULL
    AND ($1::integer IS NULL OR category_id = $1)
  ORDER BY rating DESC, total_bookings DESC
  LIMIT $2 OFFSET $3;
`;

/**
 * Create a new service
 * @param {string} name, {number} categoryId, {string} description, {number} basePrice,
 *        {number} durationMinutes, {number} workerId, {string} status, {string} imageUrl
 */
const createServiceQuery = `
  INSERT INTO services (name, category_id, description, base_price, duration_minutes,
                       worker_id, status, image_url, rating, total_bookings, created_at, updated_at)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, name, category_id, description, base_price, duration_minutes,
            rating, total_bookings, worker_id, status, image_url, created_at, updated_at;
`;

/**
 * Update service details
 * @param {number} id, {string} name, {number} categoryId, {string} description,
 *        {number} basePrice, {number} durationMinutes, {string} status, {string} imageUrl
 */
const updateServiceQuery = `
  UPDATE services
  SET name = COALESCE($2, name),
      category_id = COALESCE($3, category_id),
      description = COALESCE($4, description),
      base_price = COALESCE($5, base_price),
      duration_minutes = COALESCE($6, duration_minutes),
      status = COALESCE($7, status),
      image_url = COALESCE($8, image_url),
      updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, name, category_id, description, base_price, duration_minutes,
            rating, total_bookings, worker_id, status, image_url, created_at, updated_at;
`;

/**
 * Update service rating
 * @param {number} id - Service ID
 * @param {number} newRating - New rating value
 */
const updateServiceRatingQuery = `
  UPDATE services
  SET rating = $2, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, rating, updated_at;
`;

/**
 * Increment service total bookings
 * @param {number} id - Service ID
 */
const incrementServiceBookingsQuery = `
  UPDATE services
  SET total_bookings = total_bookings + 1, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, total_bookings, updated_at;
`;

/**
 * Delete service (soft delete)
 * @param {number} id - Service ID
 */
const deleteServiceQuery = `
  UPDATE services
  SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id;
`;

// ==================== SERVICE TRACKING QUERIES ====================

/**
 * Insert service tracking record
 * @param {number} serviceId, {number} userId, {number} workerId, {string} status,
 *        {number} estimatedDuration, {string} location
 */
const insertServiceTrackingQuery = `
  INSERT INTO service_tracking (service_id, user_id, worker_id, status,
                                estimated_duration, location, started_at, created_at, updated_at)
  VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, service_id, user_id, worker_id, status, estimated_duration,
            location, started_at, created_at, updated_at;
`;

/**
 * Get service tracking by ID
 * @param {number} id - Tracking ID
 */
const getServiceTrackingByIdQuery = `
  SELECT id, service_id, user_id, worker_id, status, estimated_duration,
         location, started_at, completed_at, created_at, updated_at
  FROM service_tracking
  WHERE id = $1 AND deleted_at IS NULL;
`;

/**
 * Get service tracking by user ID
 * @param {number} userId - User ID
 * @param {number} limit - Limit
 * @param {number} offset - Offset
 */
const getServiceTrackingByUserIdQuery = `
  SELECT id, service_id, user_id, worker_id, status, estimated_duration,
         location, started_at, completed_at, created_at, updated_at
  FROM service_tracking
  WHERE user_id = $1 AND deleted_at IS NULL
  ORDER BY started_at DESC
  LIMIT $2 OFFSET $3;
`;

/**
 * Get service tracking by worker ID
 * @param {number} workerId - Worker ID
 * @param {number} limit - Limit
 * @param {number} offset - Offset
 */
const getServiceTrackingByWorkerIdQuery = `
  SELECT id, service_id, user_id, worker_id, status, estimated_duration,
         location, started_at, completed_at, created_at, updated_at
  FROM service_tracking
  WHERE worker_id = $1 AND deleted_at IS NULL
  ORDER BY started_at DESC
  LIMIT $2 OFFSET $3;
`;

/**
 * Get active service tracking records for user
 * @param {number} userId - User ID
 */
const getActiveServiceTrackingByUserQuery = `
  SELECT id, service_id, user_id, worker_id, status, estimated_duration,
         location, started_at, completed_at, created_at, updated_at
  FROM service_tracking
  WHERE user_id = $1 AND status IN ('active', 'in_progress') AND deleted_at IS NULL
  ORDER BY started_at DESC;
`;

/**
 * Get active service tracking records for worker
 * @param {number} workerId - Worker ID
 */
const getActiveServiceTrackingByWorkerQuery = `
  SELECT id, service_id, user_id, worker_id, status, estimated_duration,
         location, started_at, completed_at, created_at, updated_at
  FROM service_tracking
  WHERE worker_id = $1 AND status IN ('active', 'in_progress') AND deleted_at IS NULL
  ORDER BY started_at DESC;
`;

/**
 * Update service tracking status
 * @param {number} id - Tracking ID
 * @param {string} status - New status
 */
const updateServiceTrackingStatusQuery = `
  UPDATE service_tracking
  SET status = $2, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, service_id, user_id, worker_id, status, estimated_duration,
            location, started_at, completed_at, created_at, updated_at;
`;

/**
 * Update service tracking with completion time
 * @param {number} id - Tracking ID
 * @param {string} status - New status
 */
const completeServiceTrackingQuery = `
  UPDATE service_tracking
  SET status = $2, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, service_id, user_id, worker_id, status, estimated_duration,
            location, started_at, completed_at, created_at, updated_at;
`;

/**
 * Delete service tracking (soft delete)
 * @param {number} id - Tracking ID
 */
const deleteServiceTrackingQuery = `
  UPDATE service_tracking
  SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id;
`;

// ==================== SERVICE TIMER QUERIES ====================

/**
 * Insert or get service timer
 * @param {number} trackingId - Service tracking ID
 * @param {number} elapsedSeconds - Elapsed seconds
 */
const insertServiceTimerQuery = `
  INSERT INTO service_timer (tracking_id, elapsed_seconds, is_running, started_at, created_at, updated_at)
  VALUES ($1, $2, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, tracking_id, elapsed_seconds, is_running, started_at, paused_at, created_at, updated_at;
`;

/**
 * Get service timer by tracking ID
 * @param {number} trackingId - Service tracking ID
 */
const getServiceTimerByTrackingIdQuery = `
  SELECT id, tracking_id, elapsed_seconds, is_running, started_at, paused_at, created_at, updated_at
  FROM service_timer
  WHERE tracking_id = $1 AND deleted_at IS NULL;
`;

/**
 * Get service timer by ID
 * @param {number} id - Timer ID
 */
const getServiceTimerByIdQuery = `
  SELECT id, tracking_id, elapsed_seconds, is_running, started_at, paused_at, created_at, updated_at
  FROM service_timer
  WHERE id = $1 AND deleted_at IS NULL;
`;

/**
 * Start service timer
 * @param {number} id - Timer ID
 */
const startServiceTimerQuery = `
  UPDATE service_timer
  SET is_running = true, started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, tracking_id, elapsed_seconds, is_running, started_at, paused_at, created_at, updated_at;
`;

/**
 * Pause service timer
 * @param {number} id - Timer ID
 * @param {number} elapsedSeconds - Elapsed seconds to add
 */
const pauseServiceTimerQuery = `
  UPDATE service_timer
  SET is_running = false,
      elapsed_seconds = elapsed_seconds + $2,
      paused_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, tracking_id, elapsed_seconds, is_running, started_at, paused_at, created_at, updated_at;
`;

/**
 * Stop and finalize service timer
 * @param {number} id - Timer ID
 * @param {number} elapsedSeconds - Final elapsed seconds
 */
const stopServiceTimerQuery = `
  UPDATE service_timer
  SET is_running = false,
      elapsed_seconds = $2,
      paused_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, tracking_id, elapsed_seconds, is_running, started_at, paused_at, created_at, updated_at;
`;

/**
 * Update timer elapsed seconds
 * @param {number} id - Timer ID
 * @param {number} elapsedSeconds - Elapsed seconds
 */
const updateTimerElapsedSecondsQuery = `
  UPDATE service_timer
  SET elapsed_seconds = $2, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, tracking_id, elapsed_seconds, is_running, started_at, paused_at, created_at, updated_at;
`;

/**
 * Delete service timer (soft delete)
 * @param {number} id - Timer ID
 */
const deleteServiceTimerQuery = `
  UPDATE service_timer
  SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id;
`;

// ==================== WORK COMPLETION QUERIES ====================

/**
 * Insert work completion record
 * @param {number} trackingId, {number} workerId, {string} status, {text} completionNotes,
 *        {number} actualDuration, {number} finalPrice
 */
const insertWorkCompletionQuery = `
  INSERT INTO work_completion (tracking_id, worker_id, status, completion_notes,
                               actual_duration, final_price, completed_at, created_at, updated_at)
  VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, tracking_id, worker_id, status, completion_notes, actual_duration,
            final_price, completed_at, created_at, updated_at;
`;

/**
 * Get work completion by ID
 * @param {number} id - Work completion ID
 */
const getWorkCompletionByIdQuery = `
  SELECT id, tracking_id, worker_id, status, completion_notes, actual_duration,
         final_price, completed_at, created_at, updated_at
  FROM work_completion
  WHERE id = $1 AND deleted_at IS NULL;
`;

/**
 * Get work completion by tracking ID
 * @param {number} trackingId - Tracking ID
 */
const getWorkCompletionByTrackingIdQuery = `
  SELECT id, tracking_id, worker_id, status, completion_notes, actual_duration,
         final_price, completed_at, created_at, updated_at
  FROM work_completion
  WHERE tracking_id = $1 AND deleted_at IS NULL;
`;

/**
 * Get work completions by worker ID
 * @param {number} workerId - Worker ID
 * @param {number} limit - Limit
 * @param {number} offset - Offset
 */
const getWorkCompletionsByWorkerIdQuery = `
  SELECT id, tracking_id, worker_id, status, completion_notes, actual_duration,
         final_price, completed_at, created_at, updated_at
  FROM work_completion
  WHERE worker_id = $1 AND deleted_at IS NULL
  ORDER BY completed_at DESC
  LIMIT $2 OFFSET $3;
`;

/**
 * Get pending work completion requests
 * @param {number} limit - Limit
 * @param {number} offset - Offset
 */
const getPendingWorkCompletionQuery = `
  SELECT id, tracking_id, worker_id, status, completion_notes, actual_duration,
         final_price, completed_at, created_at, updated_at
  FROM work_completion
  WHERE status = 'pending' AND deleted_at IS NULL
  ORDER BY created_at ASC
  LIMIT $1 OFFSET $2;
`;

/**
 * Update work completion status
 * @param {number} id - Work completion ID
 * @param {string} status - New status (approved, rejected, pending)
 */
const updateWorkCompletionStatusQuery = `
  UPDATE work_completion
  SET status = $2, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, tracking_id, worker_id, status, completion_notes, actual_duration,
            final_price, completed_at, created_at, updated_at;
`;

/**
 * Update work completion with approval details
 * @param {number} id - Work completion ID
 * @param {string} status - Status
 * @param {number} finalPrice - Final approved price
 */
const approveWorkCompletionQuery = `
  UPDATE work_completion
  SET status = $2, final_price = $3, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, tracking_id, worker_id, status, completion_notes, actual_duration,
            final_price, completed_at, created_at, updated_at;
`;

/**
 * Delete work completion (soft delete)
 * @param {number} id - Work completion ID
 */
const deleteWorkCompletionQuery = `
  UPDATE work_completion
  SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id;
`;

// ==================== SERVICE SUBSERVICES QUERIES ====================

/**
 * Get subservices by parent service ID
 * @param {number} parentServiceId - Parent service ID
 */
const getSubservicesByParentIdQuery = `
  SELECT id, parent_service_id, name, description, base_price, created_at, updated_at
  FROM service_subservices
  WHERE parent_service_id = $1 AND deleted_at IS NULL
  ORDER BY created_at ASC;
`;

/**
 * Get subservice by ID
 * @param {number} id - Subservice ID
 */
const getSubserviceByIdQuery = `
  SELECT id, parent_service_id, name, description, base_price, created_at, updated_at
  FROM service_subservices
  WHERE id = $1 AND deleted_at IS NULL;
`;

/**
 * Create subservice
 * @param {number} parentServiceId, {string} name, {string} description, {number} basePrice
 */
const createSubserviceQuery = `
  INSERT INTO service_subservices (parent_service_id, name, description, base_price, created_at, updated_at)
  VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, parent_service_id, name, description, base_price, created_at, updated_at;
`;

/**
 * Update subservice
 * @param {number} id, {string} name, {string} description, {number} basePrice
 */
const updateSubserviceQuery = `
  UPDATE service_subservices
  SET name = COALESCE($2, name),
      description = COALESCE($3, description),
      base_price = COALESCE($4, base_price),
      updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, parent_service_id, name, description, base_price, created_at, updated_at;
`;

/**
 * Delete subservice (soft delete)
 * @param {number} id - Subservice ID
 */
const deleteSubserviceQuery = `
  UPDATE service_subservices
  SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id;
`;

// ==================== SERVICE RELATIONSHIPS QUERIES ====================

/**
 * Get related services by service ID
 * @param {number} serviceId - Service ID
 */
const getRelatedServicesByIdQuery = `
  SELECT rs.id, rs.service_id_1, rs.service_id_2, rs.relationship_type, rs.created_at, rs.updated_at
  FROM service_relationships rs
  WHERE (rs.service_id_1 = $1 OR rs.service_id_2 = $1) AND rs.deleted_at IS NULL;
`;

/**
 * Get related services (bidirectional lookup)
 * @param {number} serviceId - Service ID
 */
const getRelatedServiceDetailsQuery = `
  SELECT s.id, s.name, s.category_id, s.description, s.base_price,
         s.duration_minutes, s.rating, s.total_bookings, sr.relationship_type
  FROM service_relationships sr
  JOIN services s ON (
    (sr.service_id_1 = $1 AND s.id = sr.service_id_2) OR
    (sr.service_id_2 = $1 AND s.id = sr.service_id_1)
  )
  WHERE sr.deleted_at IS NULL AND s.deleted_at IS NULL
  ORDER BY sr.relationship_type, s.rating DESC;
`;

/**
 * Create service relationship
 * @param {number} serviceId1, {number} serviceId2, {string} relationshipType
 */
const createServiceRelationshipQuery = `
  INSERT INTO service_relationships (service_id_1, service_id_2, relationship_type, created_at, updated_at)
  VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, service_id_1, service_id_2, relationship_type, created_at, updated_at;
`;

/**
 * Delete service relationship (soft delete)
 * @param {number} id - Relationship ID
 */
const deleteServiceRelationshipQuery = `
  UPDATE service_relationships
  SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id;
`;

/**
 * Get service relationship by ID
 * @param {number} id - Relationship ID
 */
const getServiceRelationshipByIdQuery = `
  SELECT id, service_id_1, service_id_2, relationship_type, created_at, updated_at
  FROM service_relationships
  WHERE id = $1 AND deleted_at IS NULL;
`;

// ==================== SERVICE CALL QUERIES ====================

/**
 * Get service call by notification ID
 * @param {number} notificationId - Notification ID
 */
const getServiceCallByNotificationIdQuery = `
  SELECT notification_id, start_time, end_time, time_worked, worker_id, payment
  FROM servicecall
  WHERE notification_id = $1;
`;

/**
 * Insert service call
 * @param {number} notificationId, {timestamp} startTime, {string} timeWorked, {number} workerId
 */
const insertServiceCallQuery = `
  INSERT INTO servicecall (notification_id, start_time, time_worked, worker_id)
  VALUES ($1, $2, $3, $4)
  RETURNING *;
`;

/**
 * Insert service call with payment
 * @param {number} notificationId, {number} workerId, {timestamp} startTime, {number} payment
 */
const insertServiceCallWithPaymentQuery = `
  INSERT INTO servicecall (notification_id, worker_id, start_time, payment)
  VALUES ($1, $2, $3, $4)
  RETURNING *;
`;

/**
 * Update service call time worked
 * @param {string} timeWorked, {number} notificationId
 */
const updateServiceCallTimeWorkedQuery = `
  UPDATE servicecall
  SET time_worked = $1
  WHERE notification_id = $2
  RETURNING *;
`;

/**
 * Update service call end time
 * @param {timestamp} endTime, {number} notificationId
 */
const updateServiceCallEndTimeQuery = `
  UPDATE servicecall
  SET end_time = $1
  WHERE notification_id = $2
  RETURNING *;
`;

/**
 * Get time worked from service call
 * @param {number} notificationId - Notification ID
 */
const getServiceCallTimeWorkedQuery = `
  SELECT time_worked
  FROM servicecall
  WHERE notification_id = $1;
`;

/**
 * Get worker ID from accepted table
 * @param {number} notificationId - Notification ID
 */
const getWorkerIdFromAcceptedQuery = `
  SELECT worker_id
  FROM accepted
  WHERE notification_id = $1;
`;

/**
 * Get user ID from notifications table
 * @param {number} notificationId - Notification ID
 */
const getUserIdFromNotificationsQuery = `
  SELECT user_id
  FROM notifications
  WHERE notification_id = $1;
`;

/**
 * Get navigation status from accepted table
 * @param {number} notificationId - Notification ID
 */
const getNavigationStatusFromAcceptedQuery = `
  SELECT navigation_status
  FROM accepted
  WHERE notification_id = $1;
`;

/**
 * Check if notification exists in accepted table
 * @param {number} notificationId - Notification ID
 */
const checkNotificationInAcceptedQuery = `
  SELECT 1
  FROM accepted
  WHERE notification_id = $1
  LIMIT 1;
`;

/**
 * Delete from accepted by notification ID
 * @param {number} notificationId - Notification ID
 */
const deleteFromAcceptedByNotificationIdQuery = `
  DELETE FROM accepted
  WHERE notification_id = $1
  RETURNING *;
`;

/**
 * Insert into complete notifications
 */
const insertCompleteNotificationQuery = `
  INSERT INTO completenotifications (
    accepted_id,
    notification_id,
    user_id,
    user_notification_id,
    longitude,
    latitude,
    created_at,
    worker_id,
    complete_status,
    service_booked,
    time,
    discount,
    total_cost,
    tip_amount
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *;
`;

/**
 * Get service end time from service call
 * @param {number} notificationId - Notification ID
 */
const getServiceEndTimeQuery = `
  SELECT end_time
  FROM servicecall
  WHERE notification_id = $1;
`;

// ==================== TIMER AND STOPWATCH QUERIES ====================

/**
 * Start timer by inserting start time into servicecall
 * @param {number} notificationId - Notification ID
 * @param {timestamp} startTime - Start time
 */
const startTimerQuery = `
  INSERT INTO servicecall (notification_id, start_time, worker_id, payment)
  SELECT $1, $2, worker_id, total_cost
  FROM accepted
  WHERE notification_id = $1
  RETURNING notification_id, start_time, worker_id, payment;
`;

/**
 * Stop timer by updating end time in servicecall
 * @param {timestamp} endTime - End time
 * @param {number} notificationId - Notification ID
 */
const stopTimerQuery = `
  UPDATE servicecall
  SET end_time = $1,
      time_worked = TO_CHAR(EXTRACT(EPOCH FROM ($1 - start_time)) / 3600, 'FM00') || ':' ||
                    TO_CHAR((EXTRACT(EPOCH FROM ($1 - start_time)) / 60) % 60, 'FM00') || ':' ||
                    TO_CHAR(EXTRACT(EPOCH FROM ($1 - start_time)) % 60, 'FM00')
  WHERE notification_id = $2
  RETURNING notification_id, start_time, end_time, time_worked, worker_id, payment;
`;

/**
 * Get timer value (time_worked) from servicecall
 * @param {number} notificationId - Notification ID
 */
const getTimerValueQuery = `
  SELECT notification_id, start_time, end_time, time_worked, worker_id
  FROM servicecall
  WHERE notification_id = $1;
`;

/**
 * Update timer status (update time_worked)
 * @param {string} timeWorked - Time worked in HH:MM:SS format
 * @param {number} notificationId - Notification ID
 */
const updateTimerStatusQuery = `
  UPDATE servicecall
  SET time_worked = $1
  WHERE notification_id = $2
  RETURNING notification_id, start_time, time_worked, worker_id;
`;

/**
 * Get work duration (elapsed time from start_time to current time or end_time)
 * @param {number} notificationId - Notification ID
 */
const getWorkDurationQuery = `
  SELECT
    notification_id,
    start_time,
    end_time,
    CASE
      WHEN end_time IS NOT NULL THEN
        TO_CHAR(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600, 'FM00') || ':' ||
        TO_CHAR((EXTRACT(EPOCH FROM (end_time - start_time)) / 60) % 60, 'FM00') || ':' ||
        TO_CHAR(EXTRACT(EPOCH FROM (end_time - start_time)) % 60, 'FM00')
      ELSE
        TO_CHAR(EXTRACT(EPOCH FROM (NOW() - start_time)) / 3600, 'FM00') || ':' ||
        TO_CHAR((EXTRACT(EPOCH FROM (NOW() - start_time)) / 60) % 60, 'FM00') || ':' ||
        TO_CHAR(EXTRACT(EPOCH FROM (NOW() - start_time)) % 60, 'FM00')
    END AS duration,
    time_worked,
    worker_id
  FROM servicecall
  WHERE notification_id = $1;
`;

// ==================== BULK OPERATIONS QUERIES ====================

/**
 * Get all services for bulk operations
 * @param {number} limit - Limit
 * @param {number} offset - Offset
 */
const getAllServicesQuery = `
  SELECT id, name, category_id, description, base_price, duration_minutes,
         rating, total_bookings, worker_id, status, image_url, created_at, updated_at
  FROM services
  WHERE deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT $1 OFFSET $2;
`;

/**
 * Get service count
 */
const getServiceCountQuery = `
  SELECT COUNT(*) as total
  FROM services
  WHERE deleted_at IS NULL;
`;

// ==================== ACCEPTED TABLE (SERVICE BOOKINGS) QUERIES ====================

/**
 * Get accepted booking by notification ID
 * @param {number} notificationId - Notification ID
 */
const getAcceptedBookingByNotificationIdQuery = `
  SELECT accepted_id, notification_id, user_notification_id, user_id, worker_id,
         service_booked, service_status, status, pin, longitude, latitude,
         time, discount, total_cost, tip_amount, complete_status,
         navigation_status, user_navigation_cancel_status, messages, created_at
  FROM accepted
  WHERE notification_id = $1;
`;

/**
 * Get accepted bookings by worker ID
 * @param {number} workerId - Worker ID
 */
const getAcceptedBookingsByWorkerIdQuery = `
  SELECT accepted_id, notification_id, user_notification_id, user_id, worker_id,
         service_booked, service_status, status, pin, longitude, latitude,
         time, discount, total_cost, tip_amount, complete_status, created_at
  FROM accepted
  WHERE worker_id = $1
  ORDER BY created_at DESC;
`;

/**
 * Get accepted bookings by user ID
 * @param {number} userId - User ID
 */
const getAcceptedBookingsByUserIdQuery = `
  SELECT accepted_id, notification_id, user_notification_id, user_id, worker_id,
         service_booked, service_status, status, pin, longitude, latitude,
         time, discount, total_cost, tip_amount, complete_status, created_at
  FROM accepted
  WHERE user_id = $1
  ORDER BY created_at DESC;
`;

/**
 * Insert accepted booking
 * @param {number} userNotificationId, {number} workerId, {number} notificationId,
 *        {string} status, {number} userId, {jsonb} serviceBooked, {jsonb} serviceStatus,
 *        {number} pin, {number} longitude, {number} latitude, {jsonb} time,
 *        {number} discount, {number} totalCost, {number} tipAmount
 */
const insertAcceptedBookingQuery = `
  INSERT INTO accepted (
    user_notification_id, worker_id, notification_id, status, user_id,
    service_booked, service_status, pin, longitude, latitude, time,
    discount, total_cost, tip_amount
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING accepted_id, notification_id, user_notification_id, user_id, worker_id,
            service_booked, service_status, status, pin, created_at;
`;

/**
 * Update accepted booking status
 * @param {string} status, {number} notificationId
 */
const updateAcceptedBookingStatusQuery = `
  UPDATE accepted
  SET status = $1
  WHERE notification_id = $2
  RETURNING accepted_id, notification_id, status;
`;

/**
 * Update accepted booking complete status
 * @param {string} completeStatus, {number} notificationId
 */
const updateAcceptedCompleteStatusQuery = `
  UPDATE accepted
  SET complete_status = $1
  WHERE notification_id = $2
  RETURNING accepted_id, notification_id, complete_status;
`;

/**
 * Update accepted booking navigation status
 * @param {string} navigationStatus, {number} notificationId
 */
const updateAcceptedNavigationStatusQuery = `
  UPDATE accepted
  SET navigation_status = $1
  WHERE notification_id = $2
  RETURNING accepted_id, notification_id, navigation_status;
`;

/**
 * Update navigation status to timeup
 * @param {number} notificationId - Notification ID
 */
const updateNavigationStatusTimeupQuery = `
  UPDATE accepted
  SET navigation_status = 'timeup'
  WHERE notification_id = $1
  RETURNING notification_id, navigation_status;
`;

/**
 * Update user navigation cancel status
 * @param {string} cancelStatus, {number} notificationId
 */
const updateUserNavigationCancelStatusQuery = `
  UPDATE accepted
  SET user_navigation_cancel_status = $1
  WHERE notification_id = $2
  RETURNING accepted_id, notification_id, user_navigation_cancel_status;
`;

/**
 * Update service status for specific service in booking
 * @param {string} serviceName, {string} statusKey, {string} statusValue, {number} notificationId
 * Note: statusKey should be one of: 'accept', 'arrived', 'workCompleted'
 */
const updateAcceptedServiceStatusQuery = (statusKey) => `
  UPDATE accepted
  SET service_status = (
    SELECT jsonb_agg(
      CASE
        WHEN item ->> 'serviceName' = $1 THEN
          jsonb_set(item, '{${statusKey}}', to_jsonb($2::text))
        ELSE item
      END
    )
    FROM jsonb_array_elements(service_status) AS item
  )
  WHERE notification_id = $3
  RETURNING notification_id, service_status;
`;

/**
 * Update accepted booking time field
 * @param {jsonb} time, {number} notificationId
 */
const updateAcceptedTimeQuery = `
  UPDATE accepted
  SET time = jsonb_set(
    COALESCE(time, '{}'::jsonb),
    $1,
    to_jsonb($2::text)
  )
  WHERE notification_id = $3
  RETURNING notification_id, time;
`;

/**
 * Get accepted booking with worker and user details
 * @param {number} notificationId - Notification ID
 */
const getAcceptedBookingWithDetailsQuery = `
  SELECT a.accepted_id, a.notification_id, a.service_booked, a.time,
         a.total_cost, a.discount, a.tip_amount, a.longitude, a.latitude,
         a.service_status, a.complete_status, a.pin, a.created_at,
         u.name AS user_name, u.phone_number AS user_phone,
         w.name AS worker_name, w.phone_number AS worker_phone,
         ws.service AS worker_service, ws.profile AS worker_profile,
         un.area
  FROM accepted a
  JOIN "user" u ON a.user_id = u.user_id
  JOIN workersverified w ON a.worker_id = w.worker_id
  JOIN workerskills ws ON w.worker_id = ws.worker_id
  JOIN usernotifications un ON a.user_notification_id = un.user_notification_id
  WHERE a.notification_id = $1;
`;

/**
 * Append message to accepted table
 * @param {jsonb} message, {number} notificationId
 */
const appendMessageToAcceptedQuery = `
  UPDATE accepted
  SET messages = COALESCE(messages, '[]'::jsonb) || $1::jsonb
  WHERE notification_id = $2
  RETURNING notification_id, messages;
`;

/**
 * Get messages from accepted table
 * @param {number} notificationId - Notification ID
 */
const getMessagesFromAcceptedQuery = `
  SELECT notification_id, messages
  FROM accepted
  WHERE notification_id = $1;
`;

/**
 * Get worker and FCM token from accepted booking
 * @param {number} notificationId - Notification ID
 */
const getWorkerAndFcmFromAcceptedQuery = `
  SELECT a.worker_id, f.fcm_token
  FROM accepted a
  JOIN fcm f ON a.worker_id = f.worker_id
  WHERE a.notification_id = $1;
`;

/**
 * Get user and FCM token from accepted booking
 * @param {number} notificationId - Notification ID
 */
const getUserAndFcmFromAcceptedQuery = `
  SELECT a.user_id, uf.fcm_token
  FROM accepted a
  JOIN userfcm uf ON a.user_id = uf.user_id
  WHERE a.notification_id = $1;
`;

// ==================== COMPLETE NOTIFICATIONS (SERVICE COMPLETION) QUERIES ====================

/**
 * Get completed service by notification ID
 * @param {number} notificationId - Notification ID
 */
const getCompletedServiceByNotificationIdQuery = `
  SELECT notification_id, accepted_id, user_id, worker_id, service_booked,
         complete_status, total_cost, discount, tip_amount, time,
         longitude, latitude, created_at
  FROM completenotifications
  WHERE notification_id = $1;
`;

/**
 * Get completed services by worker ID
 * @param {number} workerId - Worker ID
 * @param {number} limit - Limit
 * @param {number} offset - Offset
 */
const getCompletedServicesByWorkerIdQuery = `
  SELECT cn.notification_id, cn.service_booked, cn.created_at, cn.total_cost,
         cn.complete_status, u.name AS user_name
  FROM completenotifications cn
  JOIN "user" u ON cn.user_id = u.user_id
  WHERE cn.worker_id = $1
  ORDER BY cn.created_at DESC
  LIMIT $2 OFFSET $3;
`;

/**
 * Get completed services by user ID
 * @param {number} userId - User ID
 * @param {number} limit - Limit
 * @param {number} offset - Offset
 */
const getCompletedServicesByUserIdQuery = `
  SELECT cn.notification_id, cn.service_booked, cn.created_at, cn.total_cost,
         cn.complete_status, w.name AS worker_name, ws.profile AS worker_profile,
         ws.service AS worker_service
  FROM completenotifications cn
  JOIN workersverified w ON cn.worker_id = w.worker_id
  JOIN workerskills ws ON w.worker_id = ws.worker_id
  WHERE cn.user_id = $1
  ORDER BY cn.created_at DESC
  LIMIT $2 OFFSET $3;
`;

/**
 * Insert complete notification (service completion record)
 * @param {number} acceptedId, {number} notificationId, {number} userId,
 *        {number} userNotificationId, {number} longitude, {number} latitude,
 *        {timestamp} createdAt, {number} workerId, {string} completeStatus,
 *        {jsonb} serviceBooked, {jsonb} time, {number} discount,
 *        {number} totalCost, {number} tipAmount
 */
const insertCompleteNotificationFromAcceptedQuery = `
  INSERT INTO completenotifications (
    accepted_id, notification_id, user_id, user_notification_id,
    longitude, latitude, created_at, worker_id, complete_status,
    service_booked, time, discount, total_cost, tip_amount
  )
  SELECT
    accepted_id, $1, user_id, user_notification_id,
    longitude, latitude, created_at, worker_id, $2,
    service_booked, time, discount, total_cost, tip_amount
  FROM accepted
  WHERE notification_id = $1
  RETURNING notification_id, accepted_id, user_id, worker_id, complete_status;
`;

/**
 * Count completed services by date
 * @param {date} date - Date to count
 */
const countCompletedServicesByDateQuery = `
  SELECT COUNT(*) as total
  FROM completenotifications
  WHERE DATE(created_at) = $1;
`;

/**
 * Count completed services by date range
 * @param {date} startDate, {date} endDate
 */
const countCompletedServicesByDateRangeQuery = `
  SELECT COUNT(*) as total
  FROM completenotifications
  WHERE DATE(created_at) BETWEEN $1 AND $2;
`;

/**
 * Count canceled services by date
 * @param {date} date - Date to count
 */
const countCanceledServicesByDateQuery = `
  SELECT COUNT(*) as total
  FROM completenotifications
  WHERE DATE(created_at) = $1 AND complete_status = 'cancel';
`;

// ==================== SERVICE RATINGS QUERIES ====================

/**
 * Get average rating for a worker from feedback
 * @param {number} workerId - Worker ID
 */
const getWorkerAverageRatingQuery = `
  SELECT AVG(rating) as average_rating
  FROM feedback
  WHERE worker_id = $1;
`;

/**
 * Get worker ratings and feedback
 * @param {number} workerId - Worker ID
 * @param {number} limit - Limit
 * @param {number} offset - Offset
 */
const getWorkerRatingsQuery = `
  SELECT rating, feedback_text, created_at, user_id
  FROM feedback
  WHERE worker_id = $1
  ORDER BY created_at DESC
  LIMIT $2 OFFSET $3;
`;

/**
 * Insert service rating/feedback
 * @param {number} workerId, {number} userId, {number} rating, {string} feedbackText
 */
const insertServiceRatingQuery = `
  INSERT INTO feedback (worker_id, user_id, rating, feedback_text, created_at)
  VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
  RETURNING id, worker_id, user_id, rating, feedback_text, created_at;
`;

/**
 * Get service rating by ID
 * @param {number} id - Feedback ID
 */
const getServiceRatingByIdQuery = `
  SELECT id, worker_id, user_id, rating, feedback_text, created_at
  FROM feedback
  WHERE id = $1;
`;

/**
 * Get all ratings for a service/worker with details
 * @param {number} workerId - Worker ID
 */
const getServiceRatingsWithDetailsQuery = `
  SELECT f.id, f.rating, f.feedback_text, f.created_at,
         u.name AS user_name, u.phone_number AS user_phone
  FROM feedback f
  JOIN "user" u ON f.user_id = u.user_id
  WHERE f.worker_id = $1
  ORDER BY f.created_at DESC;
`;

// ==================== SERVICE WORKER ASSIGNMENTS QUERIES ====================

/**
 * Get worker assignments (active bookings)
 * @param {number} workerId - Worker ID
 */
const getWorkerActiveAssignmentsQuery = `
  SELECT a.notification_id, a.service_booked, a.service_status, a.created_at,
         a.total_cost, a.longitude, a.latitude, a.pin,
         u.name AS user_name, u.phone_number AS user_phone,
         un.area
  FROM accepted a
  JOIN "user" u ON a.user_id = u.user_id
  JOIN usernotifications un ON a.user_notification_id = un.user_notification_id
  WHERE a.worker_id = $1
  ORDER BY a.created_at DESC;
`;

/**
 * Get service assignment with worker details
 * @param {number} notificationId - Notification ID
 */
const getServiceAssignmentWithWorkerQuery = `
  SELECT a.notification_id, a.service_booked, a.service_status, a.time,
         a.total_cost, a.discount, a.tip_amount, a.complete_status,
         w.worker_id, w.name AS worker_name, w.phone_number AS worker_phone,
         ws.service AS worker_service, ws.profile AS worker_profile,
         ws.rating AS worker_rating
  FROM accepted a
  JOIN workersverified w ON a.worker_id = w.worker_id
  JOIN workerskills ws ON w.worker_id = ws.worker_id
  WHERE a.notification_id = $1;
`;

/**
 * Assign worker to service booking
 * @param {number} workerId, {number} notificationId
 */
const assignWorkerToBookingQuery = `
  UPDATE accepted
  SET worker_id = $1
  WHERE notification_id = $2
  RETURNING accepted_id, notification_id, worker_id, service_booked;
`;

/**
 * Check if worker is assigned to booking
 * @param {number} workerId, {number} notificationId
 */
const checkWorkerAssignmentQuery = `
  SELECT 1
  FROM accepted
  WHERE worker_id = $1 AND notification_id = $2
  LIMIT 1;
`;

/**
 * Get count of active assignments for worker
 * @param {number} workerId - Worker ID
 */
const countWorkerActiveAssignmentsQuery = `
  SELECT COUNT(*) as total
  FROM accepted
  WHERE worker_id = $1;
`;

// ==================== SERVICE CATEGORIES QUERIES ====================

/**
 * Get all service categories
 */
const getAllServiceCategoriesQuery = `
  SELECT service_id, service_name, service_image, created_at
  FROM servicecategories
  ORDER BY service_name ASC;
`;

/**
 * Get service category by ID
 * @param {number} serviceId - Service category ID
 */
const getServiceCategoryByIdQuery = `
  SELECT service_id, service_name, service_image, created_at
  FROM servicecategories
  WHERE service_id = $1;
`;

/**
 * Get service category by name
 * @param {string} serviceName - Service category name
 */
const getServiceCategoryByNameQuery = `
  SELECT service_id, service_name, service_image, created_at
  FROM servicecategories
  WHERE service_name = $1;
`;

/**
 * Create service category
 * @param {string} serviceName, {string} serviceImage
 */
const createServiceCategoryQuery = `
  INSERT INTO servicecategories (service_name, service_image, created_at)
  VALUES ($1, $2, CURRENT_TIMESTAMP)
  RETURNING service_id, service_name, service_image, created_at;
`;

/**
 * Update service category
 * @param {number} serviceId, {string} serviceName, {string} serviceImage
 */
const updateServiceCategoryQuery = `
  UPDATE servicecategories
  SET service_name = COALESCE($2, service_name),
      service_image = COALESCE($3, service_image)
  WHERE service_id = $1
  RETURNING service_id, service_name, service_image, created_at;
`;

/**
 * Delete service category
 * @param {number} serviceId - Service category ID
 */
const deleteServiceCategoryQuery = `
  DELETE FROM servicecategories
  WHERE service_id = $1
  RETURNING service_id;
`;

// ==================== SERVICECALL ADDITIONAL QUERIES ====================

/**
 * Get all service calls by worker ID
 * @param {number} workerId - Worker ID
 * @param {number} limit - Limit
 * @param {number} offset - Offset
 */
const getServiceCallsByWorkerIdQuery = `
  SELECT notification_id, start_time, end_time, time_worked, payment, payment_type
  FROM servicecall
  WHERE worker_id = $1
  ORDER BY start_time DESC
  LIMIT $2 OFFSET $3;
`;

/**
 * Get service calls with payment by worker ID
 * @param {number} workerId - Worker ID
 */
const getServiceCallsWithPaymentByWorkerIdQuery = `
  SELECT notification_id, start_time, end_time, time_worked, payment, payment_type
  FROM servicecall
  WHERE worker_id = $1 AND payment IS NOT NULL
  ORDER BY end_time DESC;
`;

/**
 * Update service call payment
 * @param {number} payment, {string} paymentType, {number} notificationId
 */
const updateServiceCallPaymentQuery = `
  UPDATE servicecall
  SET payment = $1, payment_type = $2
  WHERE notification_id = $3
  RETURNING notification_id, payment, payment_type;
`;

/**
 * Get service call earnings by date range
 * @param {number} workerId, {date} startDate, {date} endDate
 */
const getServiceCallEarningsByDateRangeQuery = `
  SELECT SUM(payment) as total_earnings, COUNT(*) as total_services
  FROM servicecall
  WHERE worker_id = $1
    AND end_time BETWEEN $2 AND $3
    AND payment IS NOT NULL;
`;

/**
 * Get service call with complete notification details
 * @param {number} notificationId - Notification ID
 */
const getServiceCallWithDetailsQuery = `
  SELECT sc.notification_id, sc.start_time, sc.end_time, sc.time_worked,
         sc.payment, sc.payment_type, sc.worker_id,
         cn.service_booked, cn.complete_status, cn.total_cost,
         u.name AS user_name, u.phone_number AS user_phone
  FROM servicecall sc
  LEFT JOIN completenotifications cn ON sc.notification_id = cn.notification_id
  LEFT JOIN "user" u ON cn.user_id = u.user_id
  WHERE sc.notification_id = $1;
`;

module.exports = {
  // Service Catalog Queries
  getServiceByIdQuery,
  getServicesByCategoryQuery,
  getServiceCountByCategoryQuery,
  searchServicesQuery,
  getServicesByWorkerIdQuery,
  getActiveServicesQuery,
  createServiceQuery,
  updateServiceQuery,
  updateServiceRatingQuery,
  incrementServiceBookingsQuery,
  deleteServiceQuery,
  getAllServicesQuery,
  getServiceCountQuery,

  // Service Tracking Queries
  insertServiceTrackingQuery,
  getServiceTrackingByIdQuery,
  getServiceTrackingByUserIdQuery,
  getServiceTrackingByWorkerIdQuery,
  getActiveServiceTrackingByUserQuery,
  getActiveServiceTrackingByWorkerQuery,
  updateServiceTrackingStatusQuery,
  completeServiceTrackingQuery,
  deleteServiceTrackingQuery,

  // Service Timer Queries
  insertServiceTimerQuery,
  getServiceTimerByTrackingIdQuery,
  getServiceTimerByIdQuery,
  startServiceTimerQuery,
  pauseServiceTimerQuery,
  stopServiceTimerQuery,
  updateTimerElapsedSecondsQuery,
  deleteServiceTimerQuery,

  // Work Completion Queries
  insertWorkCompletionQuery,
  getWorkCompletionByIdQuery,
  getWorkCompletionByTrackingIdQuery,
  getWorkCompletionsByWorkerIdQuery,
  getPendingWorkCompletionQuery,
  updateWorkCompletionStatusQuery,
  approveWorkCompletionQuery,
  deleteWorkCompletionQuery,

  // Service Subservices Queries
  getSubservicesByParentIdQuery,
  getSubserviceByIdQuery,
  createSubserviceQuery,
  updateSubserviceQuery,
  deleteSubserviceQuery,

  // Service Relationships Queries
  getRelatedServicesByIdQuery,
  getRelatedServiceDetailsQuery,
  createServiceRelationshipQuery,
  deleteServiceRelationshipQuery,
  getServiceRelationshipByIdQuery,

  // Service Call Queries
  getServiceCallByNotificationIdQuery,
  insertServiceCallQuery,
  insertServiceCallWithPaymentQuery,
  updateServiceCallTimeWorkedQuery,
  updateServiceCallEndTimeQuery,
  getServiceCallTimeWorkedQuery,
  getWorkerIdFromAcceptedQuery,
  getUserIdFromNotificationsQuery,
  getNavigationStatusFromAcceptedQuery,
  checkNotificationInAcceptedQuery,
  deleteFromAcceptedByNotificationIdQuery,
  insertCompleteNotificationQuery,
  getServiceEndTimeQuery,

  // Timer and Stopwatch Queries
  startTimerQuery,
  stopTimerQuery,
  getTimerValueQuery,
  updateTimerStatusQuery,
  getWorkDurationQuery,

  // Accepted Table (Service Bookings) Queries
  getAcceptedBookingByNotificationIdQuery,
  getAcceptedBookingsByWorkerIdQuery,
  getAcceptedBookingsByUserIdQuery,
  insertAcceptedBookingQuery,
  updateAcceptedBookingStatusQuery,
  updateAcceptedCompleteStatusQuery,
  updateAcceptedNavigationStatusQuery,
  updateNavigationStatusTimeupQuery,
  updateUserNavigationCancelStatusQuery,
  updateAcceptedServiceStatusQuery,
  updateAcceptedTimeQuery,
  getAcceptedBookingWithDetailsQuery,
  appendMessageToAcceptedQuery,
  getMessagesFromAcceptedQuery,
  getWorkerAndFcmFromAcceptedQuery,
  getUserAndFcmFromAcceptedQuery,

  // Complete Notifications (Service Completion) Queries
  getCompletedServiceByNotificationIdQuery,
  getCompletedServicesByWorkerIdQuery,
  getCompletedServicesByUserIdQuery,
  insertCompleteNotificationFromAcceptedQuery,
  countCompletedServicesByDateQuery,
  countCompletedServicesByDateRangeQuery,
  countCanceledServicesByDateQuery,

  // Service Ratings Queries
  getWorkerAverageRatingQuery,
  getWorkerRatingsQuery,
  insertServiceRatingQuery,
  getServiceRatingByIdQuery,
  getServiceRatingsWithDetailsQuery,

  // Service Worker Assignments Queries
  getWorkerActiveAssignmentsQuery,
  getServiceAssignmentWithWorkerQuery,
  assignWorkerToBookingQuery,
  checkWorkerAssignmentQuery,
  countWorkerActiveAssignmentsQuery,

  // Service Categories Queries
  getAllServiceCategoriesQuery,
  getServiceCategoryByIdQuery,
  getServiceCategoryByNameQuery,
  createServiceCategoryQuery,
  updateServiceCategoryQuery,
  deleteServiceCategoryQuery,

  // ServiceCall Additional Queries
  getServiceCallsByWorkerIdQuery,
  getServiceCallsWithPaymentByWorkerIdQuery,
  updateServiceCallPaymentQuery,
  getServiceCallEarningsByDateRangeQuery,
  getServiceCallWithDetailsQuery,
};
