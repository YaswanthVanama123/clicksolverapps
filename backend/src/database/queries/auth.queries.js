/**
 * Authentication Queries
 * Handles all SQL queries related to authentication operations
 * including OTP management, user/worker login, sessions, tokens, and onboarding
 */

// ============================================================================
// USER QUERIES (PostgreSQL)
// ============================================================================

/**
 * Get user by phone number (PostgreSQL)
 */
const GET_USER_BY_PHONE_NUMBER = `
  SELECT user_id, name, phone_number
  FROM "user"
  WHERE phone_number = $1
`;

/**
 * Get user by user_id (PostgreSQL)
 */
const GET_USER_BY_USER_ID = `
  SELECT *
  FROM "user"
  WHERE user_id = $1
`;

// ============================================================================
// WORKER LOGIN QUERIES (PostgreSQL)
// ============================================================================

/**
 * Check worker status in verified and non-verified tables with completion steps
 */
const CHECK_WORKER_LOGIN_STATUS = `
  WITH workersverified_check AS (
    SELECT worker_id FROM workersverified WHERE phone_number = $1 LIMIT 1
  ),
  workers_check AS (
    SELECT worker_id FROM workers WHERE phone_number = $1 LIMIT 1
  )
  SELECT
    CASE
      WHEN EXISTS (SELECT 1 FROM workersverified_check) THEN 200
      WHEN EXISTS (SELECT 1 FROM workers_check) THEN 201
      ELSE 400
    END AS status_code,
    COALESCE(
      (SELECT worker_id FROM workersverified_check),
      (SELECT worker_id FROM workers_check)
    ) AS worker_id,
    EXISTS (SELECT 1 FROM workers_check) AS step1,
    EXISTS (SELECT 1 FROM workerskills WHERE worker_id = (SELECT worker_id FROM workers_check)) AS step2,
    EXISTS (SELECT 1 FROM bank_accounts WHERE worker_id = (SELECT worker_id FROM workers_check)) AS step3
`;

/**
 * Update worker session token
 */
const UPDATE_WORKER_SESSION_TOKEN = `
  UPDATE workersverified
  SET session_token = $1
  WHERE worker_id = $2
`;

/**
 * Get worker session token
 */
const GET_WORKER_SESSION_TOKEN = `
  SELECT session_token
  FROM workersverified
  WHERE worker_id = $1
`;

// ============================================================================
// WORKER REGISTRATION STATUS (PostgreSQL)
// ============================================================================

/**
 * Get worker skills by worker_id
 */
const GET_WORKER_SKILLS = `
  SELECT skill_id
  FROM workerskills
  WHERE worker_id = $1
`;

/**
 * Get worker onboarding status from workersverified
 */
const GET_WORKER_ONBOARDING_STATUS_PG = `
  SELECT onboarding_status
  FROM workersverified
  WHERE worker_id = $1
`;

// ============================================================================
// FCM TOKEN MANAGEMENT (PostgreSQL)
// ============================================================================

/**
 * Get all FCM tokens for a worker
 */
const GET_WORKER_FCM_TOKENS = `
  SELECT fcm_token
  FROM fcm
  WHERE worker_id = $1
`;

/**
 * Delete all FCM tokens for a worker
 */
const DELETE_WORKER_FCM_TOKENS = `
  DELETE FROM fcm
  WHERE worker_id = $1
`;

/**
 * Delete specific FCM token for worker
 */
const DELETE_WORKER_FCM_TOKEN = `
  DELETE FROM fcm
  WHERE fcm_token = $1
`;

/**
 * Delete specific FCM token for user
 */
const DELETE_USER_FCM_TOKEN = `
  DELETE FROM userfcm
  WHERE fcm_token = $1
`;

// ============================================================================
// USER ACCOUNT MANAGEMENT (PostgreSQL)
// ============================================================================

/**
 * Account delete query - removes phone number if no active tracks
 */
const DELETE_USER_ACCOUNT = `
  WITH track_data AS (
    SELECT COALESCE(
      (SELECT jsonb_array_length(track)
       FROM useraction
       WHERE user_id = $1
       LIMIT 1),
      0
    ) AS track_length
  ),
  update_query AS (
    UPDATE "user"
    SET phone_number = NULL
    WHERE user_id = $1
      AND (SELECT track_length FROM track_data) = 0
    RETURNING 1
  )
  SELECT json_build_object(
    'status', CASE WHEN EXISTS(SELECT 1 FROM update_query) THEN 200 ELSE 205 END,
    'message', CASE WHEN EXISTS(SELECT 1 FROM update_query)
                      THEN 'User phone number removed successfully.'
                      ELSE 'Account deletion not allowed due to existing track records.'
                 END
  ) AS result
`;

// ============================================================================
// WORKER ACTION TRACKING (PostgreSQL)
// ============================================================================

/**
 * Insert or update worker action
 */
const UPSERT_WORKER_ACTION = `
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
  RETURNING *
`;

/**
 * Create or update user background action
 */
const UPSERT_USER_BACKGROUND_ACTION = `
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
  RETURNING *
`;

// ============================================================================
// WORKER OTP VERIFICATION (PostgreSQL)
// ============================================================================

/**
 * Verify worker OTP and update verification status
 */
const VERIFY_WORKER_OTP_AND_UPDATE = `
  WITH updated AS (
    UPDATE accepted
    SET
      verification_status = TRUE,
      time = jsonb_set(
        COALESCE(time, '{}'::jsonb),
        '{arrived}',
        to_jsonb(to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS'))
      )
    WHERE notification_id = $1
      AND pin = $2
    RETURNING
      user_id,
      user_navigation_cancel_status,
      service_booked,
      worker_id
  )
  SELECT
    u.user_navigation_cancel_status,
    u.user_id,
    u.service_booked,
    u.worker_id,
    COALESCE(ARRAY_AGG(f.fcm_token), '{}') AS fcm_tokens
  FROM updated u
  LEFT JOIN userfcm f
    ON f.user_id = u.user_id
  GROUP BY
    u.user_navigation_cancel_status,
    u.user_id,
    u.service_booked,
    u.worker_id
`;

// ============================================================================
// WORKER CRON QUERIES (PostgreSQL)
// ============================================================================

/**
 * Update worker no_due status based on balance
 */
const UPDATE_WORKER_NO_DUE_STATUS = `
  UPDATE workersverified wv
  SET no_due = CASE
    WHEN wl.balance_amount < -50 THEN FALSE
    WHEN wl.balance_amount >= -50 THEN TRUE
  END
  FROM workerlife wl
  WHERE wv.worker_id = wl.worker_id
`;

/**
 * Get workers with due payments and their FCM tokens
 */
const GET_WORKERS_WITH_DUE_PAYMENTS = `
  SELECT wl.worker_id, wl.balance_amount, f.fcm_token
  FROM workerlife wl
  INNER JOIN fcm f ON wl.worker_id = f.worker_id
  WHERE wl.balance_amount < -50
`;

// ============================================================================
// OTP OPERATIONS (MySQL)
// ============================================================================

/**
 * Store OTP for a phone number (MySQL)
 * Creates a new OTP record or updates existing one
 */
const STORE_OTP = `
  INSERT INTO otps (phone_number, otp_code, expires_at, created_at, attempts)
  VALUES (?, ?, ?, ?, 0)
  ON DUPLICATE KEY UPDATE
    otp_code = VALUES(otp_code),
    expires_at = VALUES(expires_at),
    created_at = VALUES(created_at),
    attempts = 0
`;

/**
 * Verify OTP for a phone number (MySQL)
 * Checks if the provided OTP matches and hasn't expired
 */
const VERIFY_OTP = `
  SELECT id, phone_number, otp_code, expires_at, attempts, created_at
  FROM otps
  WHERE phone_number = ? AND otp_code = ? AND expires_at > NOW()
  LIMIT 1
`;

/**
 * Check if OTP exists and is valid (not expired) (MySQL)
 */
const CHECK_OTP_VALIDITY = `
  SELECT id, expires_at, attempts
  FROM otps
  WHERE phone_number = ? AND expires_at > NOW()
  LIMIT 1
`;

/**
 * Check OTP expiry status (MySQL)
 */
const GET_OTP_EXPIRY = `
  SELECT expires_at, created_at
  FROM otps
  WHERE phone_number = ?
  ORDER BY created_at DESC
  LIMIT 1
`;

/**
 * Increment OTP verification attempts (MySQL)
 */
const INCREMENT_OTP_ATTEMPTS = `
  UPDATE otps
  SET attempts = attempts + 1
  WHERE phone_number = ? AND expires_at > NOW()
`;

/**
 * Clear/delete OTP after successful verification (MySQL)
 */
const DELETE_OTP = `
  DELETE FROM otps
  WHERE phone_number = ?
`;

/**
 * Get OTP verification attempt count (MySQL)
 */
const GET_OTP_ATTEMPTS = `
  SELECT attempts
  FROM otps
  WHERE phone_number = ? AND expires_at > NOW()
  LIMIT 1
`;

/**
 * Block OTP attempts for security (MySQL)
 * Marks user as temporarily blocked after too many failed attempts
 */
const BLOCK_OTP_USER = `
  UPDATE otps
  SET blocked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE)
  WHERE phone_number = ?
`;

/**
 * Check if user is blocked from OTP verification (MySQL)
 */
const CHECK_OTP_BLOCKED = `
  SELECT blocked_until
  FROM otps
  WHERE phone_number = ? AND blocked_until > NOW()
  LIMIT 1
`;

/**
 * Get OTP request count within timeframe (MySQL)
 * Used for rate limiting OTP requests
 */
const GET_OTP_REQUEST_COUNT = `
  SELECT COUNT(*) as request_count
  FROM otps
  WHERE phone_number = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)
`;

// ============================================================================
// USER/WORKER LOGIN VERIFICATION (MySQL)
// ============================================================================

/**
 * Verify user login by phone number and password (MySQL)
 * Retrieves user with password hash for verification
 */
const VERIFY_USER_LOGIN = `
  SELECT id, phone_number, email, password_hash, is_active, user_type, created_at, failed_login_attempts, locked_until
  FROM users
  WHERE phone_number = ? AND is_active = TRUE
  LIMIT 1
`;

/**
 * Verify worker login by phone number and password (MySQL)
 */
const VERIFY_WORKER_LOGIN = `
  SELECT id, phone_number, email, password_hash, is_active, worker_status, created_at, failed_login_attempts, locked_until
  FROM workers
  WHERE phone_number = ? AND is_active = TRUE
  LIMIT 1
`;

/**
 * Get user by phone number (MySQL)
 */
const GET_USER_BY_PHONE = `
  SELECT id, phone_number, email, is_active, user_type, created_at
  FROM users
  WHERE phone_number = ?
  LIMIT 1
`;

/**
 * Get worker by phone number (MySQL)
 */
const GET_WORKER_BY_PHONE = `
  SELECT id, phone_number, email, is_active, worker_status, created_at
  FROM workers
  WHERE phone_number = ?
  LIMIT 1
`;

/**
 * Get user by ID (MySQL)
 */
const GET_USER_BY_ID = `
  SELECT id, phone_number, email, is_active, user_type, created_at
  FROM users
  WHERE id = ?
  LIMIT 1
`;

/**
 * Get worker by ID (MySQL)
 */
const GET_WORKER_BY_ID = `
  SELECT id, phone_number, email, is_active, worker_status, created_at
  FROM workers
  WHERE id = ?
  LIMIT 1
`;

// ============================================================================
// LOGIN ATTEMPTS TRACKING (MySQL)
// ============================================================================

/**
 * Record failed login attempt for user (MySQL)
 */
const RECORD_USER_FAILED_LOGIN = `
  UPDATE users
  SET failed_login_attempts = failed_login_attempts + 1,
      last_failed_login = NOW()
  WHERE id = ?
`;

/**
 * Record failed login attempt for worker (MySQL)
 */
const RECORD_WORKER_FAILED_LOGIN = `
  UPDATE workers
  SET failed_login_attempts = failed_login_attempts + 1,
      last_failed_login = NOW()
  WHERE id = ?
`;

/**
 * Reset user login attempts after successful login (MySQL)
 */
const RESET_USER_LOGIN_ATTEMPTS = `
  UPDATE users
  SET failed_login_attempts = 0,
      last_failed_login = NULL,
      locked_until = NULL,
      last_login = NOW()
  WHERE id = ?
`;

/**
 * Reset worker login attempts after successful login (MySQL)
 */
const RESET_WORKER_LOGIN_ATTEMPTS = `
  UPDATE workers
  SET failed_login_attempts = 0,
      last_failed_login = NULL,
      locked_until = NULL,
      last_login = NOW()
  WHERE id = ?
`;

/**
 * Lock user account after too many failed attempts (MySQL)
 */
const LOCK_USER_ACCOUNT = `
  UPDATE users
  SET locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE),
      is_active = CASE WHEN ? THEN FALSE ELSE is_active END
  WHERE id = ?
`;

/**
 * Lock worker account after too many failed attempts (MySQL)
 */
const LOCK_WORKER_ACCOUNT = `
  UPDATE workers
  SET locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE),
      is_active = CASE WHEN ? THEN FALSE ELSE is_active END
  WHERE id = ?
`;

/**
 * Get user failed login attempts (MySQL)
 */
const GET_USER_LOGIN_ATTEMPTS = `
  SELECT failed_login_attempts, locked_until, last_failed_login
  FROM users
  WHERE id = ?
  LIMIT 1
`;

/**
 * Get worker failed login attempts (MySQL)
 */
const GET_WORKER_LOGIN_ATTEMPTS = `
  SELECT failed_login_attempts, locked_until, last_failed_login
  FROM workers
  WHERE id = ?
  LIMIT 1
`;

/**
 * Create login history record (MySQL)
 */
const CREATE_LOGIN_HISTORY = `
  INSERT INTO login_history (user_id, user_type, ip_address, user_agent, login_status, login_time)
  VALUES (?, ?, ?, ?, ?, NOW())
`;

/**
 * Get recent login history for user (MySQL)
 */
const GET_USER_LOGIN_HISTORY = `
  SELECT login_time, ip_address, user_agent, login_status
  FROM login_history
  WHERE user_id = ? AND user_type = ?
  ORDER BY login_time DESC
  LIMIT ?
`;

/**
 * Get suspicious login attempts (MySQL)
 * Detects multiple failed attempts from same IP
 */
const GET_SUSPICIOUS_LOGIN_ATTEMPTS = `
  SELECT ip_address, COUNT(*) as attempt_count, MAX(login_time) as last_attempt
  FROM login_history
  WHERE login_status = 'failed' AND login_time > DATE_SUB(NOW(), INTERVAL ? MINUTE)
  GROUP BY ip_address
  HAVING attempt_count >= ?
`;

// ============================================================================
// SESSION MANAGEMENT (MySQL)
// ============================================================================

/**
 * Create a new session for user (MySQL)
 */
const CREATE_SESSION = `
  INSERT INTO sessions (user_id, user_type, token, ip_address, user_agent, expires_at, created_at, last_activity)
  VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
`;

/**
 * Get active session by token (MySQL)
 */
const GET_SESSION_BY_TOKEN = `
  SELECT id, user_id, user_type, ip_address, user_agent, expires_at, created_at, last_activity
  FROM sessions
  WHERE token = ? AND expires_at > NOW() AND is_active = TRUE
  LIMIT 1
`;

/**
 * Get all active sessions for a user (MySQL)
 */
const GET_USER_SESSIONS = `
  SELECT id, user_id, user_type, ip_address, user_agent, expires_at, created_at, last_activity
  FROM sessions
  WHERE user_id = ? AND user_type = ? AND expires_at > NOW() AND is_active = TRUE
  ORDER BY last_activity DESC
`;

/**
 * Update session last activity timestamp (MySQL)
 */
const UPDATE_SESSION_ACTIVITY = `
  UPDATE sessions
  SET last_activity = NOW()
  WHERE token = ? AND is_active = TRUE
`;

/**
 * Extend session expiry time (MySQL)
 */
const EXTEND_SESSION_EXPIRY = `
  UPDATE sessions
  SET expires_at = DATE_ADD(NOW(), INTERVAL ? HOUR)
  WHERE token = ? AND is_active = TRUE
`;

/**
 * Invalidate single session by token (MySQL)
 */
const INVALIDATE_SESSION = `
  UPDATE sessions
  SET is_active = FALSE, invalidated_at = NOW()
  WHERE token = ? AND is_active = TRUE
`;

/**
 * Invalidate all sessions for a user (MySQL)
 */
const INVALIDATE_ALL_USER_SESSIONS = `
  UPDATE sessions
  SET is_active = FALSE, invalidated_at = NOW()
  WHERE user_id = ? AND user_type = ? AND is_active = TRUE
`;

/**
 * Invalidate all sessions except current (MySQL)
 */
const INVALIDATE_OTHER_SESSIONS = `
  UPDATE sessions
  SET is_active = FALSE, invalidated_at = NOW()
  WHERE user_id = ? AND user_type = ? AND token != ? AND is_active = TRUE
`;

/**
 * Delete expired sessions (MySQL)
 */
const DELETE_EXPIRED_SESSIONS = `
  DELETE FROM sessions
  WHERE expires_at < NOW() OR (invalidated_at IS NOT NULL AND invalidated_at < DATE_SUB(NOW(), INTERVAL 7 DAY))
`;

/**
 * Get session count for a user (MySQL)
 */
const GET_USER_SESSION_COUNT = `
  SELECT COUNT(*) as session_count
  FROM sessions
  WHERE user_id = ? AND user_type = ? AND is_active = TRUE AND expires_at > NOW()
`;

/**
 * Get session by ID (MySQL)
 */
const GET_SESSION_BY_ID = `
  SELECT id, user_id, user_type, token, ip_address, user_agent, expires_at, created_at, last_activity, is_active
  FROM sessions
  WHERE id = ?
  LIMIT 1
`;

/**
 * Check if session exists and is valid (MySQL)
 */
const CHECK_SESSION_VALIDITY = `
  SELECT id, expires_at, is_active
  FROM sessions
  WHERE token = ?
  LIMIT 1
`;

/**
 * Get concurrent sessions for user (MySQL)
 */
const GET_CONCURRENT_SESSIONS = `
  SELECT id, ip_address, user_agent, created_at, last_activity
  FROM sessions
  WHERE user_id = ? AND user_type = ? AND is_active = TRUE AND expires_at > NOW()
  ORDER BY created_at DESC
`;

/**
 * Delete old inactive sessions (MySQL)
 */
const DELETE_OLD_SESSIONS = `
  DELETE FROM sessions
  WHERE last_activity < DATE_SUB(NOW(), INTERVAL ? DAY)
`;

// ============================================================================
// TOKEN STORAGE AND VERIFICATION (MySQL)
// ============================================================================

/**
 * Store refresh token (MySQL)
 */
const STORE_REFRESH_TOKEN = `
  INSERT INTO refresh_tokens (user_id, user_type, token, ip_address, expires_at, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`;

/**
 * Get refresh token by token value (MySQL)
 */
const GET_REFRESH_TOKEN = `
  SELECT id, user_id, user_type, ip_address, expires_at, created_at, revoked_at, last_used
  FROM refresh_tokens
  WHERE token = ? AND expires_at > NOW() AND revoked_at IS NULL
  LIMIT 1
`;

/**
 * Get all valid refresh tokens for a user (MySQL)
 */
const GET_USER_REFRESH_TOKENS = `
  SELECT id, user_id, user_type, ip_address, expires_at, created_at, last_used
  FROM refresh_tokens
  WHERE user_id = ? AND user_type = ? AND expires_at > NOW() AND revoked_at IS NULL
  ORDER BY created_at DESC
`;

/**
 * Update refresh token last used timestamp (MySQL)
 */
const UPDATE_REFRESH_TOKEN_USAGE = `
  UPDATE refresh_tokens
  SET last_used = NOW(), usage_count = usage_count + 1
  WHERE token = ? AND revoked_at IS NULL
`;

/**
 * Revoke specific refresh token (MySQL)
 */
const REVOKE_REFRESH_TOKEN = `
  UPDATE refresh_tokens
  SET revoked_at = NOW()
  WHERE token = ? AND revoked_at IS NULL
`;

/**
 * Revoke all refresh tokens for a user (MySQL)
 */
const REVOKE_ALL_USER_TOKENS = `
  UPDATE refresh_tokens
  SET revoked_at = NOW()
  WHERE user_id = ? AND user_type = ? AND revoked_at IS NULL
`;

/**
 * Delete expired refresh tokens (MySQL)
 */
const DELETE_EXPIRED_REFRESH_TOKENS = `
  DELETE FROM refresh_tokens
  WHERE expires_at < NOW() OR (revoked_at IS NOT NULL AND revoked_at < DATE_SUB(NOW(), INTERVAL 30 DAY))
`;

/**
 * Check if refresh token is valid (MySQL)
 */
const CHECK_REFRESH_TOKEN_VALIDITY = `
  SELECT id, expires_at, revoked_at
  FROM refresh_tokens
  WHERE token = ?
  LIMIT 1
`;

/**
 * Get refresh token usage count (MySQL)
 */
const GET_REFRESH_TOKEN_USAGE = `
  SELECT usage_count, last_used, created_at
  FROM refresh_tokens
  WHERE token = ?
  LIMIT 1
`;

// ============================================================================
// PASSWORD RESET TOKEN MANAGEMENT (MySQL)
// ============================================================================

/**
 * Store password reset token (MySQL)
 */
const STORE_PASSWORD_RESET_TOKEN = `
  INSERT INTO password_reset_tokens (user_id, user_type, token, expires_at, created_at)
  VALUES (?, ?, ?, ?, ?)
`;

/**
 * Get password reset token (MySQL)
 */
const GET_PASSWORD_RESET_TOKEN = `
  SELECT id, user_id, user_type, expires_at, created_at, used_at
  FROM password_reset_tokens
  WHERE token = ? AND expires_at > NOW() AND used_at IS NULL
  LIMIT 1
`;

/**
 * Mark password reset token as used (MySQL)
 */
const MARK_RESET_TOKEN_USED = `
  UPDATE password_reset_tokens
  SET used_at = NOW()
  WHERE token = ?
`;

/**
 * Invalidate all password reset tokens for a user (MySQL)
 */
const INVALIDATE_USER_RESET_TOKENS = `
  UPDATE password_reset_tokens
  SET used_at = NOW()
  WHERE user_id = ? AND user_type = ? AND used_at IS NULL
`;

/**
 * Check if password reset token is valid (MySQL)
 */
const CHECK_RESET_TOKEN_VALIDITY = `
  SELECT id, expires_at, used_at
  FROM password_reset_tokens
  WHERE token = ?
  LIMIT 1
`;

/**
 * Delete expired password reset tokens (MySQL)
 */
const DELETE_EXPIRED_RESET_TOKENS = `
  DELETE FROM password_reset_tokens
  WHERE expires_at < NOW() OR (used_at IS NOT NULL AND used_at < DATE_SUB(NOW(), INTERVAL 7 DAY))
`;

/**
 * Get active reset tokens for user (MySQL)
 */
const GET_USER_ACTIVE_RESET_TOKENS = `
  SELECT id, token, expires_at, created_at
  FROM password_reset_tokens
  WHERE user_id = ? AND user_type = ? AND expires_at > NOW() AND used_at IS NULL
  ORDER BY created_at DESC
`;

// ============================================================================
// EMAIL VERIFICATION TOKEN MANAGEMENT (MySQL)
// ============================================================================

/**
 * Store email verification token (MySQL)
 */
const STORE_EMAIL_VERIFICATION_TOKEN = `
  INSERT INTO email_verification_tokens (user_id, user_type, email, token, expires_at, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`;

/**
 * Get email verification token (MySQL)
 */
const GET_EMAIL_VERIFICATION_TOKEN = `
  SELECT id, user_id, user_type, email, expires_at, created_at, verified_at
  FROM email_verification_tokens
  WHERE token = ? AND expires_at > NOW() AND verified_at IS NULL
  LIMIT 1
`;

/**
 * Mark email verification token as used (MySQL)
 */
const MARK_EMAIL_VERIFIED = `
  UPDATE email_verification_tokens
  SET verified_at = NOW()
  WHERE token = ?
`;

/**
 * Delete expired email verification tokens (MySQL)
 */
const DELETE_EXPIRED_EMAIL_TOKENS = `
  DELETE FROM email_verification_tokens
  WHERE expires_at < NOW() OR (verified_at IS NOT NULL AND verified_at < DATE_SUB(NOW(), INTERVAL 7 DAY))
`;

// ============================================================================
// REGISTRATION STATUS CHECKS (MySQL)
// ============================================================================

/**
 * Check if phone number exists in users table (MySQL)
 */
const CHECK_PHONE_EXISTS_USER = `
  SELECT id, is_active, phone_verified_at
  FROM users
  WHERE phone_number = ?
  LIMIT 1
`;

/**
 * Check if phone number exists in workers table (MySQL)
 */
const CHECK_PHONE_EXISTS_WORKER = `
  SELECT id, is_active, phone_verified_at
  FROM workers
  WHERE phone_number = ?
  LIMIT 1
`;

/**
 * Check if email exists in users table (MySQL)
 */
const CHECK_EMAIL_EXISTS_USER = `
  SELECT id, is_active, email_verified_at
  FROM users
  WHERE email = ?
  LIMIT 1
`;

/**
 * Check if email exists in workers table (MySQL)
 */
const CHECK_EMAIL_EXISTS_WORKER = `
  SELECT id, is_active, email_verified_at
  FROM workers
  WHERE email = ?
  LIMIT 1
`;

/**
 * Create new user registration (MySQL)
 */
const CREATE_USER_REGISTRATION = `
  INSERT INTO users (phone_number, email, password_hash, user_type, is_active, created_at)
  VALUES (?, ?, ?, ?, TRUE, ?)
`;

/**
 * Create new worker registration (MySQL)
 */
const CREATE_WORKER_REGISTRATION = `
  INSERT INTO workers (phone_number, email, password_hash, worker_status, is_active, created_at)
  VALUES (?, ?, ?, 'pending', TRUE, ?)
`;

/**
 * Update user password (MySQL)
 */
const UPDATE_USER_PASSWORD = `
  UPDATE users
  SET password_hash = ?, updated_at = ?, password_changed_at = NOW()
  WHERE id = ?
`;

/**
 * Update worker password (MySQL)
 */
const UPDATE_WORKER_PASSWORD = `
  UPDATE workers
  SET password_hash = ?, updated_at = ?, password_changed_at = NOW()
  WHERE id = ?
`;

/**
 * Deactivate user account (MySQL)
 */
const DEACTIVATE_USER = `
  UPDATE users
  SET is_active = FALSE, deactivated_at = NOW()
  WHERE id = ?
`;

/**
 * Deactivate worker account (MySQL)
 */
const DEACTIVATE_WORKER = `
  UPDATE workers
  SET is_active = FALSE, deactivated_at = NOW()
  WHERE id = ?
`;

/**
 * Reactivate user account (MySQL)
 */
const REACTIVATE_USER = `
  UPDATE users
  SET is_active = TRUE, deactivated_at = NULL, reactivated_at = NOW()
  WHERE id = ?
`;

/**
 * Reactivate worker account (MySQL)
 */
const REACTIVATE_WORKER = `
  UPDATE workers
  SET is_active = TRUE, deactivated_at = NULL, reactivated_at = NOW()
  WHERE id = ?
`;

/**
 * Check if user account is locked (MySQL)
 */
const CHECK_USER_ACCOUNT_LOCKED = `
  SELECT locked_until, is_active
  FROM users
  WHERE id = ?
  LIMIT 1
`;

/**
 * Check if worker account is locked (MySQL)
 */
const CHECK_WORKER_ACCOUNT_LOCKED = `
  SELECT locked_until, is_active
  FROM workers
  WHERE id = ?
  LIMIT 1
`;

// ============================================================================
// ONBOARDING STATUS QUERIES
// ============================================================================

/**
 * Get user onboarding status
 */
const GET_USER_ONBOARDING_STATUS = `
  SELECT id, phone_number, email, is_profile_complete, is_email_verified, is_phone_verified,
         profile_completion_percentage, onboarding_completed_at, created_at
  FROM users
  WHERE id = ?
  LIMIT 1
`;

/**
 * Get worker onboarding status
 */
const GET_WORKER_ONBOARDING_STATUS = `
  SELECT id, phone_number, email, is_profile_complete, is_email_verified, is_phone_verified,
         is_documents_verified, profile_completion_percentage, worker_status,
         onboarding_completed_at, created_at
  FROM workers
  WHERE id = ?
  LIMIT 1
`;

/**
 * Update user profile completion status
 */
const UPDATE_USER_PROFILE_COMPLETION = `
  UPDATE users
  SET is_profile_complete = TRUE, profile_completion_percentage = 100,
      onboarding_completed_at = NOW(), updated_at = NOW()
  WHERE id = ?
`;

/**
 * Update worker profile completion status
 */
const UPDATE_WORKER_PROFILE_COMPLETION = `
  UPDATE workers
  SET is_profile_complete = TRUE, profile_completion_percentage = 100,
      onboarding_completed_at = NOW(), updated_at = NOW()
  WHERE id = ?
`;

/**
 * Update user email verification status
 */
const UPDATE_USER_EMAIL_VERIFIED = `
  UPDATE users
  SET is_email_verified = TRUE, email_verified_at = NOW(), updated_at = NOW()
  WHERE id = ?
`;

/**
 * Update user phone verification status
 */
const UPDATE_USER_PHONE_VERIFIED = `
  UPDATE users
  SET is_phone_verified = TRUE, phone_verified_at = NOW(), updated_at = NOW()
  WHERE id = ?
`;

/**
 * Update worker email verification status
 */
const UPDATE_WORKER_EMAIL_VERIFIED = `
  UPDATE workers
  SET is_email_verified = TRUE, email_verified_at = NOW(), updated_at = NOW()
  WHERE id = ?
`;

/**
 * Update worker phone verification status
 */
const UPDATE_WORKER_PHONE_VERIFIED = `
  UPDATE workers
  SET is_phone_verified = TRUE, phone_verified_at = NOW(), updated_at = NOW()
  WHERE id = ?
`;

/**
 * Update worker documents verification status
 */
const UPDATE_WORKER_DOCUMENTS_VERIFIED = `
  UPDATE workers
  SET is_documents_verified = TRUE, documents_verified_at = NOW(),
      worker_status = 'approved', updated_at = NOW()
  WHERE id = ?
`;

/**
 * Update user profile completion percentage
 */
const UPDATE_USER_PROFILE_PERCENTAGE = `
  UPDATE users
  SET profile_completion_percentage = ?, updated_at = NOW()
  WHERE id = ?
`;

/**
 * Update worker profile completion percentage
 */
const UPDATE_WORKER_PROFILE_PERCENTAGE = `
  UPDATE workers
  SET profile_completion_percentage = ?, updated_at = NOW()
  WHERE id = ?
`;

/**
 * Get user verification status
 */
const GET_USER_VERIFICATION_STATUS = `
  SELECT id, is_email_verified, is_phone_verified, email_verified_at, phone_verified_at
  FROM users
  WHERE id = ?
  LIMIT 1
`;

/**
 * Get worker verification status
 */
const GET_WORKER_VERIFICATION_STATUS = `
  SELECT id, is_email_verified, is_phone_verified, is_documents_verified,
         email_verified_at, phone_verified_at, documents_verified_at, worker_status
  FROM workers
  WHERE id = ?
  LIMIT 1
`;

/**
 * Check if user has completed onboarding
 */
const IS_USER_ONBOARDING_COMPLETE = `
  SELECT id
  FROM users
  WHERE id = ? AND is_profile_complete = TRUE AND is_email_verified = TRUE
         AND is_phone_verified = TRUE
  LIMIT 1
`;

/**
 * Check if worker has completed onboarding
 */
const IS_WORKER_ONBOARDING_COMPLETE = `
  SELECT id
  FROM workers
  WHERE id = ? AND is_profile_complete = TRUE AND is_email_verified = TRUE
         AND is_phone_verified = TRUE AND is_documents_verified = TRUE
  LIMIT 1
`;

/**
 * Get users pending email verification
 */
const GET_PENDING_EMAIL_VERIFICATION = `
  SELECT id, phone_number, email, created_at
  FROM users
  WHERE is_email_verified = FALSE AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
`;

/**
 * Get workers pending document verification
 */
const GET_PENDING_DOCUMENT_VERIFICATION = `
  SELECT id, phone_number, email, worker_status, created_at
  FROM workers
  WHERE is_documents_verified = FALSE AND worker_status = 'pending'
`;

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // PostgreSQL User Queries
  GET_USER_BY_PHONE_NUMBER,
  GET_USER_BY_USER_ID,

  // PostgreSQL Worker Login Queries
  CHECK_WORKER_LOGIN_STATUS,
  UPDATE_WORKER_SESSION_TOKEN,
  GET_WORKER_SESSION_TOKEN,

  // PostgreSQL Worker Registration
  GET_WORKER_SKILLS,
  GET_WORKER_ONBOARDING_STATUS_PG,

  // PostgreSQL FCM Token Management
  GET_WORKER_FCM_TOKENS,
  DELETE_WORKER_FCM_TOKENS,
  DELETE_WORKER_FCM_TOKEN,
  DELETE_USER_FCM_TOKEN,

  // PostgreSQL User Account Management
  DELETE_USER_ACCOUNT,

  // PostgreSQL Worker Action Tracking
  UPSERT_WORKER_ACTION,
  UPSERT_USER_BACKGROUND_ACTION,

  // PostgreSQL Worker OTP Verification
  VERIFY_WORKER_OTP_AND_UPDATE,

  // PostgreSQL Worker Cron Queries
  UPDATE_WORKER_NO_DUE_STATUS,
  GET_WORKERS_WITH_DUE_PAYMENTS,

  // OTP Operations (MySQL)
  STORE_OTP,
  VERIFY_OTP,
  CHECK_OTP_VALIDITY,
  GET_OTP_EXPIRY,
  INCREMENT_OTP_ATTEMPTS,
  DELETE_OTP,
  GET_OTP_ATTEMPTS,
  BLOCK_OTP_USER,
  CHECK_OTP_BLOCKED,
  GET_OTP_REQUEST_COUNT,

  // User/Worker Login Verification (MySQL)
  VERIFY_USER_LOGIN,
  VERIFY_WORKER_LOGIN,
  GET_USER_BY_PHONE,
  GET_WORKER_BY_PHONE,
  GET_USER_BY_ID,
  GET_WORKER_BY_ID,

  // Login Attempts Tracking (MySQL)
  RECORD_USER_FAILED_LOGIN,
  RECORD_WORKER_FAILED_LOGIN,
  RESET_USER_LOGIN_ATTEMPTS,
  RESET_WORKER_LOGIN_ATTEMPTS,
  LOCK_USER_ACCOUNT,
  LOCK_WORKER_ACCOUNT,
  GET_USER_LOGIN_ATTEMPTS,
  GET_WORKER_LOGIN_ATTEMPTS,
  CREATE_LOGIN_HISTORY,
  GET_USER_LOGIN_HISTORY,
  GET_SUSPICIOUS_LOGIN_ATTEMPTS,

  // Session Management (MySQL)
  CREATE_SESSION,
  GET_SESSION_BY_TOKEN,
  GET_USER_SESSIONS,
  UPDATE_SESSION_ACTIVITY,
  EXTEND_SESSION_EXPIRY,
  INVALIDATE_SESSION,
  INVALIDATE_ALL_USER_SESSIONS,
  INVALIDATE_OTHER_SESSIONS,
  DELETE_EXPIRED_SESSIONS,
  GET_USER_SESSION_COUNT,
  GET_SESSION_BY_ID,
  CHECK_SESSION_VALIDITY,
  GET_CONCURRENT_SESSIONS,
  DELETE_OLD_SESSIONS,

  // Token Storage and Verification (MySQL)
  STORE_REFRESH_TOKEN,
  GET_REFRESH_TOKEN,
  GET_USER_REFRESH_TOKENS,
  UPDATE_REFRESH_TOKEN_USAGE,
  REVOKE_REFRESH_TOKEN,
  REVOKE_ALL_USER_TOKENS,
  DELETE_EXPIRED_REFRESH_TOKENS,
  CHECK_REFRESH_TOKEN_VALIDITY,
  GET_REFRESH_TOKEN_USAGE,

  // Password Reset Token Management (MySQL)
  STORE_PASSWORD_RESET_TOKEN,
  GET_PASSWORD_RESET_TOKEN,
  MARK_RESET_TOKEN_USED,
  INVALIDATE_USER_RESET_TOKENS,
  CHECK_RESET_TOKEN_VALIDITY,
  DELETE_EXPIRED_RESET_TOKENS,
  GET_USER_ACTIVE_RESET_TOKENS,

  // Email Verification Token Management (MySQL)
  STORE_EMAIL_VERIFICATION_TOKEN,
  GET_EMAIL_VERIFICATION_TOKEN,
  MARK_EMAIL_VERIFIED,
  DELETE_EXPIRED_EMAIL_TOKENS,

  // Registration Status Checks (MySQL)
  CHECK_PHONE_EXISTS_USER,
  CHECK_PHONE_EXISTS_WORKER,
  CHECK_EMAIL_EXISTS_USER,
  CHECK_EMAIL_EXISTS_WORKER,
  CREATE_USER_REGISTRATION,
  CREATE_WORKER_REGISTRATION,
  UPDATE_USER_PASSWORD,
  UPDATE_WORKER_PASSWORD,
  DEACTIVATE_USER,
  DEACTIVATE_WORKER,
  REACTIVATE_USER,
  REACTIVATE_WORKER,
  CHECK_USER_ACCOUNT_LOCKED,
  CHECK_WORKER_ACCOUNT_LOCKED,

  // Onboarding Status Queries (MySQL)
  GET_USER_ONBOARDING_STATUS,
  GET_WORKER_ONBOARDING_STATUS,
  UPDATE_USER_PROFILE_COMPLETION,
  UPDATE_WORKER_PROFILE_COMPLETION,
  UPDATE_USER_EMAIL_VERIFIED,
  UPDATE_USER_PHONE_VERIFIED,
  UPDATE_WORKER_EMAIL_VERIFIED,
  UPDATE_WORKER_PHONE_VERIFIED,
  UPDATE_WORKER_DOCUMENTS_VERIFIED,
  UPDATE_USER_PROFILE_PERCENTAGE,
  UPDATE_WORKER_PROFILE_PERCENTAGE,
  GET_USER_VERIFICATION_STATUS,
  GET_WORKER_VERIFICATION_STATUS,
  IS_USER_ONBOARDING_COMPLETE,
  IS_WORKER_ONBOARDING_COMPLETE,
  GET_PENDING_EMAIL_VERIFICATION,
  GET_PENDING_DOCUMENT_VERIFICATION,
};
