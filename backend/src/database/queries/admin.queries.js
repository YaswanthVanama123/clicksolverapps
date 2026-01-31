/**
 * Admin Database Queries
 * Contains SQL queries for admin operations including authentication,
 * dashboard statistics, worker management, and analytics
 */

/**
 * ADMIN AUTHENTICATION QUERIES
 */

const getAdminByIdQuery = `
  SELECT id, email, password_hash, name, role, status, last_login_at, created_at, updated_at
  FROM admins
  WHERE id = $1 AND deleted_at IS NULL;
`;

const getAdminByEmailQuery = `
  SELECT id, email, password_hash, name, role, status, last_login_at, created_at, updated_at
  FROM admins
  WHERE email = $1 AND deleted_at IS NULL;
`;

const getAdminByCredentialsQuery = `
  SELECT id, email, password_hash, name, role, status, last_login_at, created_at, updated_at
  FROM admins
  WHERE email = $1 AND deleted_at IS NULL;
`;

const createAdminQuery = `
  INSERT INTO admins (email, password_hash, name, role, status, created_at, updated_at)
  VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, email, name, role, status, created_at, updated_at;
`;

const updateAdminLastLoginQuery = `
  UPDATE admins
  SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, last_login_at, updated_at;
`;

const updateAdminPasswordQuery = `
  UPDATE admins
  SET password_hash = $2, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, email, updated_at;
`;

/**
 * DASHBOARD STATISTICS QUERIES
 */

const getDashboardStatsQuery = `
  SELECT
    (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) as total_users,
    (SELECT COUNT(*) FROM workers WHERE deleted_at IS NULL) as total_workers,
    (SELECT COUNT(*) FROM bookings WHERE deleted_at IS NULL) as total_bookings,
    (SELECT COUNT(*) FROM bookings WHERE status = 'completed' AND deleted_at IS NULL) as completed_bookings,
    (SELECT COUNT(*) FROM bookings WHERE status = 'pending' AND deleted_at IS NULL) as pending_bookings,
    (SELECT COUNT(*) FROM bookings WHERE status = 'in_progress' AND deleted_at IS NULL) as in_progress_bookings,
    (SELECT COALESCE(SUM(actual_amount), 0) FROM bookings WHERE status = 'completed' AND deleted_at IS NULL) as total_revenue,
    (SELECT COUNT(*) FROM workers WHERE verified = false AND deleted_at IS NULL) as pending_worker_verifications;
`;

const getServiceCountsQuery = `
  SELECT service_type, COUNT(*) as count, AVG(actual_amount) as avg_amount
  FROM bookings
  WHERE deleted_at IS NULL
  GROUP BY service_type
  ORDER BY count DESC;
`;

const getRevenueStatsQuery = `
  SELECT
    DATE_TRUNC('month', created_at)::DATE as month,
    COUNT(*) as booking_count,
    COALESCE(SUM(actual_amount), 0) as total_revenue,
    AVG(actual_amount) as avg_amount
  FROM bookings
  WHERE status = 'completed' AND deleted_at IS NULL
  GROUP BY DATE_TRUNC('month', created_at)
  ORDER BY month DESC
  LIMIT $1;
`;

const getDailyRevenueQuery = `
  SELECT
    DATE(created_at)::DATE as date,
    COUNT(*) as booking_count,
    COALESCE(SUM(actual_amount), 0) as daily_revenue
  FROM bookings
  WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '30 days' AND deleted_at IS NULL
  GROUP BY DATE(created_at)
  ORDER BY date DESC;
`;

const getWorkerStatsQuery = `
  SELECT
    COUNT(*) as total_workers,
    COUNT(CASE WHEN verified = true THEN 1 END) as verified_workers,
    COUNT(CASE WHEN verified = false THEN 1 END) as pending_workers,
    COUNT(CASE WHEN is_available = true THEN 1 END) as available_workers,
    AVG(rating) as avg_rating,
    MAX(rating) as max_rating
  FROM workers
  WHERE deleted_at IS NULL;
`;

const getWorkersBySpecializationStatsQuery = `
  SELECT
    specialization,
    COUNT(*) as count,
    COUNT(CASE WHEN verified = true THEN 1 END) as verified_count,
    AVG(rating) as avg_rating,
    SUM(total_jobs) as total_jobs_completed
  FROM workers
  WHERE deleted_at IS NULL
  GROUP BY specialization
  ORDER BY count DESC;
`;

/**
 * WORKER APPROVAL/VERIFICATION QUERIES
 */

const getPendingWorkersQuery = `
  SELECT
    w.id, w.user_id, w.specialization, w.bio, w.hourly_rate, w.rating,
    w.total_jobs, w.location, w.latitude, w.longitude, w.is_available,
    w.verified, w.created_at, w.updated_at,
    u.name, u.email, u.phone, u.avatar_url
  FROM workers w
  JOIN users u ON w.user_id = u.id
  WHERE w.verified = false AND w.deleted_at IS NULL
  ORDER BY w.created_at ASC
  LIMIT $1 OFFSET $2;
`;

const getPendingWorkerCountQuery = `
  SELECT COUNT(*) as count
  FROM workers
  WHERE verified = false AND deleted_at IS NULL;
`;

const getWorkerByIdWithDetailsQuery = `
  SELECT
    w.id, w.user_id, w.specialization, w.bio, w.hourly_rate, w.rating,
    w.total_jobs, w.location, w.latitude, w.longitude, w.is_available,
    w.verified, w.created_at, w.updated_at,
    u.name, u.email, u.phone, u.avatar_url,
    COUNT(b.id) as completed_jobs,
    AVG(CASE WHEN br.rating IS NOT NULL THEN br.rating ELSE NULL END) as user_reviews_avg
  FROM workers w
  JOIN users u ON w.user_id = u.id
  LEFT JOIN bookings b ON w.id = b.worker_id AND b.status = 'completed' AND b.deleted_at IS NULL
  LEFT JOIN booking_reviews br ON b.id = br.booking_id
  WHERE w.id = $1 AND w.deleted_at IS NULL
  GROUP BY w.id, u.id;
`;

const updateWorkerVerificationStatusQuery = `
  UPDATE workers
  SET verified = $2, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, verified, updated_at;
`;

const approveWorkerQuery = `
  UPDATE workers
  SET verified = true, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, verified, updated_at;
`;

const rejectWorkerQuery = `
  UPDATE workers
  SET verified = false, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, deleted_at;
`;

const getVerifiedWorkersQuery = `
  SELECT id, user_id, specialization, hourly_rate, rating, total_jobs,
         location, is_available, created_at, updated_at
  FROM workers
  WHERE verified = true AND deleted_at IS NULL
  ORDER BY rating DESC, total_jobs DESC
  LIMIT $1 OFFSET $2;
`;

/**
 * WORKER ISSUES MANAGEMENT QUERIES
 */

const createWorkerIssueQuery = `
  INSERT INTO worker_issues (worker_id, issue_type, description, severity, status, created_at, updated_at)
  VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, worker_id, issue_type, description, severity, status, created_at, updated_at;
`;

const getWorkerIssueByIdQuery = `
  SELECT id, worker_id, issue_type, description, severity, status,
         resolution_notes, resolved_at, created_at, updated_at
  FROM worker_issues
  WHERE id = $1 AND deleted_at IS NULL;
`;

const getWorkerIssuesByWorkerIdQuery = `
  SELECT id, worker_id, issue_type, description, severity, status,
         resolution_notes, resolved_at, created_at, updated_at
  FROM worker_issues
  WHERE worker_id = $1 AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT $2 OFFSET $3;
`;

const getOpenWorkerIssuesQuery = `
  SELECT
    wi.id, wi.worker_id, wi.issue_type, wi.description, wi.severity, wi.status,
    wi.created_at, w.specialization, u.name, u.email
  FROM worker_issues wi
  JOIN workers w ON wi.worker_id = w.id
  JOIN users u ON w.user_id = u.id
  WHERE wi.status IN ('open', 'in_progress') AND wi.deleted_at IS NULL
  ORDER BY wi.severity DESC, wi.created_at ASC
  LIMIT $1 OFFSET $2;
`;

const getOpenWorkerIssueCountQuery = `
  SELECT COUNT(*) as count
  FROM worker_issues
  WHERE status IN ('open', 'in_progress') AND deleted_at IS NULL;
`;

const updateWorkerIssueStatusQuery = `
  UPDATE worker_issues
  SET status = $2, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, status, updated_at;
`;

const resolveWorkerIssueQuery = `
  UPDATE worker_issues
  SET status = 'resolved', resolution_notes = $2, resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, status, resolved_at, updated_at;
`;

const getWorkerIssuesByTypeQuery = `
  SELECT
    issue_type, COUNT(*) as count,
    COUNT(CASE WHEN status = 'open' THEN 1 END) as open_count,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count
  FROM worker_issues
  WHERE deleted_at IS NULL
  GROUP BY issue_type
  ORDER BY count DESC;
`;

/**
 * ADMIN REPORTS AND ANALYTICS QUERIES
 */

const getBookingAnalyticsQuery = `
  SELECT
    DATE_TRUNC('week', created_at)::DATE as week,
    COUNT(*) as total_bookings,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
    COALESCE(AVG(CASE WHEN status = 'completed' THEN actual_amount END), 0) as avg_completed_amount
  FROM bookings
  WHERE deleted_at IS NULL
  GROUP BY DATE_TRUNC('week', created_at)
  ORDER BY week DESC
  LIMIT $1;
`;

const getUserAcquisitionQuery = `
  SELECT
    DATE_TRUNC('month', created_at)::DATE as month,
    COUNT(CASE WHEN (SELECT COUNT(*) FROM bookings b WHERE b.user_id = users.id AND b.deleted_at IS NULL) > 0 THEN 1 END) as active_users,
    COUNT(*) as total_new_users
  FROM users
  WHERE deleted_at IS NULL
  GROUP BY DATE_TRUNC('month', created_at)
  ORDER BY month DESC
  LIMIT $1;
`;

const getTopWorkersQuery = `
  SELECT
    w.id, w.user_id, w.specialization, w.hourly_rate, w.rating,
    w.total_jobs, u.name, u.email,
    COUNT(b.id) as completed_jobs_in_period,
    COALESCE(SUM(b.actual_amount), 0) as revenue_in_period
  FROM workers w
  JOIN users u ON w.user_id = u.id
  LEFT JOIN bookings b ON w.id = b.worker_id AND b.status = 'completed'
    AND b.created_at >= NOW() - INTERVAL '30 days' AND b.deleted_at IS NULL
  WHERE w.verified = true AND w.deleted_at IS NULL
  GROUP BY w.id, u.id
  ORDER BY completed_jobs_in_period DESC, revenue_in_period DESC
  LIMIT $1;
`;

const getTopUsersQuery = `
  SELECT
    u.id, u.name, u.email, u.phone,
    COUNT(b.id) as total_bookings,
    COALESCE(SUM(b.actual_amount), 0) as total_spent,
    COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings
  FROM users u
  LEFT JOIN bookings b ON u.id = b.user_id AND b.deleted_at IS NULL
  WHERE u.deleted_at IS NULL
  GROUP BY u.id
  ORDER BY total_bookings DESC, total_spent DESC
  LIMIT $1;
`;

const getUserRetentionQuery = `
  SELECT
    DATE_TRUNC('month', first_booking)::DATE as month,
    COUNT(*) as total_users,
    COUNT(CASE WHEN last_booking >= DATE_TRUNC('month', first_booking) + INTERVAL '30 days' THEN 1 END) as retained_users,
    ROUND(100.0 * COUNT(CASE WHEN last_booking >= DATE_TRUNC('month', first_booking) + INTERVAL '30 days' THEN 1 END) / COUNT(*), 2) as retention_rate
  FROM (
    SELECT
      user_id,
      MIN(created_at) as first_booking,
      MAX(created_at) as last_booking
    FROM bookings
    WHERE deleted_at IS NULL
    GROUP BY user_id
  ) booking_stats
  GROUP BY DATE_TRUNC('month', first_booking)
  ORDER BY month DESC;
`;

const getAnomaliesAndIssuesQuery = `
  SELECT
    'low_rated_worker' as issue_type,
    w.id as related_id,
    u.name as description,
    w.rating as value,
    COUNT(*) as count
  FROM workers w
  JOIN users u ON w.user_id = u.id
  WHERE w.rating < 3.0 AND w.verified = true AND w.deleted_at IS NULL
  GROUP BY w.id, u.name, w.rating
  UNION ALL
  SELECT
    'high_cancellation_rate' as issue_type,
    u.id as related_id,
    u.name as description,
    ROUND(100.0 * COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) / COUNT(*), 2) as value,
    COUNT(*) as count
  FROM users u
  LEFT JOIN bookings b ON u.id = b.user_id AND b.deleted_at IS NULL
  WHERE COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END)::FLOAT / COUNT(*) > 0.3
  GROUP BY u.id, u.name
  ORDER BY issue_type, value DESC;
`;

const getAdminActivityLogQuery = `
  SELECT id, admin_id, action, target_type, target_id, changes, ip_address, created_at
  FROM admin_activity_logs
  WHERE admin_id = $1
  ORDER BY created_at DESC
  LIMIT $2 OFFSET $3;
`;

const createAdminActivityLogQuery = `
  INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, changes, ip_address, created_at)
  VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
  RETURNING id, admin_id, action, target_type, target_id, changes, ip_address, created_at;
`;

const getSystemHealthQuery = `
  SELECT
    (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) as total_users,
    (SELECT COUNT(*) FROM workers WHERE verified = true AND deleted_at IS NULL) as verified_workers,
    (SELECT COUNT(*) FROM bookings WHERE status = 'pending' AND deleted_at IS NULL) as pending_bookings,
    (SELECT COUNT(*) FROM worker_issues WHERE status = 'open' AND deleted_at IS NULL) as open_issues,
    (SELECT AVG(rating) FROM workers WHERE deleted_at IS NULL) as avg_worker_rating,
    (SELECT COUNT(*) FROM admins WHERE status = 'active' AND deleted_at IS NULL) as active_admins;
`;

const getReportByDateRangeQuery = `
  SELECT
    DATE(created_at)::DATE as date,
    COUNT(*) as bookings_count,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
    COALESCE(SUM(CASE WHEN status = 'completed' THEN actual_amount END), 0) as revenue
  FROM bookings
  WHERE created_at >= $1 AND created_at <= $2 AND deleted_at IS NULL
  GROUP BY DATE(created_at)
  ORDER BY date DESC;
`;

/**
 * DASHBOARD DETAILS QUERIES (CLICKSOLVER SPECIFIC)
 * These queries are used for the ClickSolver admin dashboard
 */

const getDashboardDetailsQuery = `
  SELECT
    -- Count of worker_id in workersverified within date range
    (SELECT COUNT(worker_id) FROM workersverified WHERE DATE(created_at) = $1) AS worker_count,

    -- Count of user_id in "user" within date range
    (SELECT COUNT(user_id) FROM "user" WHERE DATE(created_at) = $1) AS user_count,

    -- Count of completed services in completenotifications within date range
    (SELECT COUNT(*) FROM completenotifications WHERE DATE(created_at) = $1 ) AS services,

    -- Count of canceled services in completenotifications within date range
    (SELECT COUNT(*) FROM completenotifications WHERE DATE(created_at) = $1 AND complete_status = 'cancel') AS cancel_services,

    -- Sum of all balance_amount in workerlife
    (SELECT COALESCE(SUM(balance_amount), 0) FROM workerlife) AS total_balance_amount,

    -- Count of rows in workerlife where balance_amount is not 0.00
    (SELECT COUNT(*) FROM workerlife WHERE balance_amount != 0.00) AS non_zero_balance_count
`;

const getDashboardDetailsDateRangeQuery = `
  SELECT
    -- Count of worker_id in workersverified within date range
    (SELECT COUNT(worker_id) FROM workersverified WHERE DATE(created_at) BETWEEN $1 AND $2) AS worker_count,

    -- Count of user_id in "user" within date range
    (SELECT COUNT(user_id) FROM "user" WHERE DATE(created_at) BETWEEN $1 AND $2) AS user_count,

    -- Count of completed services in completenotifications within date range
    (SELECT COUNT(*) FROM completenotifications WHERE DATE(created_at) BETWEEN $1 AND $2 ) AS services,

    -- Count of canceled services in completenotifications within date range
    (SELECT COUNT(*) FROM completenotifications WHERE DATE(created_at) BETWEEN $1 AND $2 AND complete_status = 'cancel') AS cancel_services,

    -- Sum of all balance_amount in workerlife
    (SELECT COALESCE(SUM(balance_amount), 0) FROM workerlife) AS total_balance_amount,

    -- Count of rows in workerlife where balance_amount is not 0.00
    (SELECT COUNT(*) FROM workerlife WHERE balance_amount != 0.00) AS non_zero_balance_count
`;

const getAdministratorDetailsQuery = `
  WITH worker_count AS (
    SELECT COUNT(*) AS total_workers
    FROM workersverified
    WHERE DATE(created_at) = $1
  ),
  user_count AS (
    SELECT COUNT(*) AS total_users
    FROM "user"
    WHERE DATE(created_at) = $1
  ),
  service_count AS (
    SELECT COUNT(*) AS total_services, COALESCE(SUM(payment), 0) AS total_earnings
    FROM servicecall
    WHERE DATE(end_time) = $1
  ),
  balance_sum AS (
    SELECT COALESCE(SUM(balance_amount), 0) AS total_balance
    FROM workerlife
  ),
  negative_balance_count AS (
    SELECT COUNT(*) AS negative_balance_workers
    FROM workerlife
    WHERE balance_amount < 0
  ),
  cancel_count AS (
    SELECT COUNT(*) AS total_cancels
    FROM completenotifications
    WHERE DATE(created_at) = $1 AND complete_status = 'cancel'
  )
  SELECT
    wc.total_workers,
    uc.total_users,
    sc.total_services,
    sc.total_earnings,
    bs.total_balance,
    nb.negative_balance_workers,
    cc.total_cancels
  FROM worker_count wc
  CROSS JOIN user_count uc
  CROSS JOIN service_count sc
  CROSS JOIN balance_sum bs
  CROSS JOIN negative_balance_count nb
  CROSS JOIN cancel_count cc;
`;

const getAdministratorDetailsDateRangeQuery = `
  WITH worker_count AS (
    SELECT COUNT(*) AS total_workers
    FROM workersverified
    WHERE DATE(created_at) BETWEEN $1 AND $2
  ),
  user_count AS (
    SELECT COUNT(*) AS total_users
    FROM "user"
    WHERE DATE(created_at) BETWEEN $1 AND $2
  ),
  service_count AS (
    SELECT COUNT(*) AS total_services, COALESCE(SUM(payment), 0) AS total_earnings
    FROM servicecall
    WHERE DATE(end_time) BETWEEN $1 AND $2
  ),
  balance_sum AS (
    SELECT COALESCE(SUM(balance_amount), 0) AS total_balance
    FROM workerlife
  ),
  negative_balance_count AS (
    SELECT COUNT(*) AS negative_balance_workers
    FROM workerlife
    WHERE balance_amount < 0
  ),
  cancel_count AS (
    SELECT COUNT(*) AS total_cancels
    FROM completenotifications
    WHERE DATE(created_at) BETWEEN $1 AND $2 AND complete_status = 'cancel'
  )
  SELECT
    wc.total_workers,
    uc.total_users,
    sc.total_services,
    sc.total_earnings,
    bs.total_balance,
    nb.negative_balance_workers,
    cc.total_cancels
  FROM worker_count wc
  CROSS JOIN user_count uc
  CROSS JOIN service_count sc
  CROSS JOIN balance_sum bs
  CROSS JOIN negative_balance_count nb
  CROSS JOIN cancel_count cc;
`;

/**
 * WORKER APPROVAL QUERIES (CLICKSOLVER SPECIFIC)
 */

const getPendingWorkersWithSkillsQuery = `
  SELECT
    w.worker_id,
    w.verification_status,
    w.created_at,
    w.issues
  FROM workers w
  INNER JOIN workerskills ws ON w.worker_id = ws.worker_id
  WHERE w.worker_id IS NOT NULL;
`;

const getPendingWorkersNotStartedQuery = `
  SELECT
    w.worker_id,
    w.phone_number,
    w.verification_status,
    w.created_at,
    w.issues
  FROM workers w
  LEFT JOIN workerskills ws ON w.worker_id = ws.worker_id
  WHERE ws.worker_id IS NULL;
`;

const getPendingWorkerDetailsQuery = `
  SELECT
    w.worker_id,
    w.name,
    w.phone_number,
    w.verification_status,
    w.issues,
    ws.proof,
    ws.profile,
    ws.service,
    ws.subservices,
    ws.personaldetails,
    ws.address
  FROM workers w
  INNER JOIN workerskills ws ON w.worker_id = ws.worker_id
  WHERE w.worker_id = $1;
`;

const updateWorkerIssuesAndGetTokensQuery = `
  WITH updated AS (
    UPDATE workers
    SET issues = $2::jsonb
    WHERE worker_id = $1
  )
  SELECT fcm_token FROM fcm;
`;

const updateWorkerApproveStatusQuery = `
  UPDATE workers
  SET verification_status = $1
  WHERE worker_id = $2
`;

const checkApprovalVerificationStatusQuery = `
  SELECT
    t.source,
    t.name,
    t.issues,
    t.verification_status,
    ws.service,
    ws.profile
  FROM (
    SELECT worker_id, 'workers' AS source, name, issues, verification_status
    FROM workers
    WHERE worker_id = $1
    UNION ALL
    SELECT worker_id, 'workersverified' AS source, NULL AS name, NULL AS issues, NULL AS verification_status
    FROM workersverified
    WHERE worker_id = $1
  ) t
  LEFT JOIN workerskills ws ON t.worker_id = ws.worker_id
  LIMIT 1;
`;

const workerApproveQuery = `
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
  WHERE worker_id IN (SELECT worker_id FROM inserted_worker);
`;

/**
 * ADDITIONAL ADMIN ANALYTICS QUERIES
 */

// Service Analytics by Type
const getServiceAnalyticsByTypeQuery = `
  SELECT
    sc.service_type,
    COUNT(*) as total_services,
    COUNT(CASE WHEN sc.payment_type = 'cash' THEN 1 END) as cash_services,
    COUNT(CASE WHEN sc.payment_type != 'cash' THEN 1 END) as online_services,
    COALESCE(SUM(sc.payment), 0) as total_revenue,
    COALESCE(AVG(sc.payment), 0) as avg_service_cost,
    COALESCE(MIN(sc.payment), 0) as min_service_cost,
    COALESCE(MAX(sc.payment), 0) as max_service_cost
  FROM servicecall sc
  WHERE sc.payment IS NOT NULL
    AND sc.end_time >= $1
    AND sc.end_time <= $2
  GROUP BY sc.service_type
  ORDER BY total_revenue DESC;
`;

// Worker Performance Analytics
const getWorkerPerformanceAnalyticsQuery = `
  SELECT
    wv.worker_id,
    wv.name,
    wv.phone_number,
    ws.service,
    wl.service_counts,
    wl.money_earned,
    wl.balance_amount,
    COUNT(sc.notification_id) as completed_services_in_period,
    COALESCE(SUM(sc.payment), 0) as earnings_in_period,
    COALESCE(AVG(sc.payment), 0) as avg_service_value,
    COUNT(CASE WHEN sc.payment_type = 'cash' THEN 1 END) as cash_transactions,
    COUNT(CASE WHEN sc.payment_type != 'cash' THEN 1 END) as online_transactions,
    (SELECT COUNT(*) FROM completenotifications
     WHERE worker_id = wv.worker_id
     AND complete_status = 'workercanceled'
     AND created_at >= $1 AND created_at <= $2) as cancelled_services
  FROM workersverified wv
  LEFT JOIN workerskills ws ON wv.worker_id = ws.worker_id
  LEFT JOIN workerlife wl ON wv.worker_id = wl.worker_id
  LEFT JOIN servicecall sc ON wv.worker_id = sc.worker_id
    AND sc.payment IS NOT NULL
    AND sc.end_time >= $1
    AND sc.end_time <= $2
  GROUP BY wv.worker_id, wv.name, wv.phone_number, ws.service,
           wl.service_counts, wl.money_earned, wl.balance_amount
  ORDER BY earnings_in_period DESC
  LIMIT $3 OFFSET $4;
`;

// User Activity Analytics
const getUserActivityAnalyticsQuery = `
  SELECT
    u.user_id,
    u.name,
    u.phone_number,
    u.created_at as user_since,
    COUNT(cn.notification_id) as total_bookings,
    COUNT(CASE WHEN cn.complete_status = 'completed' THEN 1 END) as completed_bookings,
    COUNT(CASE WHEN cn.complete_status IN ('cancel', 'usercanceled') THEN 1 END) as cancelled_bookings,
    COALESCE(SUM(cn.total_cost), 0) as total_spent,
    COALESCE(AVG(cn.total_cost), 0) as avg_booking_value,
    MAX(cn.created_at) as last_booking_date,
    DATE_PART('day', NOW() - MAX(cn.created_at)) as days_since_last_booking
  FROM "user" u
  LEFT JOIN completenotifications cn ON u.user_id = cn.user_id
    AND cn.created_at >= $1
    AND cn.created_at <= $2
  GROUP BY u.user_id, u.name, u.phone_number, u.created_at
  HAVING COUNT(cn.notification_id) > 0
  ORDER BY total_spent DESC
  LIMIT $3 OFFSET $4;
`;

// Revenue Breakdown by Payment Type
const getRevenueByPaymentTypeQuery = `
  SELECT
    DATE(sc.end_time) as date,
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN sc.payment_type = 'cash' THEN 1 END) as cash_transactions,
    COUNT(CASE WHEN sc.payment_type != 'cash' THEN 1 END) as online_transactions,
    COALESCE(SUM(CASE WHEN sc.payment_type = 'cash' THEN sc.payment END), 0) as cash_revenue,
    COALESCE(SUM(CASE WHEN sc.payment_type != 'cash' THEN sc.payment END), 0) as online_revenue,
    COALESCE(SUM(sc.payment), 0) as total_revenue,
    COALESCE(SUM(sc.payment * 0.12), 0) as platform_commission,
    COALESCE(SUM(sc.payment * 0.88), 0) as worker_earnings
  FROM servicecall sc
  WHERE sc.payment IS NOT NULL
    AND sc.end_time >= $1
    AND sc.end_time <= $2
  GROUP BY DATE(sc.end_time)
  ORDER BY date DESC;
`;

// Peak Hours Analytics
const getPeakHoursAnalyticsQuery = `
  SELECT
    EXTRACT(HOUR FROM sc.end_time) as hour_of_day,
    COUNT(*) as service_count,
    COALESCE(SUM(sc.payment), 0) as revenue,
    COALESCE(AVG(sc.payment), 0) as avg_service_value
  FROM servicecall sc
  WHERE sc.payment IS NOT NULL
    AND sc.end_time >= $1
    AND sc.end_time <= $2
  GROUP BY EXTRACT(HOUR FROM sc.end_time)
  ORDER BY service_count DESC;
`;

// Geographical Service Distribution
const getServiceDistributionByAreaQuery = `
  SELECT
    un.area,
    un.city,
    COUNT(cn.notification_id) as total_services,
    COUNT(CASE WHEN cn.complete_status = 'completed' THEN 1 END) as completed_services,
    COUNT(CASE WHEN cn.complete_status IN ('cancel', 'usercanceled', 'workercanceled') THEN 1 END) as cancelled_services,
    COALESCE(SUM(cn.total_cost), 0) as total_revenue,
    COALESCE(AVG(cn.total_cost), 0) as avg_service_value
  FROM usernotifications un
  LEFT JOIN completenotifications cn ON un.user_notification_id = cn.user_notification_id
  WHERE cn.created_at >= $1 AND cn.created_at <= $2
  GROUP BY un.area, un.city
  ORDER BY total_services DESC
  LIMIT $3;
`;

// Worker Balance and Pending Payments Summary
const getWorkerFinancialSummaryQuery = `
  SELECT
    COUNT(*) as total_workers,
    COUNT(CASE WHEN wl.balance_amount > 0 THEN 1 END) as workers_with_positive_balance,
    COUNT(CASE WHEN wl.balance_amount < 0 THEN 1 END) as workers_with_negative_balance,
    COALESCE(SUM(CASE WHEN wl.balance_amount > 0 THEN wl.balance_amount END), 0) as total_positive_balance,
    COALESCE(SUM(CASE WHEN wl.balance_amount < 0 THEN wl.balance_amount END), 0) as total_negative_balance,
    COALESCE(SUM(wl.balance_amount), 0) as net_balance,
    COALESCE(SUM(wl.money_earned), 0) as total_earnings_all_workers,
    COALESCE(AVG(wl.service_counts), 0) as avg_services_per_worker
  FROM workerlife wl;
`;

// Service Completion Rate by Worker
const getWorkerCompletionRateQuery = `
  SELECT
    wv.worker_id,
    wv.name,
    ws.service,
    COUNT(cn.notification_id) as total_services,
    COUNT(CASE WHEN cn.complete_status = 'completed' THEN 1 END) as completed_services,
    COUNT(CASE WHEN cn.complete_status = 'workercanceled' THEN 1 END) as cancelled_services,
    ROUND(100.0 * COUNT(CASE WHEN cn.complete_status = 'completed' THEN 1 END) /
          NULLIF(COUNT(cn.notification_id), 0), 2) as completion_rate_percentage
  FROM workersverified wv
  LEFT JOIN workerskills ws ON wv.worker_id = ws.worker_id
  LEFT JOIN completenotifications cn ON wv.worker_id = cn.worker_id
    AND cn.created_at >= $1 AND cn.created_at <= $2
  GROUP BY wv.worker_id, wv.name, ws.service
  HAVING COUNT(cn.notification_id) > 0
  ORDER BY completion_rate_percentage DESC, completed_services DESC
  LIMIT $3 OFFSET $4;
`;

// Monthly Growth Trends
const getMonthlyGrowthTrendsQuery = `
  SELECT
    DATE_TRUNC('month', date_series)::DATE as month,
    (SELECT COUNT(*) FROM workersverified
     WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', date_series)) as new_workers,
    (SELECT COUNT(*) FROM "user"
     WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', date_series)) as new_users,
    (SELECT COUNT(*) FROM completenotifications
     WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', date_series)) as total_services,
    (SELECT COALESCE(SUM(sc.payment), 0) FROM servicecall sc
     WHERE DATE_TRUNC('month', sc.end_time) = DATE_TRUNC('month', date_series)
     AND sc.payment IS NOT NULL) as monthly_revenue
  FROM generate_series(
    DATE_TRUNC('month', NOW() - INTERVAL '12 months'),
    DATE_TRUNC('month', NOW()),
    INTERVAL '1 month'
  ) as date_series
  ORDER BY month DESC;
`;

// Cashback and Incentives Summary
const getCashbackIncentivesSummaryQuery = `
  SELECT
    COUNT(*) as total_workers_in_program,
    COUNT(CASE WHEN (wl.cashback_approved_times - wl.cashback_gain) > 0 THEN 1 END) as workers_with_pending_cashback,
    COALESCE(SUM(wl.cashback_approved_times - wl.cashback_gain), 0) as total_pending_cashback_count,
    COALESCE(SUM(wl.cashback_gain), 0) as total_cashback_given,
    COALESCE(AVG(wl.service_counts), 0) as avg_services_per_worker
  FROM workerlife wl;
`;

// Service Cancellation Analysis
const getServiceCancellationAnalysisQuery = `
  SELECT
    cn.complete_status as cancellation_type,
    COUNT(*) as cancellation_count,
    DATE(cn.created_at) as cancellation_date,
    COALESCE(SUM(cn.total_cost), 0) as lost_revenue
  FROM completenotifications cn
  WHERE cn.complete_status IN ('cancel', 'usercanceled', 'workercanceled')
    AND cn.created_at >= $1 AND cn.created_at <= $2
  GROUP BY cn.complete_status, DATE(cn.created_at)
  ORDER BY cancellation_date DESC, cancellation_count DESC;
`;

// Real-time Dashboard Summary
const getRealTimeDashboardSummaryQuery = `
  SELECT
    (SELECT COUNT(*) FROM workersverified) as total_verified_workers,
    (SELECT COUNT(*) FROM workers WHERE verification_status = 'pending') as pending_worker_approvals,
    (SELECT COUNT(*) FROM "user") as total_users,
    (SELECT COUNT(*) FROM accepted WHERE complete_status IS NULL) as active_services,
    (SELECT COUNT(*) FROM notifications WHERE status = 'pending') as pending_notifications,
    (SELECT COALESCE(SUM(balance_amount), 0) FROM workerlife) as total_worker_balance,
    (SELECT COUNT(*) FROM workerlife WHERE balance_amount < 0) as workers_with_negative_balance,
    (SELECT COUNT(*) FROM completenotifications WHERE DATE(created_at) = CURRENT_DATE) as services_today,
    (SELECT COALESCE(SUM(sc.payment), 0) FROM servicecall sc
     WHERE sc.payment IS NOT NULL AND DATE(sc.end_time) = CURRENT_DATE) as revenue_today;
`;

// Worker Lifetime Value
const getWorkerLifetimeValueQuery = `
  SELECT
    wv.worker_id,
    wv.name,
    wv.phone_number,
    wv.created_at as joined_date,
    DATE_PART('day', NOW() - wv.created_at) as days_active,
    wl.service_counts as total_services,
    wl.money_earned as lifetime_earnings,
    CASE
      WHEN DATE_PART('day', NOW() - wv.created_at) > 0
      THEN ROUND(wl.service_counts / DATE_PART('day', NOW() - wv.created_at), 2)
      ELSE 0
    END as avg_services_per_day,
    CASE
      WHEN wl.service_counts > 0
      THEN ROUND(wl.money_earned / wl.service_counts, 2)
      ELSE 0
    END as avg_earnings_per_service
  FROM workersverified wv
  LEFT JOIN workerlife wl ON wv.worker_id = wl.worker_id
  WHERE wl.service_counts > 0
  ORDER BY lifetime_earnings DESC
  LIMIT $1 OFFSET $2;
`;

module.exports = {
  // Admin Authentication
  getAdminByIdQuery,
  getAdminByEmailQuery,
  getAdminByCredentialsQuery,
  createAdminQuery,
  updateAdminLastLoginQuery,
  updateAdminPasswordQuery,

  // Dashboard Statistics
  getDashboardStatsQuery,
  getServiceCountsQuery,
  getRevenueStatsQuery,
  getDailyRevenueQuery,
  getWorkerStatsQuery,
  getWorkersBySpecializationStatsQuery,

  // Worker Approval/Verification
  getPendingWorkersQuery,
  getPendingWorkerCountQuery,
  getWorkerByIdWithDetailsQuery,
  updateWorkerVerificationStatusQuery,
  approveWorkerQuery,
  rejectWorkerQuery,
  getVerifiedWorkersQuery,

  // Worker Issues Management
  createWorkerIssueQuery,
  getWorkerIssueByIdQuery,
  getWorkerIssuesByWorkerIdQuery,
  getOpenWorkerIssuesQuery,
  getOpenWorkerIssueCountQuery,
  updateWorkerIssueStatusQuery,
  resolveWorkerIssueQuery,
  getWorkerIssuesByTypeQuery,

  // Admin Reports and Analytics
  getBookingAnalyticsQuery,
  getUserAcquisitionQuery,
  getTopWorkersQuery,
  getTopUsersQuery,
  getUserRetentionQuery,
  getAnomaliesAndIssuesQuery,
  getAdminActivityLogQuery,
  createAdminActivityLogQuery,
  getSystemHealthQuery,
  getReportByDateRangeQuery,

  // ClickSolver Dashboard Queries
  getDashboardDetailsQuery,
  getDashboardDetailsDateRangeQuery,
  getAdministratorDetailsQuery,
  getAdministratorDetailsDateRangeQuery,

  // ClickSolver Worker Approval Queries
  getPendingWorkersWithSkillsQuery,
  getPendingWorkersNotStartedQuery,
  getPendingWorkerDetailsQuery,
  updateWorkerIssuesAndGetTokensQuery,
  updateWorkerApproveStatusQuery,
  checkApprovalVerificationStatusQuery,
  workerApproveQuery,

  // Additional Admin Analytics Queries
  getServiceAnalyticsByTypeQuery,
  getWorkerPerformanceAnalyticsQuery,
  getUserActivityAnalyticsQuery,
  getRevenueByPaymentTypeQuery,
  getPeakHoursAnalyticsQuery,
  getServiceDistributionByAreaQuery,
  getWorkerFinancialSummaryQuery,
  getWorkerCompletionRateQuery,
  getMonthlyGrowthTrendsQuery,
  getCashbackIncentivesSummaryQuery,
  getServiceCancellationAnalysisQuery,
  getRealTimeDashboardSummaryQuery,
  getWorkerLifetimeValueQuery,
};
