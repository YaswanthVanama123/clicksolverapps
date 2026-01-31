/**
 * Worker Database Queries
 * Contains common SQL queries for worker operations
 */

const getWorkerByIdQuery = `
  SELECT id, user_id, specialization, bio, hourly_rate, rating, total_jobs,
         location, latitude, longitude, is_available, verified, created_at, updated_at
  FROM workers
  WHERE id = $1 AND deleted_at IS NULL;
`;

const createWorkerQuery = `
  INSERT INTO workers (user_id, specialization, bio, hourly_rate, location,
                       latitude, longitude, is_available, verified, created_at, updated_at)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, user_id, specialization, bio, hourly_rate, rating, total_jobs,
            location, latitude, longitude, is_available, verified, created_at, updated_at;
`;

const updateWorkerQuery = `
  UPDATE workers
  SET specialization = COALESCE($2, specialization),
      bio = COALESCE($3, bio),
      hourly_rate = COALESCE($4, hourly_rate),
      location = COALESCE($5, location),
      latitude = COALESCE($6, latitude),
      longitude = COALESCE($7, longitude),
      is_available = COALESCE($8, is_available),
      verified = COALESCE($9, verified),
      updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, user_id, specialization, bio, hourly_rate, rating, total_jobs,
            location, latitude, longitude, is_available, verified, created_at, updated_at;
`;

const getWorkersByLocationQuery = `
  SELECT id, user_id, specialization, bio, hourly_rate, rating, total_jobs,
         location, latitude, longitude, is_available, verified, created_at, updated_at
  FROM workers
  WHERE location = $1 AND is_available = true AND deleted_at IS NULL
  ORDER BY rating DESC, total_jobs DESC
  LIMIT $2 OFFSET $3;
`;

const getAvailableWorkersBySpecializationQuery = `
  SELECT id, user_id, specialization, bio, hourly_rate, rating, total_jobs,
         location, latitude, longitude, is_available, verified, created_at, updated_at
  FROM workers
  WHERE specialization = $1 AND is_available = true AND deleted_at IS NULL
  ORDER BY rating DESC, total_jobs DESC
  LIMIT $2 OFFSET $3;
`;

const getWorkersByLocationAndSpecializationQuery = `
  SELECT id, user_id, specialization, bio, hourly_rate, rating, total_jobs,
         location, latitude, longitude, is_available, verified, created_at, updated_at
  FROM workers
  WHERE location = $1 AND specialization = $2 AND is_available = true AND deleted_at IS NULL
  ORDER BY rating DESC, total_jobs DESC
  LIMIT $3 OFFSET $4;
`;

const updateWorkerRatingQuery = `
  UPDATE workers
  SET rating = $2, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, rating, updated_at;
`;

const updateWorkerTotalJobsQuery = `
  UPDATE workers
  SET total_jobs = total_jobs + 1, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, total_jobs, updated_at;
`;

const deleteWorkerQuery = `
  UPDATE workers
  SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id;
`;

// ============================================================================
// AVAILABILITY QUERIES
// ============================================================================

const updateWorkerAvailabilityQuery = `
  UPDATE workers
  SET is_available = $2, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, is_available, updated_at;
`;

const getAvailableWorkersCountQuery = `
  SELECT COUNT(*) as available_count
  FROM workers
  WHERE is_available = true AND deleted_at IS NULL;
`;

const getWorkerAvailabilityStatusQuery = `
  SELECT id, user_id, is_available, updated_at
  FROM workers
  WHERE id = $1 AND deleted_at IS NULL;
`;

// ============================================================================
// FCM TOKEN QUERIES
// ============================================================================

const storeWorkerFcmTokenQuery = `
  INSERT INTO fcm_tokens (user_id, user_type, token, device_id, device_type, created_at, updated_at)
  VALUES ($1, 'worker', $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, user_id, token, device_id, device_type, created_at, updated_at;
`;

const updateWorkerFcmTokenQuery = `
  UPDATE fcm_tokens
  SET token = $2, updated_at = CURRENT_TIMESTAMP
  WHERE user_id = $1 AND device_id = $3 AND user_type = 'worker'
  RETURNING id, user_id, token, device_id, updated_at;
`;

const getWorkerFcmTokensQuery = `
  SELECT id, user_id, token, device_id, device_type, created_at, updated_at
  FROM fcm_tokens
  WHERE user_id = $1 AND user_type = 'worker'
  ORDER BY updated_at DESC;
`;

const deleteWorkerFcmTokenQuery = `
  DELETE FROM fcm_tokens
  WHERE user_id = $1 AND device_id = $2 AND user_type = 'worker'
  RETURNING id;
`;

const storeWorkerFcmTokenWithDeleteQuery = `
  WITH delete_matched AS (
    DELETE FROM fcm
    WHERE fcm_token = $2
  )
  INSERT INTO fcm (worker_id, fcm_token)
  VALUES ($1, $2)
  ON CONFLICT (worker_id, fcm_token)
  DO NOTHING
  RETURNING worker_id, fcm_token;
`;

const storeWorkerReceivedNotificationQuery = `
  INSERT INTO workernotifications (title, body, data, receivedat, worker_id, encodedid, fcm_token)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  RETURNING *;
`;

const getWorkerReceivedNotificationsQuery = `
  SELECT title, body, encodedId, data, receivedat
  FROM workernotifications
  WHERE worker_id = $1 AND fcm_token = $2
  ORDER BY receivedat DESC
  LIMIT 10;
`;

const getWorkerFcmTokensForBatchQuery = `
  SELECT fcm_token
  FROM workerfcm
  WHERE worker_id = ANY($1::int[])
    AND is_active = TRUE
    AND fcm_token IS NOT NULL
    AND fcm_token <> ''
  ORDER BY worker_id, fcm_token
  LIMIT $2 OFFSET $3;
`;

const deleteWorkerFcmTokenByTokenQuery = `
  DELETE FROM fcm
  WHERE fcm_token = $1
  RETURNING worker_id, fcm_token;
`;

const getActiveWorkerFcmTokensQuery = `
  SELECT worker_id, fcm_token
  FROM fcm
  WHERE worker_id = $1
  ORDER BY worker_id;
`;

const getAllActiveWorkerFcmTokensQuery = `
  SELECT f.worker_id, f.fcm_token
  FROM fcm f
  INNER JOIN workersverified wv ON f.worker_id = wv.worker_id
  WHERE wv.no_due = TRUE
  ORDER BY f.worker_id;
`;

// ============================================================================
// NOTIFICATION QUERIES
// ============================================================================

const storeWorkerNotificationQuery = `
  INSERT INTO notifications (user_id, user_type, title, body, notification_type, related_id, related_type, data, is_read, created_at, updated_at)
  VALUES ($1, 'worker', $2, $3, $4, $5, $6, $7, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, user_id, title, body, notification_type, is_read, created_at;
`;

const getWorkerNotificationsQuery = `
  SELECT id, user_id, title, body, notification_type, related_id, related_type, data, is_read, created_at, updated_at
  FROM notifications
  WHERE user_id = $1 AND user_type = 'worker'
  ORDER BY created_at DESC
  LIMIT $2 OFFSET $3;
`;

const getWorkerUnreadNotificationCountQuery = `
  SELECT COUNT(*) as unread_count
  FROM notifications
  WHERE user_id = $1 AND user_type = 'worker' AND is_read = false;
`;

const markWorkerNotificationAsReadQuery = `
  UPDATE notifications
  SET is_read = true, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND user_id = $2 AND user_type = 'worker'
  RETURNING id, is_read, updated_at;
`;

const deleteWorkerNotificationQuery = `
  DELETE FROM notifications
  WHERE id = $1 AND user_id = $2 AND user_type = 'worker'
  RETURNING id;
`;

const markAllWorkerNotificationsAsReadQuery = `
  UPDATE notifications
  SET is_read = true, updated_at = CURRENT_TIMESTAMP
  WHERE user_id = $1 AND user_type = 'worker' AND is_read = false
  RETURNING id;
`;

// ============================================================================
// STATUS UPDATE QUERIES
// ============================================================================

const updateWorkerVerificationStatusQuery = `
  UPDATE workers
  SET verified = $2, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, verified, updated_at;
`;

const getWorkerVerificationStatusQuery = `
  SELECT id, verified, created_at, updated_at
  FROM workers
  WHERE id = $1 AND deleted_at IS NULL;
`;

const getUnverifiedWorkersQuery = `
  SELECT id, user_id, specialization, bio, hourly_rate, rating, total_jobs,
         location, latitude, longitude, is_available, created_at
  FROM workers
  WHERE verified = false AND deleted_at IS NULL
  ORDER BY created_at ASC
  LIMIT $1 OFFSET $2;
`;

// ============================================================================
// WORKER VERIFICATION AND APPROVAL QUERIES
// ============================================================================

const getWorkerVerificationDetailsQuery = `
  SELECT
    w.worker_id,
    w.name,
    w.phone_number,
    w.email,
    w.verification_status,
    w.issues,
    w.created_at,
    ws.profile,
    ws.proof,
    ws.service,
    ws.subservices,
    ws.personaldetails,
    ws.address,
    ws.agree
  FROM workers w
  LEFT JOIN workerskills ws ON w.worker_id = ws.worker_id
  WHERE w.worker_id = $1;
`;

const updateWorkerVerificationStatusV2Query = `
  UPDATE workers
  SET verification_status = $2
  WHERE worker_id = $1
  RETURNING worker_id, verification_status;
`;

const getWorkersVerificationStatusQuery = `
  SELECT
    w.worker_id,
    w.name,
    w.phone_number,
    w.verification_status,
    w.issues,
    w.created_at,
    ws.service,
    ws.profile
  FROM workers w
  LEFT JOIN workerskills ws ON w.worker_id = ws.worker_id
  WHERE w.verification_status != 'Approved'
  ORDER BY w.created_at DESC;
`;

const getWorkerByPhoneNumberQuery = `
  SELECT
    w.worker_id,
    w.name,
    w.phone_number,
    w.email,
    w.verification_status,
    w.issues,
    w.created_at
  FROM workers w
  WHERE w.phone_number = $1;
`;

const getVerifiedWorkerByPhoneNumberQuery = `
  SELECT
    wv.worker_id,
    wv.name,
    wv.phone_number,
    wv.email,
    wv.created_at,
    ws.profile,
    ws.service,
    ws.subservices
  FROM workersverified wv
  LEFT JOIN workerskills ws ON wv.worker_id = ws.worker_id
  WHERE wv.phone_number = $1;
`;

// ============================================================================
// DOCUMENT VERIFICATION QUERIES
// ============================================================================

const getWorkerDocumentsQuery = `
  SELECT
    ws.worker_id,
    ws.profile,
    ws.proof,
    ws.personaldetails,
    ws.address,
    ws.agree,
    w.name,
    w.phone_number,
    w.verification_status
  FROM workerskills ws
  JOIN workers w ON ws.worker_id = w.worker_id
  WHERE ws.worker_id = $1;
`;

const updateWorkerDocumentsQuery = `
  UPDATE workerskills
  SET
    profile = COALESCE($2, profile),
    proof = COALESCE($3, proof),
    personaldetails = COALESCE($4, personaldetails),
    address = COALESCE($5, address)
  WHERE worker_id = $1
  RETURNING *;
`;

const verifyWorkerDocumentsQuery = `
  UPDATE workers
  SET
    verification_status = 'Documents Verified',
    issues = jsonb_set(
      COALESCE(issues, '{}'::jsonb),
      '{document_verification}',
      jsonb_build_object(
        'status', 'verified',
        'verified_at', NOW()::text,
        'verified_by', $2
      )
    )
  WHERE worker_id = $1
  RETURNING worker_id, verification_status, issues;
`;

const rejectWorkerDocumentsQuery = `
  UPDATE workers
  SET
    verification_status = 'Documents Rejected',
    issues = $2::jsonb
  WHERE worker_id = $1
  RETURNING worker_id, verification_status, issues;
`;

// ============================================================================
// WORKER APPROVAL WORKFLOW QUERIES
// ============================================================================

const approveWorkerRegistrationQuery = `
  WITH moved_worker AS (
    DELETE FROM workers
    WHERE worker_id = $1
    RETURNING worker_id, name, email, phone_number, contact_id
  ),
  inserted_worker AS (
    INSERT INTO workersverified (worker_id, name, email, phone_number, contact_id)
    SELECT worker_id, name, email, phone_number, contact_id
    FROM moved_worker
    RETURNING worker_id, name, phone_number
  ),
  life_insert AS (
    INSERT INTO workerlife (worker_id, service_counts, money_earned, average_rating, balance_amount)
    SELECT worker_id, 0, 0, 0.0, 0.0
    FROM inserted_worker
    RETURNING worker_id
  )
  SELECT
    iw.worker_id,
    iw.name,
    iw.phone_number,
    (SELECT array_agg(fcm_token) FROM fcm WHERE worker_id = iw.worker_id) as fcm_tokens
  FROM inserted_worker iw;
`;

const getPendingApprovalWorkersQuery = `
  SELECT
    w.worker_id,
    w.name,
    w.phone_number,
    w.email,
    w.verification_status,
    w.issues,
    w.created_at,
    ws.profile,
    ws.service,
    ws.subservices,
    CASE
      WHEN ws.worker_id IS NOT NULL THEN true
      ELSE false
    END as has_skills
  FROM workers w
  LEFT JOIN workerskills ws ON w.worker_id = ws.worker_id
  WHERE w.verification_status IN ('Mobile Number Verified', 'Documents Verified')
  ORDER BY w.created_at ASC;
`;

const getPendingApprovalWorkersCountQuery = `
  SELECT COUNT(*) as count
  FROM workers w
  WHERE w.verification_status IN ('Mobile Number Verified', 'Documents Verified');
`;

const updateWorkerApprovalIssuesQuery = `
  UPDATE workers
  SET
    issues = $2::jsonb,
    verification_status = 'Pending Corrections'
  WHERE worker_id = $1
  RETURNING worker_id, verification_status, issues;
`;

// ============================================================================
// WORKER ONBOARDING STEP QUERIES
// ============================================================================

const getWorkerOnboardingStatusQuery = `
  SELECT
    EXISTS (SELECT 1 FROM workers WHERE worker_id = $1) AS registered,
    EXISTS (SELECT 1 FROM workerskills WHERE worker_id = $1) AS skills_added,
    EXISTS (SELECT 1 FROM bank_accounts WHERE worker_id = $1) AS bank_account_added,
    EXISTS (SELECT 1 FROM upi_accounts WHERE worker_id = $1) AS upi_account_added,
    (
      SELECT verification_status
      FROM workers
      WHERE worker_id = $1
      UNION ALL
      SELECT 'Approved'
      FROM workersverified
      WHERE worker_id = $1
      LIMIT 1
    ) AS verification_status;
`;

const completeWorkerOnboardingStepQuery = `
  UPDATE workers
  SET
    onboarding_status = jsonb_set(
      COALESCE(onboarding_status, '{}'::jsonb),
      $2::text[],
      'true'::jsonb
    )
  WHERE worker_id = $1
  RETURNING worker_id, onboarding_status;
`;

const getWorkerOnboardingProgressQuery = `
  SELECT
    w.worker_id,
    w.name,
    w.phone_number,
    w.verification_status,
    w.onboarding_status,
    CASE
      WHEN ws.worker_id IS NOT NULL THEN true
      ELSE false
    END as has_skills,
    CASE
      WHEN ba.worker_id IS NOT NULL THEN true
      ELSE false
    END as has_bank_account,
    CASE
      WHEN ua.worker_id IS NOT NULL THEN true
      ELSE false
    END as has_upi_account,
    CASE
      WHEN wv.worker_id IS NOT NULL THEN true
      ELSE false
    END as is_verified
  FROM workers w
  LEFT JOIN workerskills ws ON w.worker_id = ws.worker_id
  LEFT JOIN bank_accounts ba ON w.worker_id = ba.worker_id
  LEFT JOIN upi_accounts ua ON w.worker_id = ua.worker_id
  LEFT JOIN workersverified wv ON w.worker_id = wv.worker_id
  WHERE w.worker_id = $1;
`;

// ============================================================================
// SKILLS REGISTRATION QUERIES
// ============================================================================

const getWorkerSkillsQuery = `
  SELECT
    worker_id,
    service,
    subservices,
    profile,
    proof,
    personaldetails,
    address,
    agree
  FROM workerskills
  WHERE worker_id = $1;
`;

const updateWorkerSkillsQuery = `
  UPDATE workerskills
  SET
    service = COALESCE($2, service),
    subservices = COALESCE($3, subservices),
    profile = COALESCE($4, profile),
    proof = COALESCE($5, proof),
    personaldetails = COALESCE($6, personaldetails),
    address = COALESCE($7, address),
    agree = COALESCE($8, agree)
  WHERE worker_id = $1
  RETURNING *;
`;

const deleteWorkerSkillsQuery = `
  DELETE FROM workerskills
  WHERE worker_id = $1
  RETURNING worker_id;
`;

// ============================================================================
// WORKER APPROVAL STATUS TRACKING QUERIES
// ============================================================================

const logWorkerApprovalActionQuery = `
  INSERT INTO worker_approval_log (
    worker_id,
    action,
    performed_by,
    previous_status,
    new_status,
    notes,
    created_at
  )
  VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
  RETURNING *;
`;

const getWorkerApprovalHistoryQuery = `
  SELECT
    worker_id,
    action,
    performed_by,
    previous_status,
    new_status,
    notes,
    created_at
  FROM worker_approval_log
  WHERE worker_id = $1
  ORDER BY created_at DESC;
`;

const getWorkersApprovedTodayQuery = `
  SELECT
    wv.worker_id,
    wv.name,
    wv.phone_number,
    wv.created_at,
    ws.service,
    ws.profile
  FROM workersverified wv
  LEFT JOIN workerskills ws ON wv.worker_id = ws.worker_id
  WHERE DATE(wv.created_at) = CURRENT_DATE
  ORDER BY wv.created_at DESC;
`;

const getWorkersApprovedInRangeQuery = `
  SELECT
    wv.worker_id,
    wv.name,
    wv.phone_number,
    wv.created_at,
    ws.service,
    ws.profile
  FROM workersverified wv
  LEFT JOIN workerskills ws ON wv.worker_id = ws.worker_id
  WHERE DATE(wv.created_at) BETWEEN $1 AND $2
  ORDER BY wv.created_at DESC;
`;

// ============================================================================
// SEARCH AND FILTER QUERIES
// ============================================================================

const searchWorkersByNameQuery = `
  SELECT w.id, w.user_id, w.specialization, w.bio, w.hourly_rate, w.rating, w.total_jobs,
         w.location, w.latitude, w.longitude, w.is_available, w.verified,
         u.name, u.email, u.phone
  FROM workers w
  JOIN users u ON w.user_id = u.id
  WHERE (u.name ILIKE $1 OR w.specialization ILIKE $1) AND w.deleted_at IS NULL AND u.deleted_at IS NULL
  ORDER BY w.rating DESC, w.total_jobs DESC
  LIMIT $2 OFFSET $3;
`;

const searchWorkersBySpecializationAndLocationQuery = `
  SELECT id, user_id, specialization, bio, hourly_rate, rating, total_jobs,
         location, latitude, longitude, is_available, verified, created_at, updated_at
  FROM workers
  WHERE specialization = $1 AND location = $2 AND is_available = true AND deleted_at IS NULL
  ORDER BY rating DESC, total_jobs DESC
  LIMIT $3 OFFSET $4;
`;

const getWorkersByRatingRangeQuery = `
  SELECT id, user_id, specialization, bio, hourly_rate, rating, total_jobs,
         location, latitude, longitude, is_available, verified, created_at
  FROM workers
  WHERE rating >= $1 AND rating <= $2 AND deleted_at IS NULL
  ORDER BY rating DESC, total_jobs DESC
  LIMIT $3 OFFSET $4;
`;

const getTopRatedWorkersQuery = `
  SELECT id, user_id, specialization, bio, hourly_rate, rating, total_jobs,
         location, latitude, longitude, is_available, verified, created_at
  FROM workers
  WHERE deleted_at IS NULL AND verified = true
  ORDER BY rating DESC, total_jobs DESC
  LIMIT $1;
`;

// ============================================================================
// COMPLEX JOIN QUERIES
// ============================================================================

const getWorkerWithBookingStatsQuery = `
  SELECT
    w.id, w.user_id, w.specialization, w.hourly_rate, w.rating, w.verified,
    u.name, u.email, u.phone,
    COUNT(b.id) as total_bookings,
    SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
    SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
    AVG(CAST(COALESCE(b.actual_amount, b.estimated_amount) AS DECIMAL)) as average_booking_value
  FROM workers w
  JOIN users u ON w.user_id = u.id
  LEFT JOIN bookings b ON w.id = b.worker_id AND b.deleted_at IS NULL
  WHERE w.id = $1 AND w.deleted_at IS NULL AND u.deleted_at IS NULL
  GROUP BY w.id, u.id;
`;

const getWorkerWithEarningsQuery = `
  SELECT
    w.id, w.user_id, w.specialization, w.hourly_rate, w.rating, w.total_jobs,
    u.name, u.email,
    COUNT(p.id) as total_payments,
    SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_earnings,
    AVG(CASE WHEN p.status = 'completed' THEN p.amount ELSE NULL END) as average_payment,
    MAX(p.created_at) as last_payment_date
  FROM workers w
  JOIN users u ON w.user_id = u.id
  LEFT JOIN payments p ON w.id = p.worker_id AND p.deleted_at IS NULL
  WHERE w.id = $1 AND w.deleted_at IS NULL
  GROUP BY w.id, u.id;
`;

const getWorkerWithUpcomingBookingsQuery = `
  SELECT
    w.id, w.user_id, w.specialization, w.rating,
    b.id as booking_id, b.user_id as customer_id, b.service_type,
    b.scheduled_date, b.scheduled_time, b.status,
    b.estimated_amount, u.name as customer_name, u.phone as customer_phone
  FROM workers w
  LEFT JOIN bookings b ON w.id = b.worker_id AND b.scheduled_date >= CURRENT_DATE
    AND b.status IN ('pending', 'confirmed', 'in_progress') AND b.deleted_at IS NULL
  LEFT JOIN users u ON b.user_id = u.id
  WHERE w.id = $1 AND w.deleted_at IS NULL
  ORDER BY b.scheduled_date ASC, b.scheduled_time ASC;
`;

const getNearestAvailableWorkersQuery = `
  SELECT
    id, user_id, specialization, bio, hourly_rate, rating, total_jobs,
    location, latitude, longitude, is_available, verified,
    (6371 * 2 * ASIN(SQRT(SIN(RADIANS(($1 - latitude) / 2))^2 + COS(RADIANS(latitude)) * COS(RADIANS($1)) * SIN(RADIANS(($2 - longitude) / 2))^2))) as distance_km
  FROM workers
  WHERE is_available = true AND deleted_at IS NULL AND verified = true
  ORDER BY distance_km ASC
  LIMIT $3;
`;

// ============================================================================
// PROFILE QUERIES
// ============================================================================

const getWorkerProfileScreenDetailsQuery = `
  SELECT w.name, w.email, w.phone_number, ws.profile
  FROM workersverified w
  LEFT JOIN workerskills ws ON w.worker_id = ws.worker_id
  WHERE w.worker_id = $1;
`;

const upsertWorkerSkillsAndUpdateIssuesQuery = `
  WITH upsert AS (
    INSERT INTO workerskills
      (worker_id, profile, proof, service, subservices, personalDetails, address)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (worker_id) DO UPDATE
      SET
        profile = EXCLUDED.profile,
        proof = EXCLUDED.proof,
        service = EXCLUDED.service,
        subservices = EXCLUDED.subservices,
        personalDetails = EXCLUDED.personalDetails,
        address = EXCLUDED.address
    RETURNING worker_id
  ),
  update_issues AS (
    UPDATE workers
    SET issues = (
      SELECT jsonb_agg(
        CASE
          WHEN i->>'category' = $8 THEN jsonb_set(i, '{status}', '"changed"')
          ELSE i
        END
      )
      FROM jsonb_array_elements(issues) AS i
    )
    WHERE worker_id = (SELECT worker_id FROM upsert)
    RETURNING *
  )
  SELECT * FROM update_issues;
`;

const getWorkerProfileDetailsQuery = `
  SELECT
    ws.worker_id,
    ws.service,
    ws.proof,
    ws.profile,
    ws.subservices,
    COALESCE(wv.phone_number, w.phone_number) AS phone_number,
    ws.personaldetails,
    ws.address
  FROM
    workerskills ws
  LEFT JOIN
    workersverified wv ON ws.worker_id = wv.worker_id
  LEFT JOIN
    workers w ON ws.worker_id = w.worker_id
  WHERE
    ws.worker_id = $1;
`;

const getWorkerProfleDetailsQuery = `
  SELECT
    w.phone_number, w.name, w.created_at,
    ws.profile, ws.proof, ws.service, ws.subservices
  FROM workerskills ws
  JOIN workersverified w ON ws.worker_id = w.worker_id
  WHERE ws.worker_id = $1
`;

const updateWorkerProfileImageQuery = `
  UPDATE workerskills
  SET profile = $1
  WHERE worker_id = $2
  RETURNING *;
`;

const getWorkerProfileDetailsWithFeedbackQuery = `
  SELECT
    w.name AS worker_name,
    w.created_at,
    ws.profile,
    ws.service,
    ws.subservices,
    f.name AS feedback_name,
    f.rating,
    f.comment,
    (SELECT AVG(rating) FROM feedback WHERE worker_id = $1) AS average_rating
  FROM workersverified w
  INNER JOIN workerskills ws ON w.worker_id = ws.worker_id
  LEFT JOIN feedback f ON w.worker_id = f.worker_id
  WHERE w.worker_id = $1
`;

const getWorkerReviewDetailsQuery = `
  SELECT
    f.rating,
    f.comment,
    f.created_at,
    ws.profile,
    ws.service,
    w.name,
    u.name AS username,
    u.profile AS userImage,
    wl.average_rating
  FROM
    feedback f
  JOIN
    workersverified w ON f.worker_id = w.worker_id
  JOIN
    workerskills ws ON ws.worker_id = w.worker_id
  JOIN
    "user" u ON u.user_id = f.user_id
  JOIN
    workerlife wl ON wl.worker_id = w.worker_id
  WHERE
    f.worker_id = $1
  ORDER BY
    f.created_at DESC;
`;

// ============================================================================
// ONBOARDING QUERIES
// ============================================================================

const insertWorkerWithContactIdQuery = `
  INSERT INTO workers (phone_number, name, email, contact_id)
  VALUES ($1, $2, $3, $4)
  RETURNING *;
`;

const upsertWorkerSkillsQuery = `
  INSERT INTO workerskills (worker_id, profile, proof, service, subservices, personalDetails, address)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  ON CONFLICT (worker_id) DO UPDATE
  SET
      profile = EXCLUDED.profile,
      proof = EXCLUDED.proof,
      service = EXCLUDED.service,
      subservices = EXCLUDED.subservices,
      personalDetails = EXCLUDED.personalDetails,
      address = EXCLUDED.address
`;

const insertWorkerSkillsRegistrationQuery = `
  INSERT INTO workerskills (worker_id, service, subservices, profile, proof, agree)
  VALUES ($1, $2, $3, $4, $5, $6)
  ON CONFLICT (worker_id) DO UPDATE
  SET service = EXCLUDED.service, subservices = EXCLUDED.subservices, profile = EXCLUDED.profile, proof = EXCLUDED.proof, agree = EXCLUDED.agree
`;

const upsertWorkerLifeQuery = `
  INSERT INTO workerlife (worker_id, service_counts, money_earned)
  VALUES ($1, $2, $3)
  ON CONFLICT (worker_id) DO UPDATE
  SET service_counts = 0, money_earned = 0
`;

const checkOnboardingStepsQuery = `
  SELECT
    EXISTS (SELECT 1 FROM workers WHERE worker_id = $1) AS step1,
    EXISTS (SELECT 1 FROM workerskills WHERE worker_id = $1) AS step2,
    EXISTS (SELECT 1 FROM bank_accounts WHERE worker_id = $1) AS bankAccount,
    EXISTS (SELECT 1 FROM upi_accounts WHERE worker_id = $1) AS upiId
`;

const addWorkerVerifiedQuery = `
  INSERT INTO "workersverified" (name, phone_number, created_at)
  VALUES ($1, $2, $3)
  RETURNING *
`;

const getServicesWithPhoneNumberQuery = `
  SELECT sc.*, (
      SELECT array_agg(w.phone_number)
      FROM workers w
      WHERE w.worker_id = $1
  ) AS phone_numbers
  FROM "servicecategories" sc;
`;

const getServicesWithRegisterPhoneNumberQuery = `
  SELECT sc.*, (
      SELECT array_agg(w.phone_number)
      FROM workersverified w
      WHERE w.worker_id = $1
  ) AS phone_numbers
  FROM "servicecategories" sc;
`;

// ============================================================================
// BANKING QUERIES
// ============================================================================

const upsertBankAccountQuery = `
  INSERT INTO bankaccounts (worker_id, bank_name, account_number, ifsc_code, account_holder_name, status)
  VALUES ($1, $2, $3, $4, $5, 'verified')
  ON CONFLICT (worker_id) DO UPDATE
  SET
    bank_name = EXCLUDED.bank_name,
    account_number = EXCLUDED.bank_name,
    ifsc_code = EXCLUDED.ifsc_code,
    account_holder_name = EXCLUDED.account_holder_name,
    status = 'verified',
    updated_at = NOW();
`;

const getWorkerContactIdQuery = `
  SELECT contact_id FROM workers WHERE worker_id = $1
`;

const upsertFundAccountQuery = `
  INSERT INTO bank_accounts (worker_id, contact_id, fund_account_id, bank_name, ifsc_code, account_number, status)
  VALUES ($1, $2, $3, $4, $5, $6, 'verified')
  ON CONFLICT (worker_id) DO UPDATE
  SET contact_id = EXCLUDED.contact_id,
      fund_account_id = EXCLUDED.fund_account_id,
      bank_name = EXCLUDED.bank_name,
      ifsc_code = EXCLUDED.ifsc_code,
      account_number = EXCLUDED.account_number,
      status = 'verified',
      updated_at = NOW();
`;

// ============================================================================
// UPI QUERIES
// ============================================================================

const upsertUpiIdQuery = `
  INSERT INTO bankaccounts (worker_id, upi_id)
  VALUES ($1, $2)
  ON CONFLICT (worker_id) DO UPDATE
  SET
    upi_id = EXCLUDED.upi_id
`;

const upsertUpiAccountQuery = `
  INSERT INTO upi_accounts (worker_id, upi_id, is_verified, razorpay_response)
  VALUES ($1, $2, $3, $4)
  ON CONFLICT (upi_id) DO UPDATE
  SET is_verified = EXCLUDED.is_verified,
      razorpay_response = EXCLUDED.razorpay_response,
      updated_at = CURRENT_TIMESTAMP
  RETURNING *;
`;

// ============================================================================
// EARNINGS QUERIES
// ============================================================================

const getWorkerEarningsQuery = `
  SELECT
    COALESCE(sc.total_payment,0)           AS total_payment,
    COALESCE(sc.cash_payment,0)            AS cash_payment,
    COALESCE(sc.payment_count,0)           AS payment_count,
    COALESCE(sc.total_time_worked_hours,0) AS total_time_worked_hours,
    sc.life_earnings,

    wl.average_rating                     AS avg_rating,

    COALESCE(cn.rejected_count,0)         AS rejected_count,
    COALESCE(pn.pending_count,0)          AS pending_count,

    wl.service_counts,
    wl.cashback_approved_times,
    wl.cashback_gain

  FROM workerlife wl

  LEFT JOIN LATERAL (
    SELECT
      SUM(s.payment)                                     AS total_payment,
      SUM(CASE WHEN s.payment_type='cash' THEN s.payment ELSE 0 END)
                                                         AS cash_payment,
      COUNT(*)                                           AS payment_count,
      (EXTRACT(
         EPOCH FROM SUM(
           CASE
             WHEN s.time_worked ~ '^\\d{2}:\\d{2}:\\d{2}$'
               AND split_part(s.time_worked, ':', 2)::int < 60
               AND split_part(s.time_worked, ':', 3)::int < 60
             THEN s.time_worked::interval
             ELSE INTERVAL '0'
           END
         )
       ) / 3600)                                          AS total_time_worked_hours,
      (SELECT COALESCE(SUM(payment),0)
         FROM servicecall
        WHERE worker_id = wl.worker_id
          AND payment IS NOT NULL
      )                                                   AS life_earnings
    FROM servicecall s
    WHERE s.worker_id = wl.worker_id
      AND s.payment    IS NOT NULL
      AND DATE(s.end_time) BETWEEN DATE($2) AND DATE($3)
  ) sc ON TRUE

  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS rejected_count
    FROM completenotifications cn
    WHERE cn.worker_id       = wl.worker_id
      AND cn.complete_status = 'workercanceled'
      AND DATE(cn.created_at) BETWEEN DATE($2) AND DATE($3)
  ) cn ON TRUE

  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS pending_count
    FROM notifications n
    WHERE n.worker_id = wl.worker_id
      AND n.status    = 'pending'
      AND DATE(n.created_at) BETWEEN DATE($2) AND DATE($3)
  ) pn ON TRUE

  WHERE wl.worker_id = $1;
`;

// ============================================================================
// BALANCE QUERIES
// ============================================================================

const getBalanceAmountToPayQuery = `
  SELECT
    servicecall.payment,
    servicecall.payment_type,
    servicecall.notification_id,
    servicecall.end_time,
    "user".name,
    workerlife.balance_amount,
    workerlife.balance_payment_history
  FROM servicecall
  LEFT JOIN completenotifications
    ON servicecall.notification_id = completenotifications.notification_id
  LEFT JOIN "user"
    ON completenotifications.user_id = "user".user_id
  LEFT JOIN workerlife
    ON servicecall.worker_id = workerlife.worker_id
  WHERE servicecall.worker_id = $1
    AND servicecall.payment IS NOT NULL
`;

const getWorkerBalanceDetailsQuery = `
  SELECT
    servicecall.payment,
    servicecall.payment_type,
    servicecall.notification_id,
    "user".name,
    "user".phone_number,
    workerlife.cashback_history,
    workerlife.balance_payment_history
  FROM servicecall
  LEFT JOIN completenotifications
    ON servicecall.notification_id = completenotifications.notification_id
  LEFT JOIN "user"
    ON completenotifications.user_id = "user".user_id
  LEFT JOIN workerlife
    ON servicecall.worker_id = workerlife.worker_id
  WHERE servicecall.worker_id = $1
    AND servicecall.payment IS NOT NULL;
`;

const getBalanceHistoryQuery = `
  SELECT balance_payment_history
  FROM workerlife
  WHERE worker_id = $1;
`;

// ============================================================================
// CASHBACK QUERIES
// ============================================================================

const getWorkerCashbackDetailsQuery = `
  SELECT
    servicecall.payment,
    servicecall.payment_type,
    servicecall.notification_id,
    servicecall.end_time,
    completenotifications.*,
    "user".name,
    workerlife.cashback_history,
    workerlife.cashback_approved_times,
    workerlife.cashback_gain,
    (
      SELECT jsonb_agg(history)
      FROM jsonb_array_elements(workerlife.cashback_history) AS history
    ) AS cashback_history
  FROM servicecall
  LEFT JOIN completenotifications
    ON servicecall.notification_id = completenotifications.notification_id
  LEFT JOIN "user"
    ON completenotifications.user_id = "user".user_id
  LEFT JOIN workerlife
    ON servicecall.worker_id = workerlife.worker_id
  WHERE servicecall.worker_id = $1
    AND servicecall.payment IS NOT NULL;
`;

const updateWorkerCashbackPayedQuery = `
  WITH updated_worker AS (
    UPDATE workerlife
    SET cashback_gain = cashback_gain + $1,
        cashback_history = cashback_history || $2::jsonb
    WHERE worker_id = $3
    RETURNING cashback_gain, cashback_history
  )
  SELECT * FROM updated_worker;
`;

const getCashbackHistoryQuery = `
  SELECT
    cashback_history,
    cashback_gain,
    cashback_approved_times
  FROM workerlife
  WHERE worker_id = $1;
`;

// ============================================================================
// FINANCIAL ADMIN QUERIES
// ============================================================================

const getPendingBalanceWorkersQuery = `
  SELECT
    wl.balance_amount,
    wl.worker_id,
    ws.profile,
    ws.service,
    wv.name
  FROM workerlife wl
  LEFT JOIN workerskills ws ON wl.worker_id = ws.worker_id
  LEFT JOIN workersverified wv ON wl.worker_id = wv.worker_id
  WHERE wl.balance_amount != 0.00;
`;

const getWorkersPendingCashbackQuery = `
  SELECT
    w.worker_id,
    w.cashback_approved_times - w.cashback_gain AS pending_cashback,
    v.name,
    v.created_at,
    s.service,
    s.profile
  FROM workerlife AS w
  JOIN workersverified AS v ON w.worker_id = v.worker_id
  JOIN workerskills AS s ON w.worker_id = s.worker_id
  WHERE (w.cashback_approved_times - w.cashback_gain) > 0;
`;

// ============================================================================
// LOCATION UPDATE QUERIES
// ============================================================================

const upsertWorkerLocationQuery = `
  INSERT INTO workerLocation (longitude, latitude, worker_id)
  VALUES ($1, $2, $3)
  ON CONFLICT (worker_id)
  DO UPDATE SET longitude = EXCLUDED.longitude, latitude = EXCLUDED.latitude
`;

const getWorkerLocationQuery = `
  SELECT worker_id, longitude, latitude, updated_at
  FROM workerLocation
  WHERE worker_id = $1
`;

const getAllWorkerLocationsQuery = `
  SELECT wl.worker_id, wl.longitude, wl.latitude, wl.updated_at,
         w.name, w.phone_number, ws.profile, ws.service
  FROM workerLocation wl
  JOIN workersverified w ON wl.worker_id = w.worker_id
  LEFT JOIN workerskills ws ON wl.worker_id = ws.worker_id
  ORDER BY wl.updated_at DESC
`;

const getNearbyWorkersWithHaversineQuery = `
  SELECT
    wl.worker_id,
    wl.longitude,
    wl.latitude,
    w.name,
    w.phone_number,
    ws.service,
    ws.subservices,
    ws.profile,
    wlife.average_rating,
    (6371 * 2 * ASIN(SQRT(
      POWER(SIN(RADIANS(($1 - wl.latitude) / 2)), 2) +
      COS(RADIANS($1)) * COS(RADIANS(wl.latitude)) *
      POWER(SIN(RADIANS(($2 - wl.longitude) / 2)), 2)
    ))) AS distance_km
  FROM workerLocation wl
  JOIN workersverified w ON wl.worker_id = w.worker_id
  LEFT JOIN workerskills ws ON wl.worker_id = ws.worker_id
  LEFT JOIN workerlife wlife ON wl.worker_id = wlife.worker_id
  WHERE w.no_due = TRUE
  HAVING distance_km <= $3
  ORDER BY distance_km ASC
  LIMIT $4
`;

// ============================================================================
// NEARBY WORKERS QUERIES
// ============================================================================

const insertUserNotificationAndFindWorkersQuery = `
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
  FROM matching_workers mw;
`;

const insertNotificationsAndGetFcmTokensQuery = `
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
  FROM fcm_tokens;
`;

const updateOfferStatusQuery = `
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
`;

// ============================================================================
// NAVIGATION QUERIES
// ============================================================================

const getWorkerNavigationDetailsQuery = `
  SELECT
    n.pin,
    n.service_booked,
    w.name,
    w.phone_number,
    un.area,
    ws.profile,
    wl.average_rating,
    wl.service_counts
  FROM
    accepted n
  JOIN
    workersverified w ON n.worker_id = w.worker_id
  JOIN
    usernotifications un ON n.user_notification_id = un.user_notification_id
  JOIN
    workerskills ws ON n.worker_id = ws.worker_id
  JOIN
    workerlife wl ON n.worker_id = wl.worker_id
  WHERE
    n.notification_id = $1;
`;

// ============================================================================
// BANK ACCOUNT VERIFICATION QUERIES
// ============================================================================

const getBankAccountByWorkerIdQuery = `
  SELECT worker_id, bank_name, account_number, ifsc_code,
         account_holder_name, status, created_at, updated_at
  FROM bankaccounts
  WHERE worker_id = $1;
`;

const getVerifiedBankAccountQuery = `
  SELECT worker_id, bank_name, account_number, ifsc_code,
         account_holder_name, contact_id, fund_account_id, status
  FROM bank_accounts
  WHERE worker_id = $1 AND status = 'verified';
`;

const updateBankAccountStatusQuery = `
  UPDATE bankaccounts
  SET status = $2, updated_at = NOW()
  WHERE worker_id = $1
  RETURNING worker_id, bank_name, status, updated_at;
`;

// ============================================================================
// UPI ACCOUNT QUERIES (EXTENDED)
// ============================================================================

const getUpiAccountByWorkerIdQuery = `
  SELECT worker_id, upi_id, is_verified, razorpay_response, created_at, updated_at
  FROM upi_accounts
  WHERE worker_id = $1;
`;

const getVerifiedUpiAccountQuery = `
  SELECT worker_id, upi_id, is_verified, created_at
  FROM upi_accounts
  WHERE worker_id = $1 AND is_verified = true;
`;

// ============================================================================
// WORKER FINANCIAL SUMMARY QUERIES
// ============================================================================

const getWorkerFinancialSummaryQuery = `
  SELECT
    wl.worker_id,
    wl.balance_amount,
    wl.money_earned,
    wl.service_counts,
    wl.cashback_approved_times,
    wl.cashback_gain,
    wl.average_rating,
    COALESCE((
      SELECT SUM(payment)
      FROM servicecall
      WHERE worker_id = wl.worker_id
        AND payment IS NOT NULL
        AND payment_type = 'cash'
    ), 0) as total_cash_earnings,
    COALESCE((
      SELECT SUM(payment)
      FROM servicecall
      WHERE worker_id = wl.worker_id
        AND payment IS NOT NULL
        AND payment_type != 'cash'
    ), 0) as total_online_earnings,
    COALESCE((
      SELECT COUNT(*)
      FROM servicecall
      WHERE worker_id = wl.worker_id AND payment IS NOT NULL
    ), 0) as total_paid_services
  FROM workerlife wl
  WHERE wl.worker_id = $1;
`;

const getWorkerPaymentStatsQuery = `
  SELECT
    sc.worker_id,
    COUNT(*) as total_services,
    SUM(sc.payment) as total_earnings,
    SUM(CASE WHEN sc.payment_type = 'cash' THEN sc.payment ELSE 0 END) as cash_earnings,
    SUM(CASE WHEN sc.payment_type != 'cash' THEN sc.payment ELSE 0 END) as online_earnings,
    AVG(sc.payment) as average_payment,
    MIN(sc.end_time) as first_service_date,
    MAX(sc.end_time) as last_service_date
  FROM servicecall sc
  WHERE sc.worker_id = $1 AND sc.payment IS NOT NULL
  GROUP BY sc.worker_id;
`;

// ============================================================================
// BALANCE SETTLEMENT QUERIES
// ============================================================================

const getWorkerBalanceForSettlementQuery = `
  SELECT
    wl.worker_id,
    wl.balance_amount,
    wl.balance_payment_history,
    wv.name,
    wv.phone_number,
    ba.bank_name,
    ba.account_number,
    ba.ifsc_code,
    ba.fund_account_id,
    ua.upi_id
  FROM workerlife wl
  JOIN workersverified wv ON wl.worker_id = wv.worker_id
  LEFT JOIN bank_accounts ba ON wl.worker_id = ba.worker_id AND ba.status = 'verified'
  LEFT JOIN upi_accounts ua ON wl.worker_id = ua.worker_id AND ua.is_verified = true
  WHERE wl.worker_id = $1;
`;

const updateWorkerBalanceAfterSettlementQuery = `
  UPDATE workerlife
  SET balance_amount = balance_amount - $2,
      balance_payment_history = COALESCE(balance_payment_history, '[]'::jsonb) ||
        jsonb_build_array(
          jsonb_build_object(
            'amount', $2,
            'time', TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'),
            'status', $3,
            'reference', $4,
            'type', 'settlement'
          )
        ),
      updated_at = CURRENT_TIMESTAMP
  WHERE worker_id = $1
  RETURNING worker_id, balance_amount, updated_at;
`;

// ============================================================================
// COMMISSION CALCULATION QUERIES
// ============================================================================

const calculateWorkerDueBalanceQuery = `
  SELECT
    worker_id,
    SUM(CASE
      WHEN payment_type = 'cash' THEN payment * 0.12
      ELSE payment * -0.88
    END) as net_balance_due
  FROM servicecall
  WHERE worker_id = $1 AND payment IS NOT NULL
  GROUP BY worker_id;
`;

const getWorkerServicePaymentsQuery = `
  SELECT
    sc.notification_id,
    sc.payment,
    sc.payment_type,
    sc.start_time,
    sc.end_time,
    sc.time_worked,
    cn.user_id,
    u.name as customer_name,
    cn.service_booked
  FROM servicecall sc
  LEFT JOIN completenotifications cn ON sc.notification_id = cn.notification_id
  LEFT JOIN "user" u ON cn.user_id = u.user_id
  WHERE sc.worker_id = $1 AND sc.payment IS NOT NULL
  ORDER BY sc.end_time DESC
  LIMIT $2 OFFSET $3;
`;

// ============================================================================
// CASHBACK ELIGIBILITY QUERIES
// ============================================================================

const checkCashbackEligibilityQuery = `
  SELECT
    worker_id,
    service_counts,
    cashback_approved_times,
    cashback_gain,
    (cashback_approved_times - cashback_gain) as pending_cashback_count
  FROM workerlife
  WHERE worker_id = $1;
`;

const getWorkerLifetimeCashbackQuery = `
  SELECT
    worker_id,
    cashback_approved_times,
    cashback_gain,
    cashback_history,
    (cashback_approved_times - cashback_gain) * 100 as pending_cashback_amount
  FROM workerlife
  WHERE worker_id = $1;
`;

module.exports = {
  getWorkerByIdQuery,
  createWorkerQuery,
  updateWorkerQuery,
  getWorkersByLocationQuery,
  getAvailableWorkersBySpecializationQuery,
  getWorkersByLocationAndSpecializationQuery,
  updateWorkerRatingQuery,
  updateWorkerTotalJobsQuery,
  deleteWorkerQuery,

  // Availability Queries
  updateWorkerAvailabilityQuery,
  getAvailableWorkersCountQuery,
  getWorkerAvailabilityStatusQuery,

  // FCM Token Queries
  storeWorkerFcmTokenQuery,
  updateWorkerFcmTokenQuery,
  getWorkerFcmTokensQuery,
  deleteWorkerFcmTokenQuery,
  storeWorkerFcmTokenWithDeleteQuery,
  deleteWorkerFcmTokenByTokenQuery,
  getActiveWorkerFcmTokensQuery,
  getAllActiveWorkerFcmTokensQuery,
  storeWorkerReceivedNotificationQuery,
  getWorkerReceivedNotificationsQuery,
  getWorkerFcmTokensForBatchQuery,

  // Notification Queries
  storeWorkerNotificationQuery,
  getWorkerNotificationsQuery,
  getWorkerUnreadNotificationCountQuery,
  markWorkerNotificationAsReadQuery,
  deleteWorkerNotificationQuery,
  markAllWorkerNotificationsAsReadQuery,

  // Status Update Queries
  updateWorkerVerificationStatusQuery,
  getWorkerVerificationStatusQuery,
  getUnverifiedWorkersQuery,

  // Worker Verification and Approval Queries
  getWorkerVerificationDetailsQuery,
  updateWorkerVerificationStatusV2Query,
  getWorkersVerificationStatusQuery,
  getWorkerByPhoneNumberQuery,
  getVerifiedWorkerByPhoneNumberQuery,

  // Document Verification Queries
  getWorkerDocumentsQuery,
  updateWorkerDocumentsQuery,
  verifyWorkerDocumentsQuery,
  rejectWorkerDocumentsQuery,

  // Worker Approval Workflow Queries
  approveWorkerRegistrationQuery,
  getPendingApprovalWorkersQuery,
  getPendingApprovalWorkersCountQuery,
  updateWorkerApprovalIssuesQuery,

  // Worker Onboarding Step Queries
  getWorkerOnboardingStatusQuery,
  completeWorkerOnboardingStepQuery,
  getWorkerOnboardingProgressQuery,

  // Skills Registration Queries
  getWorkerSkillsQuery,
  updateWorkerSkillsQuery,
  deleteWorkerSkillsQuery,

  // Worker Approval Status Tracking Queries
  logWorkerApprovalActionQuery,
  getWorkerApprovalHistoryQuery,
  getWorkersApprovedTodayQuery,
  getWorkersApprovedInRangeQuery,

  // Search and Filter Queries
  searchWorkersByNameQuery,
  searchWorkersBySpecializationAndLocationQuery,
  getWorkersByRatingRangeQuery,
  getTopRatedWorkersQuery,

  // Complex Join Queries
  getWorkerWithBookingStatsQuery,
  getWorkerWithEarningsQuery,
  getWorkerWithUpcomingBookingsQuery,
  getNearestAvailableWorkersQuery,

  // Profile Queries
  getWorkerProfileScreenDetailsQuery,
  upsertWorkerSkillsAndUpdateIssuesQuery,
  getWorkerProfileDetailsQuery,
  getWorkerProfleDetailsQuery,
  updateWorkerProfileImageQuery,
  getWorkerProfileDetailsWithFeedbackQuery,
  getWorkerReviewDetailsQuery,

  // Onboarding Queries
  insertWorkerWithContactIdQuery,
  upsertWorkerSkillsQuery,
  insertWorkerSkillsRegistrationQuery,
  upsertWorkerLifeQuery,
  checkOnboardingStepsQuery,
  addWorkerVerifiedQuery,
  getServicesWithPhoneNumberQuery,
  getServicesWithRegisterPhoneNumberQuery,

  // Banking Queries
  upsertBankAccountQuery,
  getWorkerContactIdQuery,
  upsertFundAccountQuery,

  // UPI Queries
  upsertUpiIdQuery,
  upsertUpiAccountQuery,

  // Earnings Queries
  getWorkerEarningsQuery,

  // Balance Queries
  getBalanceAmountToPayQuery,
  getWorkerBalanceDetailsQuery,
  getBalanceHistoryQuery,

  // Cashback Queries
  getWorkerCashbackDetailsQuery,
  updateWorkerCashbackPayedQuery,
  getCashbackHistoryQuery,

  // Financial Admin Queries
  getPendingBalanceWorkersQuery,
  getWorkersPendingCashbackQuery,

  // Location Update Queries
  upsertWorkerLocationQuery,
  getWorkerLocationQuery,
  getAllWorkerLocationsQuery,
  getNearbyWorkersWithHaversineQuery,

  // Nearby Workers Queries
  insertUserNotificationAndFindWorkersQuery,
  insertNotificationsAndGetFcmTokensQuery,
  updateOfferStatusQuery,

  // Navigation Queries
  getWorkerNavigationDetailsQuery,

  // Bank Account Verification Queries
  getBankAccountByWorkerIdQuery,
  getVerifiedBankAccountQuery,
  updateBankAccountStatusQuery,

  // UPI Account Queries (Extended)
  getUpiAccountByWorkerIdQuery,
  getVerifiedUpiAccountQuery,

  // Worker Financial Summary Queries
  getWorkerFinancialSummaryQuery,
  getWorkerPaymentStatsQuery,

  // Balance Settlement Queries
  getWorkerBalanceForSettlementQuery,
  updateWorkerBalanceAfterSettlementQuery,

  // Commission Calculation Queries
  calculateWorkerDueBalanceQuery,
  getWorkerServicePaymentsQuery,

  // Cashback Eligibility Queries
  checkCashbackEligibilityQuery,
  getWorkerLifetimeCashbackQuery,
};
