// Worker SQL Queries
// Centralized query definitions for all worker-related operations

const workerQueries = {
  // ==========================================
  // NAVIGATION & CANCELLATION QUERIES
  // ==========================================

  // Update user action to remove tracking entry
  updateUserBackgroundAction: `
    UPDATE useraction
    SET track = COALESCE((
      SELECT jsonb_agg(elem)
      FROM (
        SELECT
          CASE
            WHEN elem->>'encodedId' = $2 THEN NULL
            ELSE elem
          END AS elem
        FROM jsonb_array_elements(track) AS elem
      ) AS sub
      WHERE elem IS NOT NULL
    ), '[]'::jsonb)
    WHERE user_id = $1
  `,

  // Update worker action screen
  updateWorkerActionScreen: `
    UPDATE workeraction
    SET screen_name = $2
    WHERE worker_id = $1
  `,

  // Simple worker cancellation - update navigation status
  updateNavigationToCanceled: `
    UPDATE accepted
    SET navigation_status = 'workercanceled'
    WHERE notification_id = $1
    AND (navigation_status IS NULL OR navigation_status != 'timeup')
    RETURNING navigation_status
  `,

  // Get navigation cancellation status
  getNavigationStatus: `
    SELECT navigation_status
    FROM accepted
    WHERE notification_id = $1
  `,

  // Complete worker navigation cancellation with service completion
  completeWorkerNavigationCancel: `
    WITH updated AS (
      UPDATE accepted
      SET user_navigation_cancel_status = 'workercanceled'
      WHERE notification_id = $1
      RETURNING
        accepted_id,
        user_id,
        user_notification_id,
        longitude,
        latitude,
        created_at,
        worker_id,
        service_booked,
        time,
        discount,
        total_cost,
        tip_amount,
        coupons_applied
    ),
    inserted AS (
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
      SELECT
        accepted_id,
        $1,
        user_id,
        user_notification_id,
        longitude,
        latitude,
        created_at,
        worker_id,
        'workercanceled',
        service_booked,
        time,
        discount,
        total_cost,
        tip_amount
      FROM updated
      RETURNING
        user_id,
        service_booked,
        worker_id
    ),
    user_updated AS (
      UPDATE "user" AS u
      SET offers_used = (
        SELECT jsonb_agg(
          CASE
            WHEN elem->>'offer_code' = $2 THEN elem || '{"status":"pending"}'
            ELSE elem
          END
        )
        FROM jsonb_array_elements(u.offers_used) AS elem
      )
      WHERE u.user_id IN (SELECT user_id FROM updated)
        AND EXISTS (
          SELECT 1
          FROM updated a
          WHERE a.user_id = u.user_id
            AND a.coupons_applied IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM jsonb_array_elements(a.coupons_applied) AS ac
              WHERE ac->>'offer_code' = $2
            )
        )
      RETURNING u.user_id
    )
    SELECT
      i.user_id,
      f.fcm_token,
      i.service_booked,
      i.worker_id
    FROM inserted i
    JOIN userfcm f ON f.user_id = i.user_id
  `,

  // Delete accepted record after cancellation
  deleteAcceptedRecord: `
    DELETE FROM accepted WHERE notification_id = $1
  `,

  // ==========================================
  // BOOKING QUERY OPERATIONS
  // ==========================================

  // Get all completed bookings for a worker
  getWorkerBookings: `
    SELECT
      n.notification_id,
      n.service_booked,
      n.created_at,
      n.total_cost,
      n.complete_status,
      w.name AS provider,
      ws.profile AS worker_profile
    FROM completenotifications n
    JOIN workersverified w ON n.worker_id = w.worker_id
    JOIN workerskills ws ON w.worker_id = ws.worker_id
    WHERE n.worker_id = $1
    ORDER BY n.created_at DESC
  `,

  // Get ongoing bookings for a worker
  getWorkerOngoingBookings: `
    SELECT
      n.notification_id,
      n.service_booked,
      n.created_at,
      n.total_cost,
      w.name AS provider
    FROM accepted n
    JOIN workersverified w ON n.worker_id = w.worker_id
    WHERE n.worker_id = $1
    ORDER BY n.created_at DESC
  `,

  // Get work in progress details for a notification
  getWorkInProgressDetails: `
    SELECT
      a.service_booked,
      a.time,
      a.created_at,
      a.service_status,
      u.area
    FROM accepted a
    JOIN usernotifications u ON a.user_notification_id = u.user_notification_id
    WHERE a.notification_id = $1
  `,

  // ==========================================
  // SERVICE HISTORY QUERIES
  // ==========================================

  // Get current active service for a worker
  getCurrentService: `
    SELECT
      screen_name,
      params
    FROM workeraction
    WHERE worker_id = $1
  `,

  // Get service history for a worker (completed services with payments)
  getWorkerServiceHistory: `
    SELECT
      payment,
      payment_type,
      end_time
    FROM servicecall
    WHERE worker_id = $1
      AND payment IS NOT NULL
  `,

  // ==========================================
  // SERVICE STATUS QUERIES
  // ==========================================

  // Update worker's service status and return user FCM tokens
  // Note: statusKey parameter needs to be interpolated in the query string
  updateServiceStatusTemplate: (statusKey) => `
    WITH updated AS (
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
      RETURNING notification_id, service_status, user_id
    )
    SELECT updated.notification_id, updated.service_status, uf.fcm_token
    FROM updated
    JOIN userfcm uf ON updated.user_id = uf.user_id
  `,

  // ==========================================
  // LIFETIME STATISTICS QUERIES
  // ==========================================

  // Get worker lifetime details including earnings, ratings, and feedback
  getWorkerLifeDetails: `
    SELECT
      wl.service_counts,
      wl.money_earned,
      wl.average_rating,
      ws.profile,
      un.area,
      un.city,
      un.pincode,
      n.notification_id,
      sc.time_worked,
      u.name AS user_name,
      f.name AS feedback_name,
      f.rating AS feedback_rating,
      f.comment,
      f.created_at,
      (SELECT AVG(rating) FROM feedback WHERE worker_id = $1) AS average_rating
    FROM workerlife wl
    INNER JOIN workerskills ws ON wl.worker_id = ws.worker_id
    INNER JOIN servicecall sc ON wl.worker_id = sc.worker_id
    INNER JOIN notifications n ON sc.notification_id = n.notification_id
    INNER JOIN usernotifications un ON n.user_notification_id = un.user_notification_id
    INNER JOIN "user" u ON n.user_id = u.user_id
    INNER JOIN feedback f ON n.notification_id = f.notification_id
    WHERE wl.worker_id = $1
    ORDER BY n.notification_id DESC
    LIMIT 5
  `,

  // Update worker lifetime statistics (earnings and service count)
  updateWorkerLifeStats: `
    UPDATE workerlife
    SET
      money_earned = money_earned + $1,
      service_counts = service_counts + 1
    WHERE worker_id = $2
    RETURNING money_earned, service_counts
  `,

  // ==========================================
  // WORKER DETAILS QUERIES
  // ==========================================

  // Get comprehensive worker details for a notification
  getWorkerDetailsByNotification: `
    SELECT
      accepted.service_booked,
      accepted.discount,
      accepted.total_cost,
      workersverified.name,
      usernotifications.area,
      usernotifications.city,
      usernotifications.pincode,
      workerskills.profile
    FROM accepted
    INNER JOIN workersverified ON accepted.worker_id = workersverified.worker_id
    INNER JOIN usernotifications ON accepted.user_notification_id = usernotifications.user_notification_id
    INNER JOIN workerskills ON accepted.worker_id = workerskills.worker_id
    WHERE accepted.notification_id = $1
  `,

  // Get basic worker details (name and service)
  getBasicWorkerDetails: `
    SELECT
      w.name AS worker_name,
      u.service AS service
    FROM accepted n
    JOIN workersverified w ON n.worker_id = w.worker_id
    JOIN usernotifications u ON n.user_notification_id = u.user_notification_id
    WHERE n.notification_id = $1
  `,

  // ==========================================
  // NOTIFICATION QUERIES
  // ==========================================

  // Get FCM tokens for workers (paginated)
  getWorkerFcmTokensPaginated: `
    SELECT fcm_token
    FROM workerfcm
    WHERE worker_id = ANY($1::int[])
      AND is_active = TRUE
      AND fcm_token IS NOT NULL
      AND fcm_token <> ''
    ORDER BY worker_id, fcm_token
    LIMIT $2 OFFSET $3
  `,

  // Get worker notifications
  getWorkerNotifications: `
    SELECT title, body, encodedId, data, receivedat
    FROM workernotifications
    WHERE worker_id = $1 AND fcm_token = $2
    ORDER BY receivedat DESC
    LIMIT 10
  `,

  // Store worker notification
  storeWorkerNotification: `
    INSERT INTO workernotifications (title, body, data, receivedat, worker_id, encodedid, fcm_token)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `,

  // Store/Update FCM token for worker
  storeFcmToken: `
    WITH delete_matched AS (
      DELETE FROM fcm
      WHERE fcm_token = $2
    )
    INSERT INTO fcm (worker_id, fcm_token)
    VALUES ($1, $2)
    ON CONFLICT (worker_id, fcm_token)
    DO NOTHING
    RETURNING worker_id, fcm_token
  `,

  // ==========================================
  // ACTION & TRACKING QUERIES
  // ==========================================

  // Create or update worker action
  createWorkerAction: `
    INSERT INTO workeraction (worker_id, screen_name, params)
    VALUES ($1, $2, $3)
    ON CONFLICT (worker_id) DO UPDATE
    SET params = $3, screen_name = $2
    RETURNING *
  `,

  // Get worker track route
  getWorkerTrackRoute: `
    SELECT wv.name, wv.no_due, wa.screen_name, wa.params
    FROM workeraction wa
    JOIN workersverified wv ON wa.worker_id = wv.worker_id
    WHERE wa.worker_id = $1
  `,

  // Worker screen change with user action update
  workerScreenChange: `
    WITH updated_worker AS (
      UPDATE workeraction
      SET screen_name = CASE WHEN $2 = '' THEN '' ELSE $2 END
      WHERE worker_id = $1
      RETURNING worker_id
    ),
    updated_useraction AS (
      UPDATE useraction
      SET track = COALESCE((
        SELECT jsonb_agg(new_elem)
        FROM (
          SELECT
            CASE
              WHEN elem->>'encodedId' = $3 THEN
                CASE
                  WHEN $2 = '' THEN NULL
                  ELSE jsonb_set(elem, '{screen}', to_jsonb($2))
                END
              ELSE elem
            END AS new_elem
          FROM jsonb_array_elements(track) AS elem
        ) AS sub
        WHERE new_elem IS NOT NULL
      ), '[]'::jsonb)
      WHERE user_id IN (
        SELECT user_id FROM accepted WHERE worker_id = $1
      )
      RETURNING user_id, track
    )
    SELECT * FROM updated_useraction
  `,

  // ==========================================
  // COMMUNICATION QUERIES
  // ==========================================

  // Get phone numbers for tracking call
  getTrackingCallNumbers: `
    SELECT
      u.phone_number AS from_number,
      w.phone_number AS mobile_number
    FROM servicetracking s
    JOIN "user" u ON s.user_id = u.user_id
    JOIN workersverified w ON s.worker_id = w.worker_id
    WHERE s.tracking_id = $1
  `,

  // Get phone numbers for regular call
  getCallNumbers: `
    SELECT
      u.phone_number AS from_number,
      w.phone_number AS mobile_number
    FROM accepted a
    JOIN "user" u ON a.user_id = u.user_id
    JOIN workersverified w ON a.worker_id = w.worker_id
    WHERE a.notification_id = $1
  `,

  // Get FCM tokens for worker messaging
  getWorkerFcmTokens: `
    SELECT fcm_token
    FROM fcm
    WHERE worker_id = $1
  `,

  // Get messages for a request
  getWorkerMessages: `
    SELECT messages
    FROM accepted
    WHERE notification_id = $1
  `,

  // ==========================================
  // VERIFICATION QUERIES
  // ==========================================

  // Approve worker - move from workers to workersverified
  approveWorker: `
    WITH moved_worker AS (
      DELETE FROM workers
      WHERE worker_id = $1
      RETURNING worker_id, name, email, phone_number, contact_id
    ),
    inserted_worker AS (
      INSERT INTO workersverified (worker_id, name, email, phone_number, contact_id)
      SELECT worker_id, name, email, phone_number, contact_id
      FROM moved_worker
      RETURNING worker_id
    ),
    life_insert AS (
      INSERT INTO workerlife (worker_id)
      SELECT worker_id
      FROM inserted_worker
      RETURNING worker_id
    )
    SELECT fcm_token
    FROM fcm
    WHERE worker_id IN (SELECT worker_id FROM inserted_worker)
  `,

  // Search worker by phone number
  searchWorkerByPhone: `
    SELECT
      w.worker_id,
      w.name,
      w.email,
      ws.profile,
      ws.service,
      ws.subservices,
      ws.personaldetails,
      ws.address,
      wl.balance_amount,
      wl.service_counts,
      wl.money_earned,
      wl.average_rating
    FROM workersverified w
    LEFT JOIN workerskills ws ON w.worker_id = ws.worker_id
    LEFT JOIN workerlife wl ON w.worker_id = wl.worker_id
    WHERE w.phone_number = $1
  `,

  // ==========================================
  // LOCATION & NAVIGATION QUERIES
  // ==========================================

  // Store/Update worker location
  storeWorkerLocation: `
    INSERT INTO workerLocation (longitude, latitude, worker_id)
    VALUES ($1, $2, $3)
    ON CONFLICT (worker_id)
    DO UPDATE SET longitude = EXCLUDED.longitude, latitude = EXCLUDED.latitude
  `,

  // Get worker navigation details
  getWorkerNavigationDetails: `
    SELECT
      n.pin,
      n.service_booked,
      w.name,
      w.phone_number,
      un.area,
      ws.profile,
      wl.average_rating,
      wl.service_counts
    FROM accepted n
    JOIN workersverified w ON n.worker_id = w.worker_id
    JOIN usernotifications un ON n.user_notification_id = un.user_notification_id
    JOIN workerskills ws ON n.worker_id = ws.worker_id
    JOIN workerlife wl ON n.worker_id = wl.worker_id
    WHERE n.notification_id = $1
  `,

  // Get nearby workers - Step 1: Insert user notification and find matching workers
  getNearbyWorkersStep1: `
    WITH user_loc AS (
      SELECT u.user_id, ul.longitude, ul.latitude
      FROM "user" u
      JOIN userlocation ul ON u.user_id = ul.user_id
      WHERE u.user_id = $1
    ),
    inserted_user_notifications AS (
      INSERT INTO userNotifications (
        user_id, longitude, latitude, created_at,
        area, pincode, city, alternate_name,
        alternate_phone_number, service_booked
      )
      SELECT
        user_loc.user_id,
        user_loc.longitude,
        user_loc.latitude,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8
      FROM user_loc
      RETURNING user_notification_id
    ),
    matching_workers AS (
      SELECT ws.worker_id
      FROM workerskills ws
      JOIN workersverified wv ON ws.worker_id = wv.worker_id
      WHERE $9::text[] <@ ws.subservices
        AND wv.no_due = TRUE
      GROUP BY ws.worker_id
    )
    SELECT
      (SELECT user_notification_id FROM inserted_user_notifications) AS user_notification_id,
      array_agg(mw.worker_id) AS worker_ids,
      (SELECT latitude FROM user_loc) AS user_lat,
      (SELECT longitude FROM user_loc) AS user_lon
    FROM matching_workers mw
  `,

  // Get nearby workers - Step 2: Insert notifications and get FCM tokens
  getNearbyWorkersStep2: `
    WITH insert_notifications AS (
      INSERT INTO notifications (
        user_notification_id, user_id, worker_id,
        longitude, latitude, created_at, pin, service_booked,
        discount, coupons_applied, total_cost, tip_amount
      )
      SELECT
        $1,
        $2,
        w.worker_id,
        $3,
        $4,
        $5,
        $6,
        $7,
        $9,
        $12,
        $10,
        $11
      FROM UNNEST($8::int[]) AS w(worker_id)
      RETURNING worker_id
    ),
    fcm_tokens AS (
      SELECT fcm_token
      FROM fcm
      WHERE worker_id IN (SELECT worker_id FROM insert_notifications)
    )
    SELECT array_agg(fcm_token) AS tokens
    FROM fcm_tokens
  `,

  // Update offers_used with 'status: applied'
  updateOfferStatus: `
    UPDATE "user"
    SET offers_used = (
      SELECT jsonb_agg(
        CASE
          WHEN elem->>'offer_code' = $1
            THEN elem || '{"status":"applied"}'
          ELSE elem
        END
      )
      FROM jsonb_array_elements("user".offers_used) elem
    )
    WHERE user_id = $2
  `,
};

module.exports = workerQueries;
