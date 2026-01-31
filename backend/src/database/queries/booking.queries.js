/**
 * Booking Database Queries
 * Contains common SQL queries for booking operations
 */

const getBookingByIdQuery = `
  SELECT id, user_id, worker_id, service_type, description, location,
         latitude, longitude, scheduled_date, scheduled_time, status,
         estimated_amount, actual_amount, created_at, updated_at
  FROM bookings
  WHERE id = $1 AND deleted_at IS NULL;
`;

const createBookingQuery = `
  INSERT INTO bookings (user_id, worker_id, service_type, description, location,
                        latitude, longitude, scheduled_date, scheduled_time, status,
                        estimated_amount, created_at, updated_at)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, user_id, worker_id, service_type, description, location,
            latitude, longitude, scheduled_date, scheduled_time, status,
            estimated_amount, actual_amount, created_at, updated_at;
`;

const updateBookingStatusQuery = `
  UPDATE bookings
  SET status = $2, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, user_id, worker_id, status, updated_at;
`;

const getBookingsByUserQuery = `
  SELECT id, user_id, worker_id, service_type, description, location,
         latitude, longitude, scheduled_date, scheduled_time, status,
         estimated_amount, actual_amount, created_at, updated_at
  FROM bookings
  WHERE user_id = $1 AND deleted_at IS NULL
  ORDER BY scheduled_date DESC, scheduled_time DESC
  LIMIT $2 OFFSET $3;
`;

const getBookingsByWorkerQuery = `
  SELECT id, user_id, worker_id, service_type, description, location,
         latitude, longitude, scheduled_date, scheduled_time, status,
         estimated_amount, actual_amount, created_at, updated_at
  FROM bookings
  WHERE worker_id = $1 AND deleted_at IS NULL
  ORDER BY scheduled_date DESC, scheduled_time DESC
  LIMIT $2 OFFSET $3;
`;

const getActiveBookingsQuery = `
  SELECT id, user_id, worker_id, service_type, description, location,
         latitude, longitude, scheduled_date, scheduled_time, status,
         estimated_amount, actual_amount, created_at, updated_at
  FROM bookings
  WHERE status IN ('pending', 'confirmed', 'in_progress') AND deleted_at IS NULL
  ORDER BY scheduled_date ASC;
`;

const updateBookingActualAmountQuery = `
  UPDATE bookings
  SET actual_amount = $2, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, actual_amount, updated_at;
`;

const getBookingsByStatusQuery = `
  SELECT id, user_id, worker_id, service_type, description, location,
         latitude, longitude, scheduled_date, scheduled_time, status,
         estimated_amount, actual_amount, created_at, updated_at
  FROM bookings
  WHERE status = $1 AND deleted_at IS NULL
  ORDER BY scheduled_date DESC
  LIMIT $2 OFFSET $3;
`;

const cancelBookingQuery = `
  UPDATE bookings
  SET status = 'cancelled', deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, status;
`;

const getBookingCountByStatusQuery = `
  SELECT status, COUNT(*) as count
  FROM bookings
  WHERE deleted_at IS NULL
  GROUP BY status;
`;

// ============================================================================
// NOTIFICATION QUERIES
// ============================================================================

const storeBookingNotificationQuery = `
  INSERT INTO notifications (user_id, user_type, title, body, notification_type, related_id, related_type, data, is_read, created_at, updated_at)
  VALUES ($1, $2, $3, $4, $5, $6, 'booking', $7, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, user_id, title, body, notification_type, related_id, is_read, created_at;
`;

const getBookingNotificationsQuery = `
  SELECT id, user_id, user_type, title, body, notification_type, related_id, data, is_read, created_at
  FROM notifications
  WHERE related_id = $1 AND related_type = 'booking'
  ORDER BY created_at DESC
  LIMIT $2 OFFSET $3;
`;

const markBookingNotificationAsReadQuery = `
  UPDATE notifications
  SET is_read = true, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND related_id = $2 AND related_type = 'booking'
  RETURNING id, is_read, updated_at;
`;

const getBookingUnreadNotificationCountQuery = `
  SELECT COUNT(*) as unread_count
  FROM notifications
  WHERE related_id = $1 AND related_type = 'booking' AND is_read = false;
`;

const deleteBookingNotificationQuery = `
  DELETE FROM notifications
  WHERE id = $1 AND related_id = $2 AND related_type = 'booking'
  RETURNING id;
`;

const getBookingNotificationsByUserQuery = `
  SELECT id, user_id, user_type, title, body, notification_type, related_id, data, is_read, created_at
  FROM notifications
  WHERE user_id = $1 AND related_type = 'booking'
  ORDER BY created_at DESC
  LIMIT $2 OFFSET $3;
`;

const updateNotificationStatusByUserNotificationIdQuery = `
  UPDATE notifications
  SET status = $1
  WHERE user_notification_id = $2 AND worker_id = $3
  RETURNING *;
`;

const updateNotificationCancelStatusQuery = `
  UPDATE notifications
  SET cancel_status = $1
  WHERE user_notification_id = $2
  RETURNING *;
`;

const checkNotificationExistsByUserNotificationIdQuery = `
  SELECT 1
  FROM notifications
  WHERE user_notification_id = $1
  LIMIT 1;
`;

const deleteNotificationsByUserNotificationIdQuery = `
  DELETE FROM notifications
  WHERE user_notification_id = $1 AND worker_id != $2
  RETURNING *;
`;

// ============================================================================
// STATUS UPDATE AND TRACKING QUERIES
// ============================================================================

const getBookingStatusHistoryQuery = `
  SELECT id, booking_id, old_status, new_status, changed_at, changed_by, reason
  FROM booking_status_history
  WHERE booking_id = $1
  ORDER BY changed_at DESC;
`;

const createBookingStatusHistoryQuery = `
  INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_at, changed_by, reason)
  VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5)
  RETURNING id, booking_id, old_status, new_status, changed_at;
`;

const updateBookingStatusWithHistoryQuery = `
  UPDATE bookings
  SET status = $2, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, user_id, worker_id, status, updated_at;
`;

// ============================================================================
// SEARCH AND FILTER QUERIES
// ============================================================================

const searchBookingsByServiceTypeQuery = `
  SELECT id, user_id, worker_id, service_type, description, location,
         latitude, longitude, scheduled_date, scheduled_time, status,
         estimated_amount, actual_amount, created_at, updated_at
  FROM bookings
  WHERE service_type ILIKE $1 AND deleted_at IS NULL
  ORDER BY scheduled_date DESC
  LIMIT $2 OFFSET $3;
`;

const getBookingsByDateRangeQuery = `
  SELECT id, user_id, worker_id, service_type, description, location,
         latitude, longitude, scheduled_date, scheduled_time, status,
         estimated_amount, actual_amount, created_at, updated_at
  FROM bookings
  WHERE scheduled_date BETWEEN $1 AND $2 AND deleted_at IS NULL
  ORDER BY scheduled_date ASC
  LIMIT $3 OFFSET $4;
`;

const getUpcomingBookingsQuery = `
  SELECT id, user_id, worker_id, service_type, description, location,
         latitude, longitude, scheduled_date, scheduled_time, status,
         estimated_amount, actual_amount, created_at
  FROM bookings
  WHERE scheduled_date >= CURRENT_DATE AND status IN ('pending', 'confirmed', 'in_progress')
  AND deleted_at IS NULL
  ORDER BY scheduled_date ASC, scheduled_time ASC
  LIMIT $1 OFFSET $2;
`;

const getPastBookingsQuery = `
  SELECT id, user_id, worker_id, service_type, description, location,
         latitude, longitude, scheduled_date, scheduled_time, status,
         estimated_amount, actual_amount, created_at
  FROM bookings
  WHERE scheduled_date < CURRENT_DATE AND deleted_at IS NULL
  ORDER BY scheduled_date DESC
  LIMIT $1 OFFSET $2;
`;

// ============================================================================
// COMPLEX JOIN QUERIES
// ============================================================================

const getBookingDetailsWithUserAndWorkerQuery = `
  SELECT
    b.id, b.user_id, b.worker_id, b.service_type, b.description, b.location,
    b.latitude, longitude, b.scheduled_date, b.scheduled_time, b.status,
    b.estimated_amount, b.actual_amount, b.created_at,
    u.name as user_name, u.email as user_email, u.phone as user_phone,
    w.specialization, w.rating as worker_rating,
    wu.name as worker_name, wu.email as worker_email, wu.phone as worker_phone
  FROM bookings b
  JOIN users u ON b.user_id = u.id
  LEFT JOIN workers w ON b.worker_id = w.id
  LEFT JOIN users wu ON w.user_id = wu.id
  WHERE b.id = $1 AND b.deleted_at IS NULL
  AND u.deleted_at IS NULL;
`;

const getBookingWithPaymentDetailsQuery = `
  SELECT
    b.id, b.user_id, b.worker_id, b.service_type, b.status,
    b.scheduled_date, b.scheduled_time, b.estimated_amount, b.actual_amount,
    COUNT(p.id) as payment_count,
    SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_paid,
    MAX(p.payment_date) as last_payment_date,
    ARRAY_AGG(p.id) as payment_ids
  FROM bookings b
  LEFT JOIN payments p ON b.id = p.booking_id AND p.deleted_at IS NULL
  WHERE b.id = $1 AND b.deleted_at IS NULL
  GROUP BY b.id;
`;

const getUserBookingsSummaryQuery = `
  SELECT
    u.id, u.name, u.email,
    COUNT(b.id) as total_bookings,
    SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
    SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
    SUM(CASE WHEN b.status IN ('pending', 'confirmed', 'in_progress') THEN 1 ELSE 0 END) as active_bookings,
    AVG(CAST(COALESCE(b.actual_amount, b.estimated_amount) AS DECIMAL)) as average_booking_value,
    MAX(b.scheduled_date) as last_booking_date
  FROM users u
  LEFT JOIN bookings b ON u.id = b.user_id AND b.deleted_at IS NULL
  WHERE u.id = $1 AND u.deleted_at IS NULL
  GROUP BY u.id;
`;

const getWorkerBookingsSummaryQuery = `
  SELECT
    w.id, w.user_id, w.specialization, w.rating,
    COUNT(b.id) as total_bookings,
    SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
    SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
    AVG(CAST(COALESCE(b.actual_amount, b.estimated_amount) AS DECIMAL)) as average_booking_value,
    MAX(b.scheduled_date) as last_booking_date
  FROM workers w
  LEFT JOIN bookings b ON w.id = b.worker_id AND b.deleted_at IS NULL
  WHERE w.id = $1 AND w.deleted_at IS NULL
  GROUP BY w.id;
`;

const getBookingsByLocationWithWorkersQuery = `
  SELECT
    b.id, b.user_id, b.worker_id, b.service_type, b.location,
    b.latitude, b.longitude, b.scheduled_date, b.status,
    w.specialization, w.rating,
    COUNT(b.id) OVER (PARTITION BY b.location) as bookings_in_area
  FROM bookings b
  LEFT JOIN workers w ON b.worker_id = w.id
  WHERE b.location ILIKE $1 AND b.status IN ('pending', 'confirmed', 'in_progress')
  AND b.deleted_at IS NULL
  ORDER BY b.scheduled_date ASC
  LIMIT $2 OFFSET $3;
`;

const getBookingsRequiringPaymentQuery = `
  SELECT
    b.id, b.user_id, b.worker_id, b.service_type, b.status,
    b.actual_amount, b.created_at,
    COALESCE(SUM(p.amount), 0) as amount_paid,
    (b.actual_amount - COALESCE(SUM(p.amount), 0)) as amount_pending,
    COUNT(p.id) as payment_count
  FROM bookings b
  LEFT JOIN payments p ON b.id = p.booking_id AND p.status = 'completed' AND p.deleted_at IS NULL
  WHERE b.status IN ('completed', 'in_progress') AND b.deleted_at IS NULL
  AND (b.actual_amount > COALESCE(SUM(p.amount), 0))
  GROUP BY b.id
  ORDER BY amount_pending DESC
  LIMIT $1 OFFSET $2;
`;

// ============================================================================
// BOOKING REQUEST QUERIES
// ============================================================================

const upsertUserActionQuery = `
  INSERT INTO useraction (user_id, track)
  VALUES ($1, $2::jsonb)
  ON CONFLICT (user_id) DO UPDATE
  SET track = (
    SELECT
      COALESCE(jsonb_agg(item), '[]'::jsonb)
    FROM
      jsonb_array_elements(useraction.track) AS item
    WHERE
      item->>'encodedId' <> $3
      AND ($4::text IS NULL OR item->>'encodedId' <> $4::text)
  ) || (
    CASE
      WHEN $5::jsonb IS NOT NULL THEN $6::jsonb
      ELSE '[]'::jsonb
    END
  )
  RETURNING *;
`;

const upsertWorkerActionQuery = `
  INSERT INTO workeraction (worker_id, screen_name, params)
  VALUES ($1, $2, $3)
  ON CONFLICT (worker_id) DO UPDATE
    SET
      screen_name = CASE
        WHEN $2 <> '' THEN $2
        WHEN $2 = ''
          AND workeraction.params::jsonb->>'encodedId' = ($3::jsonb->>'encodedId')
          THEN ''::text
        ELSE workeraction.screen_name
      END,
      params = CASE
        WHEN $2 <> '' THEN $3
        ELSE workeraction.params
      END
  RETURNING *;
`;

const acceptRequestCombinedQuery = `
  WITH check_accept AS (
    SELECT notification_id
    FROM accepted
    WHERE user_notification_id = $1
    FOR UPDATE
  ),
  get_notification AS (
    SELECT
      n.cancel_status,
      n.user_id,
      n.notification_id,
      n.service_booked,
      n.longitude,
      n.latitude,
      n.discount,
      n.total_cost,
      n.tip_amount
    FROM notifications n
    WHERE n.user_notification_id = $1
    FOR UPDATE
  ),
  insert_accept AS (
    INSERT INTO accepted
      (user_notification_id, worker_id, notification_id, status, user_id, service_booked, service_status, pin, longitude, latitude, time, discount, total_cost, tip_amount)
    SELECT
      $1,
      $2,
      gn.notification_id,
      'accept',
      gn.user_id,
      gn.service_booked::jsonb,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'accept', to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
            'arrived', null,
            'workCompleted', null,
            'serviceName', service->>'serviceName',
            'Quantity' , service->>'quantity'
          )
        )
        FROM jsonb_array_elements(gn.service_booked) AS service
      ),
      FLOOR(RANDOM() * 9000) + 1000,
      gn.longitude::numeric,
      gn.latitude::numeric,
      jsonb_build_object(
        'accept', to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS'),
        'arrived', null,
        'workCompleted', null,
        'paymentCompleted', null
      ),
      gn.discount,
      gn.total_cost,
      gn.tip_amount
    FROM get_notification gn
    RETURNING notification_id
  ),
  delete_notification AS (
    DELETE FROM notifications
    WHERE user_notification_id = $1
    RETURNING 1
  )
  SELECT
    ia.notification_id AS inserted_notification_id,
    ca1.notification_id AS existing_notification_id,
    gn.cancel_status,
    gn.user_id,
    gn.service_booked,
    gn.longitude,
    gn.latitude
  FROM check_accept ca1
  RIGHT JOIN get_notification gn ON TRUE
  LEFT JOIN insert_accept ia ON TRUE
  LEFT JOIN delete_notification dn ON TRUE;
`;

const rejectRequestQuery = `
  UPDATE notifications
  SET status = $1
  WHERE user_notification_id = $2 AND worker_id = $3
  RETURNING *;
`;

const checkAcceptStatusQuery = `
  SELECT
    COUNT(*) FILTER (WHERE status = 'accept') AS accept_count,
    MAX(cancel_status) AS cancel_status
  FROM
    notifications
  WHERE
    user_notification_id = $1;
`;

const updateCancelStatusQuery = `
  UPDATE notifications
  SET cancel_status = $1
  WHERE user_notification_id = $2;
`;

const getUserFcmTokensQuery = `
  SELECT uf.fcm_token
  FROM userfcm uf
  WHERE uf.user_id = $1;
`;

// ============================================================================
// BOOKING STATUS QUERIES
// ============================================================================

const checkNotificationExistsQuery = `
  SELECT 1
  FROM notifications
  WHERE user_notification_id = $1;
`;

const getServiceCallEndTimeQuery = `
  SELECT end_time
  FROM servicecall
  WHERE notification_id = $1;
`;

const getNavigationStatusQuery = `
  SELECT navigation_status
  FROM accepted
  WHERE notification_id = $1;
`;

// ============================================================================
// BOOKING LOCATION QUERIES
// ============================================================================

const getUserAndWorkerLocationQuery = `
  SELECT longitude, latitude, worker_id
  FROM accepted
  WHERE notification_id = $1;
`;

const getWorkerLocationFromAcceptedQuery = `
  SELECT
    a.worker_id,
    a.longitude AS end_longitude,
    a.latitude AS end_latitude
  FROM accepted a
  WHERE a.notification_id = $1;
`;

const getBookingLocationByIdQuery = `
  SELECT
    b.id,
    b.location,
    b.latitude,
    b.longitude,
    b.user_id,
    b.worker_id
  FROM bookings b
  WHERE b.id = $1 AND b.deleted_at IS NULL;
`;

const updateNavigationStatusQuery = `
  UPDATE accepted
  SET navigation_status = 'timeup'
  WHERE notification_id = $1;
`;

const updateUserNavigationStatusQuery = `
  UPDATE accepted
  SET user_navigation_cancel_status = 'timeup'
  WHERE notification_id = $1;
`;

const getNavigationDetailsQuery = `
  SELECT
    a.notification_id,
    a.navigation_status,
    a.user_navigation_cancel_status,
    a.longitude,
    a.latitude,
    a.worker_id,
    a.user_id,
    a.service_booked
  FROM accepted a
  WHERE a.notification_id = $1;
`;

// ============================================================================
// BOOKING STATUS UPDATE QUERIES
// ============================================================================

const updateBookingStatusToAcceptedQuery = `
  UPDATE bookings
  SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, user_id, worker_id, status, updated_at;
`;

const updateBookingStatusToRejectedQuery = `
  UPDATE bookings
  SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, user_id, worker_id, status, updated_at;
`;

const updateBookingStatusToConfirmedQuery = `
  UPDATE bookings
  SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, user_id, worker_id, status, updated_at;
`;

const updateBookingStatusToInProgressQuery = `
  UPDATE bookings
  SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, user_id, worker_id, status, updated_at;
`;

const updateBookingStatusToCompletedQuery = `
  UPDATE bookings
  SET status = 'completed', updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, user_id, worker_id, status, updated_at;
`;

const updateBookingStatusToCancelledQuery = `
  UPDATE bookings
  SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, user_id, worker_id, status, updated_at;
`;

// ============================================================================
// BOOKING CANCELLATION QUERIES
// ============================================================================

const cancelBookingByUserQuery = `
  UPDATE bookings
  SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
  RETURNING id, user_id, worker_id, status, updated_at;
`;

const cancelBookingByWorkerQuery = `
  UPDATE bookings
  SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND worker_id = $2 AND deleted_at IS NULL
  RETURNING id, user_id, worker_id, status, updated_at;
`;

const trackBookingCancellationQuery = `
  INSERT INTO cancellation_tracking (
    service_id,
    cancelled_by,
    cancellation_reason,
    cancellation_type,
    cancelled_at,
    created_at
  ) VALUES ($1, $2, $3, $4, $5, NOW())
  RETURNING id, service_id, cancelled_by, cancellation_reason, cancellation_type, cancelled_at;
`;

const getCancellationByBookingIdQuery = `
  SELECT
    id,
    service_id,
    cancelled_by,
    cancellation_reason,
    cancellation_type,
    cancelled_at,
    created_at
  FROM cancellation_tracking
  WHERE service_id = $1;
`;

const getCancellationStatsByDateRangeQuery = `
  SELECT
    cancellation_reason,
    cancellation_type,
    COUNT(*) as count,
    DATE(cancelled_at) as cancellation_date
  FROM cancellation_tracking
  WHERE cancelled_at >= $1 AND cancelled_at <= $2
  GROUP BY cancellation_reason, cancellation_type, DATE(cancelled_at)
  ORDER BY cancellation_date DESC;
`;

const updateAcceptedNavigationCancelStatusQuery = `
  UPDATE accepted
  SET navigation_status = 'workercanceled'
  WHERE notification_id = $1
  RETURNING notification_id, navigation_status;
`;

const updateAcceptedUserNavigationCancelStatusQuery = `
  UPDATE accepted
  SET user_navigation_cancel_status = 'usercanceled'
  WHERE notification_id = $1
  AND (user_navigation_cancel_status IS NULL OR user_navigation_cancel_status != 'timeup')
  RETURNING notification_id, user_navigation_cancel_status;
`;

const checkCancellationStatusQuery = `
  SELECT 1 FROM accepted WHERE notification_id = $1
`;

const updateCompleteStatusToCancelQuery = `
  UPDATE accepted
  SET complete_status = 'cancel'
  WHERE notification_id = $1
  RETURNING notification_id, complete_status;
`;

// ============================================================================
// BOOKING ACCEPT/REJECT WORKFLOW QUERIES
// ============================================================================

const updateAcceptedStatusQuery = `
  UPDATE accepted
  SET status = $2, updated_at = CURRENT_TIMESTAMP
  WHERE notification_id = $1
  RETURNING notification_id, status, user_id, worker_id, service_booked;
`;

const getAcceptedBookingDetailsQuery = `
  SELECT
    a.notification_id,
    a.user_notification_id,
    a.user_id,
    a.worker_id,
    a.status,
    a.service_booked,
    a.service_status,
    a.complete_status,
    a.navigation_status,
    a.user_navigation_cancel_status,
    a.longitude,
    a.latitude,
    a.total_cost,
    a.discount,
    a.tip_amount,
    a.time,
    a.pin,
    a.created_at
  FROM accepted a
  WHERE a.notification_id = $1;
`;

const getAcceptedBookingsByWorkerQuery = `
  SELECT
    a.notification_id,
    a.user_notification_id,
    a.user_id,
    a.worker_id,
    a.status,
    a.service_booked,
    a.complete_status,
    a.total_cost,
    a.created_at
  FROM accepted a
  WHERE a.worker_id = $1
  AND a.complete_status IS NULL
  ORDER BY a.created_at DESC
  LIMIT $2 OFFSET $3;
`;

const getAcceptedBookingsByUserQuery = `
  SELECT
    a.notification_id,
    a.user_notification_id,
    a.user_id,
    a.worker_id,
    a.status,
    a.service_booked,
    a.complete_status,
    a.navigation_status,
    a.user_navigation_cancel_status,
    a.total_cost,
    a.created_at
  FROM accepted a
  WHERE a.user_id = $1
  AND a.complete_status IS NULL
  ORDER BY a.created_at DESC
  LIMIT $2 OFFSET $3;
`;

const checkWorkerAcceptedBookingQuery = `
  SELECT notification_id, status, user_id, worker_id
  FROM accepted
  WHERE user_notification_id = $1
  FOR UPDATE;
`;

const deleteAcceptedBookingAfterCancellationQuery = `
  DELETE FROM accepted
  WHERE notification_id = $1
  RETURNING notification_id, user_id, worker_id;
`;

// ============================================================================
// PENDING BOOKINGS QUERIES
// ============================================================================

const getPendingBookingsQuery = `
  SELECT id, user_id, worker_id, service_type, description, location,
         latitude, longitude, scheduled_date, scheduled_time, status,
         estimated_amount, actual_amount, created_at, updated_at
  FROM bookings
  WHERE status = 'pending' AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT $1 OFFSET $2;
`;

const getPendingBookingsByUserQuery = `
  SELECT id, user_id, worker_id, service_type, description, location,
         latitude, longitude, scheduled_date, scheduled_time, status,
         estimated_amount, actual_amount, created_at, updated_at
  FROM bookings
  WHERE user_id = $1 AND status = 'pending' AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT $2 OFFSET $3;
`;

const getPendingBookingsByWorkerQuery = `
  SELECT id, user_id, worker_id, service_type, description, location,
         latitude, longitude, scheduled_date, scheduled_time, status,
         estimated_amount, actual_amount, created_at, updated_at
  FROM bookings
  WHERE worker_id = $1 AND status = 'pending' AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT $2 OFFSET $3;
`;

const getPendingNotificationsQuery = `
  SELECT
    n.notification_id,
    n.user_notification_id,
    n.user_id,
    n.worker_id,
    n.service_booked,
    n.status,
    n.cancel_status,
    n.total_cost,
    n.discount,
    n.tip_amount,
    n.created_at
  FROM notifications n
  WHERE n.worker_id = $1
  AND n.status = 'pending'
  ORDER BY n.created_at DESC
  LIMIT $2 OFFSET $3;
`;

const countPendingBookingsByStatusQuery = `
  SELECT
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_count,
    COUNT(*) FILTER (WHERE status = 'accepted') as accepted_count
  FROM bookings
  WHERE deleted_at IS NULL;
`;

// ============================================================================
// BOOKING WORKFLOW STATUS HISTORY QUERIES
// ============================================================================

const getBookingWorkflowHistoryQuery = `
  SELECT
    bsh.id,
    bsh.booking_id,
    bsh.old_status,
    bsh.new_status,
    bsh.changed_at,
    bsh.changed_by,
    bsh.reason,
    u.name as changed_by_name,
    u.email as changed_by_email
  FROM booking_status_history bsh
  LEFT JOIN users u ON bsh.changed_by = u.id
  WHERE bsh.booking_id = $1
  ORDER BY bsh.changed_at DESC;
`;

const createBookingWorkflowHistoryQuery = `
  INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_at, changed_by, reason)
  VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5)
  RETURNING id, booking_id, old_status, new_status, changed_at, changed_by, reason;
`;

const getRecentStatusChangesQuery = `
  SELECT
    bsh.id,
    bsh.booking_id,
    bsh.old_status,
    bsh.new_status,
    bsh.changed_at,
    bsh.reason,
    b.service_type,
    b.user_id,
    b.worker_id
  FROM booking_status_history bsh
  JOIN bookings b ON bsh.booking_id = b.id
  WHERE bsh.changed_at >= $1
  ORDER BY bsh.changed_at DESC
  LIMIT $2;
`;

const getBookingStatusChangeCountQuery = `
  SELECT
    new_status,
    COUNT(*) as status_change_count
  FROM booking_status_history
  WHERE changed_at >= $1
  GROUP BY new_status
  ORDER BY status_change_count DESC;
`;

// ============================================================================
// COMPLETED AND CANCELLED BOOKINGS QUERIES
// ============================================================================

const getCompletedBookingsQuery = `
  SELECT
    cn.notification_id,
    cn.user_notification_id,
    cn.user_id,
    cn.worker_id,
    cn.service_booked,
    cn.complete_status,
    cn.total_cost,
    cn.discount,
    cn.tip_amount,
    cn.time,
    cn.created_at
  FROM completenotifications cn
  WHERE cn.complete_status = 'completed'
  ORDER BY cn.created_at DESC
  LIMIT $1 OFFSET $2;
`;

const getCancelledBookingsQuery = `
  SELECT
    cn.notification_id,
    cn.user_notification_id,
    cn.user_id,
    cn.worker_id,
    cn.service_booked,
    cn.complete_status,
    cn.total_cost,
    cn.discount,
    cn.tip_amount,
    cn.time,
    cn.created_at
  FROM completenotifications cn
  WHERE cn.complete_status IN ('cancel', 'usercanceled', 'workercanceled')
  ORDER BY cn.created_at DESC
  LIMIT $1 OFFSET $2;
`;

const getCancelledBookingsByUserQuery = `
  SELECT
    cn.notification_id,
    cn.user_notification_id,
    cn.user_id,
    cn.worker_id,
    cn.service_booked,
    cn.complete_status,
    cn.total_cost,
    cn.created_at
  FROM completenotifications cn
  WHERE cn.user_id = $1
  AND cn.complete_status IN ('cancel', 'usercanceled', 'workercanceled')
  ORDER BY cn.created_at DESC
  LIMIT $2 OFFSET $3;
`;

const getCancelledBookingsByWorkerQuery = `
  SELECT
    cn.notification_id,
    cn.user_notification_id,
    cn.user_id,
    cn.worker_id,
    cn.service_booked,
    cn.complete_status,
    cn.total_cost,
    cn.created_at
  FROM completenotifications cn
  WHERE cn.worker_id = $1
  AND cn.complete_status = 'workercanceled'
  ORDER BY cn.created_at DESC
  LIMIT $2 OFFSET $3;
`;

const getWorkerCancellationCountQuery = `
  SELECT COUNT(*) AS rejected_count
  FROM completenotifications
  WHERE worker_id = $1
  AND complete_status = 'workercanceled'
  AND DATE(created_at) BETWEEN $2 AND $3;
`;

const getUserCancellationCountQuery = `
  SELECT COUNT(*) AS cancelled_count
  FROM completenotifications
  WHERE user_id = $1
  AND complete_status IN ('usercanceled', 'cancel')
  AND DATE(created_at) BETWEEN $2 AND $3;
`;

// ============================================================================
// BOOKING DETAILS QUERIES
// ============================================================================

const getServiceBookingItemDetailsQuery = `
  SELECT
    st.service_booked,
    st.total_cost,
    st.discount,
    st.time,
    st.created_at,
    w.name,
    w.phone_number,
    un.area,
    ws.profile,
    ws.service
  FROM completenotifications st
  JOIN workersverified w ON st.worker_id = w.worker_id
  JOIN usernotifications un ON st.user_notification_id = un.user_notification_id
  JOIN workerskills ws ON w.worker_id = ws.worker_id
  WHERE st.notification_id = $1;
`;

const getServiceBookingUserItemDetailsQuery = `
  SELECT
    st.service_booked,
    st.total_cost,
    st.discount,
    st.time,
    st.created_at,
    w.name,
    w.phone_number,
    un.area,
    w.profile
  FROM completenotifications st
  JOIN "user" w ON st.user_id = w.user_id
  JOIN usernotifications un ON st.user_notification_id = un.user_notification_id
  WHERE st.notification_id = $1;
`;

const getServiceOngoingItemDetailsQuery = `
  SELECT
    st.service_booked,
    st.total_cost,
    st.discount,
    st.time,
    st.created_at,
    w.name,
    w.phone_number,
    un.area,
    ws.profile,
    ws.service
  FROM accepted st
  JOIN workersverified w ON st.worker_id = w.worker_id
  JOIN usernotifications un ON st.user_notification_id = un.user_notification_id
  JOIN workerskills ws ON w.worker_id = ws.worker_id
  WHERE st.notification_id = $1;
`;

const getServiceOngoingWorkerItemDetailsQuery = `
  SELECT
    st.service_booked,
    st.total_cost,
    st.discount,
    st.time,
    st.created_at,
    w.name,
    w.phone_number,
    un.area
  FROM accepted st
  JOIN "user" w ON st.user_id = w.user_id
  JOIN usernotifications un ON st.user_notification_id = un.user_notification_id
  WHERE st.notification_id = $1;
`;

module.exports = {
  getBookingByIdQuery,
  createBookingQuery,
  updateBookingStatusQuery,
  getBookingsByUserQuery,
  getBookingsByWorkerQuery,
  getActiveBookingsQuery,
  updateBookingActualAmountQuery,
  getBookingsByStatusQuery,
  cancelBookingQuery,
  getBookingCountByStatusQuery,

  // Notification Queries
  storeBookingNotificationQuery,
  getBookingNotificationsQuery,
  markBookingNotificationAsReadQuery,
  getBookingUnreadNotificationCountQuery,
  deleteBookingNotificationQuery,
  getBookingNotificationsByUserQuery,
  updateNotificationStatusByUserNotificationIdQuery,
  updateNotificationCancelStatusQuery,
  checkNotificationExistsByUserNotificationIdQuery,
  deleteNotificationsByUserNotificationIdQuery,

  // Status Update and Tracking Queries
  getBookingStatusHistoryQuery,
  createBookingStatusHistoryQuery,
  updateBookingStatusWithHistoryQuery,

  // Search and Filter Queries
  searchBookingsByServiceTypeQuery,
  getBookingsByDateRangeQuery,
  getUpcomingBookingsQuery,
  getPastBookingsQuery,

  // Complex Join Queries
  getBookingDetailsWithUserAndWorkerQuery,
  getBookingWithPaymentDetailsQuery,
  getUserBookingsSummaryQuery,
  getWorkerBookingsSummaryQuery,
  getBookingsByLocationWithWorkersQuery,
  getBookingsRequiringPaymentQuery,

  // Booking Request Queries
  upsertUserActionQuery,
  upsertWorkerActionQuery,
  acceptRequestCombinedQuery,
  rejectRequestQuery,
  checkAcceptStatusQuery,
  updateCancelStatusQuery,
  getUserFcmTokensQuery,

  // Booking Status Queries
  checkNotificationExistsQuery,
  getServiceCallEndTimeQuery,
  getNavigationStatusQuery,

  // Booking Location Queries
  getUserAndWorkerLocationQuery,
  getWorkerLocationFromAcceptedQuery,
  getBookingLocationByIdQuery,
  updateNavigationStatusQuery,
  updateUserNavigationStatusQuery,
  getNavigationDetailsQuery,

  // Booking Details Queries
  getServiceBookingItemDetailsQuery,
  getServiceBookingUserItemDetailsQuery,
  getServiceOngoingItemDetailsQuery,
  getServiceOngoingWorkerItemDetailsQuery,

  // Booking Status Update Queries
  updateBookingStatusToAcceptedQuery,
  updateBookingStatusToRejectedQuery,
  updateBookingStatusToConfirmedQuery,
  updateBookingStatusToInProgressQuery,
  updateBookingStatusToCompletedQuery,
  updateBookingStatusToCancelledQuery,

  // Booking Cancellation Queries
  cancelBookingByUserQuery,
  cancelBookingByWorkerQuery,
  trackBookingCancellationQuery,
  getCancellationByBookingIdQuery,
  getCancellationStatsByDateRangeQuery,
  updateAcceptedNavigationCancelStatusQuery,
  updateAcceptedUserNavigationCancelStatusQuery,
  checkCancellationStatusQuery,
  updateCompleteStatusToCancelQuery,

  // Booking Accept/Reject Workflow Queries
  updateAcceptedStatusQuery,
  getAcceptedBookingDetailsQuery,
  getAcceptedBookingsByWorkerQuery,
  getAcceptedBookingsByUserQuery,
  checkWorkerAcceptedBookingQuery,
  deleteAcceptedBookingAfterCancellationQuery,

  // Pending Bookings Queries
  getPendingBookingsQuery,
  getPendingBookingsByUserQuery,
  getPendingBookingsByWorkerQuery,
  getPendingNotificationsQuery,
  countPendingBookingsByStatusQuery,

  // Booking Workflow Status History Queries
  getBookingWorkflowHistoryQuery,
  createBookingWorkflowHistoryQuery,
  getRecentStatusChangesQuery,
  getBookingStatusChangeCountQuery,

  // Completed and Cancelled Bookings Queries
  getCompletedBookingsQuery,
  getCancelledBookingsQuery,
  getCancelledBookingsByUserQuery,
  getCancelledBookingsByWorkerQuery,
  getWorkerCancellationCountQuery,
  getUserCancellationCountQuery,
};
