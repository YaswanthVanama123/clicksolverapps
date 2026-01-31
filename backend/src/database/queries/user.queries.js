/**
 * User Database Queries
 * Contains common SQL queries for user operations
 */

const getUserByIdQuery = `
  SELECT id, name, email, phone, avatar_url, status, created_at, updated_at
  FROM users
  WHERE id = $1 AND deleted_at IS NULL;
`;

const createUserQuery = `
  INSERT INTO users (name, email, phone, avatar_url, status, created_at, updated_at)
  VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, name, email, phone, avatar_url, status, created_at, updated_at;
`;

const updateUserQuery = `
  UPDATE users
  SET name = COALESCE($2, name),
      email = COALESCE($3, email),
      phone = COALESCE($4, phone),
      avatar_url = COALESCE($5, avatar_url),
      status = COALESCE($6, status),
      updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, name, email, phone, avatar_url, status, created_at, updated_at;
`;

const getUserByPhoneQuery = `
  SELECT id, name, email, phone, avatar_url, status, created_at, updated_at
  FROM users
  WHERE phone = $1 AND deleted_at IS NULL;
`;

const getAllUsersQuery = `
  SELECT id, name, email, phone, avatar_url, status, created_at, updated_at
  FROM users
  WHERE deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT $1 OFFSET $2;
`;

const getUserCountQuery = `
  SELECT COUNT(*) as total
  FROM users
  WHERE deleted_at IS NULL;
`;

const deleteUserQuery = `
  UPDATE users
  SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id;
`;

// ============================================================================
// FCM TOKEN QUERIES
// ============================================================================

const storeFcmTokenForUserQuery = `
  INSERT INTO fcm_tokens (user_id, user_type, token, device_id, device_type, created_at, updated_at)
  VALUES ($1, 'user', $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, user_id, token, device_id, device_type, created_at, updated_at;
`;

const updateUserFcmTokenQuery = `
  UPDATE fcm_tokens
  SET token = $2, updated_at = CURRENT_TIMESTAMP
  WHERE user_id = $1 AND device_id = $3 AND user_type = 'user'
  RETURNING id, user_id, token, device_id, updated_at;
`;

const getUserFcmTokensQuery = `
  SELECT id, user_id, token, device_id, device_type, created_at, updated_at
  FROM fcm_tokens
  WHERE user_id = $1 AND user_type = 'user'
  ORDER BY updated_at DESC;
`;

const deleteUserFcmTokenQuery = `
  DELETE FROM fcm_tokens
  WHERE user_id = $1 AND device_id = $2 AND user_type = 'user'
  RETURNING id;
`;

const storeUserFcmTokenWithDeleteQuery = `
  WITH delete_matched AS (
    DELETE FROM userfcm
    WHERE fcm_token = $2
  )
  INSERT INTO userfcm (user_id, fcm_token)
  VALUES ($1, $2)
  ON CONFLICT (user_id, fcm_token)
  DO NOTHING
  RETURNING user_id, fcm_token;
`;

const deleteUserFcmTokenByTokenQuery = `
  DELETE FROM userfcm
  WHERE fcm_token = $1
  RETURNING user_id, fcm_token;
`;

const getActiveUserFcmTokensQuery = `
  SELECT user_id, fcm_token
  FROM userfcm
  WHERE user_id = $1
  ORDER BY user_id;
`;

const getAllActiveUserFcmTokensQuery = `
  SELECT uf.user_id, uf.fcm_token
  FROM userfcm uf
  INNER JOIN "user" u ON uf.user_id = u.user_id
  WHERE u.last_active > (CURRENT_TIMESTAMP - INTERVAL '90 days')
  ORDER BY uf.user_id;
`;

const storeUserReceivedNotificationQuery = `
  INSERT INTO userrecievednotifications (title, body, data, receivedat, user_id, encodedid, fcm_token)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  RETURNING *;
`;

const getUserReceivedNotificationsQuery = `
  SELECT title, body, encodedId, data, receivedat
  FROM userrecievednotifications
  WHERE user_id = $1 AND fcm_token = $2
  ORDER BY receivedat DESC
  LIMIT 10;
`;

// ============================================================================
// NOTIFICATION QUERIES
// ============================================================================

const storeUserNotificationQuery = `
  INSERT INTO notifications (user_id, user_type, title, body, notification_type, related_id, related_type, data, is_read, created_at, updated_at)
  VALUES ($1, 'user', $2, $3, $4, $5, $6, $7, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, user_id, title, body, notification_type, is_read, created_at;
`;

const getUserNotificationsQuery = `
  SELECT id, user_id, title, body, notification_type, related_id, related_type, data, is_read, created_at, updated_at
  FROM notifications
  WHERE user_id = $1 AND user_type = 'user'
  ORDER BY created_at DESC
  LIMIT $2 OFFSET $3;
`;

const getUserUnreadNotificationCountQuery = `
  SELECT COUNT(*) as unread_count
  FROM notifications
  WHERE user_id = $1 AND user_type = 'user' AND is_read = false;
`;

const markUserNotificationAsReadQuery = `
  UPDATE notifications
  SET is_read = true, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND user_id = $2 AND user_type = 'user'
  RETURNING id, is_read, updated_at;
`;

const deleteUserNotificationQuery = `
  DELETE FROM notifications
  WHERE id = $1 AND user_id = $2 AND user_type = 'user'
  RETURNING id;
`;

const markAllUserNotificationsAsReadQuery = `
  UPDATE notifications
  SET is_read = true, updated_at = CURRENT_TIMESTAMP
  WHERE user_id = $1 AND user_type = 'user' AND is_read = false
  RETURNING id;
`;

// ============================================================================
// USER NOTIFICATIONS TABLE QUERIES
// ============================================================================

const insertUserNotificationRequestQuery = `
  INSERT INTO userNotifications (
    user_id, longitude, latitude, created_at,
    area, pincode, city, alternate_name,
    alternate_phone_number, service_booked
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  RETURNING user_notification_id;
`;

const getUserNotificationByIdQuery = `
  SELECT user_notification_id, user_id, longitude, latitude, created_at,
         area, pincode, city, alternate_name, alternate_phone_number, service_booked
  FROM userNotifications
  WHERE user_notification_id = $1;
`;

const insertWorkerNotificationsForRequestQuery = `
  INSERT INTO notifications (
    user_notification_id, user_id, worker_id,
    longitude, latitude, created_at, pin, service_booked,
    discount, coupons_applied, total_cost, tip_amount
  )
  SELECT $1, $2, worker_id, $3, $4, $5, $6, $7, $8, $9, $10, $11
  FROM UNNEST($12::int[]) AS worker_id
  RETURNING worker_id, notification_id;
`;

const getWorkerFcmTokensForNotificationQuery = `
  SELECT fcm_token
  FROM fcm
  WHERE worker_id IN (SELECT unnest($1::int[]))
  ORDER BY worker_id;
`;

// ============================================================================
// STATUS UPDATE QUERIES
// ============================================================================

const updateUserStatusQuery = `
  UPDATE users
  SET status = $2, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, status, updated_at;
`;

const getUsersByStatusQuery = `
  SELECT id, name, email, phone, avatar_url, status, created_at, updated_at
  FROM users
  WHERE status = $1 AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT $2 OFFSET $3;
`;

// ============================================================================
// SEARCH AND FILTER QUERIES
// ============================================================================

const searchUsersByNameQuery = `
  SELECT id, name, email, phone, avatar_url, status, created_at, updated_at
  FROM users
  WHERE (name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1) AND deleted_at IS NULL
  ORDER BY name ASC
  LIMIT $2 OFFSET $3;
`;

const searchUsersByEmailQuery = `
  SELECT id, name, email, phone, avatar_url, status, created_at, updated_at
  FROM users
  WHERE email = $1 AND deleted_at IS NULL;
`;

const getUsersByCreatedDateRangeQuery = `
  SELECT id, name, email, phone, avatar_url, status, created_at, updated_at
  FROM users
  WHERE created_at BETWEEN $1 AND $2 AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT $3 OFFSET $4;
`;

// ============================================================================
// COMPLEX JOIN QUERIES
// ============================================================================

const getUserWithBookingHistoryQuery = `
  SELECT
    u.id, u.name, u.email, u.phone, u.avatar_url, u.status, u.created_at,
    COUNT(b.id) as total_bookings,
    SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
    AVG(CAST(COALESCE(b.actual_amount, b.estimated_amount) AS DECIMAL)) as average_booking_value
  FROM users u
  LEFT JOIN bookings b ON u.id = b.user_id AND b.deleted_at IS NULL
  WHERE u.id = $1 AND u.deleted_at IS NULL
  GROUP BY u.id;
`;

const getUserWithPaymentSummaryQuery = `
  SELECT
    u.id, u.name, u.email, u.phone, u.status,
    COUNT(p.id) as total_payments,
    SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_spent,
    AVG(CASE WHEN p.status = 'completed' THEN p.amount ELSE NULL END) as average_payment,
    MAX(p.created_at) as last_payment_date
  FROM users u
  LEFT JOIN payments p ON u.id = p.user_id AND p.deleted_at IS NULL
  WHERE u.id = $1 AND u.deleted_at IS NULL
  GROUP BY u.id;
`;

const getUserActiveBookingsWithWorkerQuery = `
  SELECT
    b.id, b.user_id, b.worker_id, b.service_type, b.status,
    b.scheduled_date, b.scheduled_time, b.estimated_amount,
    w.id as worker_id_detail, w.specialization, w.rating,
    wu.name as worker_name, wu.phone as worker_phone
  FROM bookings b
  JOIN workers w ON b.worker_id = w.id
  JOIN users wu ON w.user_id = wu.id
  WHERE b.user_id = $1 AND b.status IN ('pending', 'confirmed', 'in_progress')
  AND b.deleted_at IS NULL
  ORDER BY b.scheduled_date ASC;
`;

// ============================================================================
// USER PROFILE QUERIES
// ============================================================================

const completeUserSignUpQuery = `
  WITH referrer AS (
    SELECT user_id FROM "user" WHERE referral_code = $1
  ), new_user AS (
    INSERT INTO "user" (name, email, phone_number, referred_by)
    VALUES ($2, $3, $4, (SELECT user_id FROM referrer))
    RETURNING user_id
  ), referral_insert AS (
    INSERT INTO referrals (referrer_user_id, referred_user_id)
    SELECT referrer.user_id, new_user.user_id
    FROM referrer, new_user
    WHERE referrer.user_id IS NOT NULL
    RETURNING referrer_user_id
  )
  SELECT new_user.user_id AS user_id FROM new_user;
`;

const updateUserReferralCodeQuery = `
  UPDATE "user" SET referral_code = $1 WHERE user_id = $2
`;

const registerUserWithReferralQuery = `
  WITH referrer AS (
    SELECT id FROM users WHERE referral_code = $1
  ), new_user AS (
    INSERT INTO users (name, email, phone_number)
    VALUES ($2, $3, $4)
    RETURNING id
  ), insert_referral AS (
    INSERT INTO referrals (referrer_user_id, referred_user_id)
    SELECT referrer.id, new_user.id
    FROM referrer, new_user
    WHERE referrer.id IS NOT NULL
    RETURNING referrer_user_id
  )
  INSERT INTO referral_rewards (user_id, reward_amount, reward_type, status)
  SELECT referrer_user_id, 100, 'cashback', 'earned'
  FROM insert_referral
  RETURNING (SELECT new_user.id FROM new_user) AS user_id;
`;

const updateUserReferralCodeForNewUserQuery = `
  UPDATE users SET referral_code = $1 WHERE id = $2
`;

// ============================================================================
// USER BOOKING QUERIES
// ============================================================================

const getUserBookingsQuery = `
  SELECT
    u.user_notification_id,
    u.created_at,
    u.service,
    n.notification_id,
    s.payment,
    w.name AS provider,
    ws.profile AS worker_profile
  FROM usernotifications u
  JOIN notifications n ON u.user_notification_id = n.user_notification_id
  JOIN servicecall s ON n.notification_id = s.notification_id
  JOIN workersverified w ON s.worker_id = w.worker_id
  JOIN workerskills ws ON w.worker_id = ws.worker_id
  WHERE u.user_id = $1
  ORDER BY u.created_at DESC
`;

const getUserAllBookingsQuery = `
  SELECT
    n.notification_id,
    n.service_booked,
    n.created_at,
    n.complete_status,
    n.total_cost,
    w.name AS provider
  FROM completenotifications n
  JOIN "user" w ON n.user_id = w.user_id
  WHERE n.user_id = $1
  ORDER BY n.created_at DESC
`;

const getUserOngoingBookingsQuery = `
  SELECT
    n.notification_id,
    n.service_booked,
    n.created_at,
    n.total_cost,
    w.name AS provider
  FROM accepted n
  JOIN "user" w ON n.user_id = w.user_id
  WHERE n.user_id = $1
  ORDER BY n.created_at DESC
`;

// ============================================================================
// USER ACTION QUERIES
// ============================================================================

const getUserActionQuery = `
  SELECT * FROM useraction
  WHERE user_id = $1;
`;

const updateUserActionTrackQuery = `
  UPDATE useraction
  SET track = $1
  WHERE user_id = $2
  RETURNING *;
`;

const insertUserActionQuery = `
  INSERT INTO useraction (user_id, track)
  VALUES ($1, $2)
  RETURNING *;
`;

const getUserActionTrackQuery = `
  SELECT track FROM useraction
  WHERE user_id = $1;
`;

const updateUserOffersUsedStatusQuery = `
  UPDATE "user" AS u
  SET offers_used = (
    SELECT jsonb_agg(
      CASE
        WHEN elem->>'offer_code' = $1
          THEN elem || '{"status":"pending"}'
        ELSE elem
      END
    )
    FROM jsonb_array_elements(u.offers_used) elem
  )
  WHERE u.user_id = $2
`;

// ============================================================================
// USER TRACKING QUERIES
// ============================================================================

const getUserTrackRouteQuery = `
  SELECT u.name, u.profile, ua.track
  FROM "user" u
  LEFT JOIN useraction ua ON u.user_id = ua.user_id
  WHERE u.user_id = $1;
`;

// ============================================================================
// USER NAVIGATION & CANCEL QUERIES
// ============================================================================

const updateUserNavigationCancelStatusQuery = `
  UPDATE accepted
  SET user_navigation_cancel_status = 'usercanceled'
  WHERE notification_id = $1
  AND (user_navigation_cancel_status IS NULL OR user_navigation_cancel_status != 'timeup')
  RETURNING user_navigation_cancel_status;
`;

const userNavigationCancelCombinedQuery = `
  WITH verification AS (
    SELECT
      verification_status,
      user_id,
      worker_id,
      service_booked
    FROM accepted
    WHERE notification_id = $1
  ),
  updated AS (
    UPDATE accepted
    SET user_navigation_cancel_status = 'usercanceled'
    WHERE notification_id = $1
      AND verification_status = FALSE
    RETURNING *
  ),
  inserted AS (
    INSERT INTO completenotifications (
      accepted_id, notification_id, user_id, user_notification_id,
      longitude, latitude, created_at, worker_id, complete_status,
      service_booked, time, discount, total_cost, tip_amount
    )
    SELECT
      accepted_id, notification_id, user_id, user_notification_id,
      longitude, latitude, created_at, worker_id, 'usercanceled',
      service_booked, time, discount, total_cost, tip_amount
    FROM updated
    RETURNING user_id, service_booked, worker_id
  ),
  user_updated AS (
    UPDATE "user" u
    SET offers_used = (
      SELECT jsonb_agg(
        CASE
          WHEN elem->>'offer_code' = $2
          THEN elem || '{"status":"pending"}'
          ELSE elem
        END
      )
      FROM jsonb_array_elements(u.offers_used) AS elem
    )
    WHERE u.user_id = (SELECT user_id FROM verification)
      AND EXISTS (
        SELECT 1 FROM updated a
        WHERE a.user_id = u.user_id
          AND a.coupons_applied IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM jsonb_array_elements(a.coupons_applied) ac
            WHERE ac->>'offer_code' = $2
          )
      )
    RETURNING u.user_id
  )
  SELECT
    v.verification_status AS verified,
    COALESCE(i.worker_id, v.worker_id) AS worker_id,
    v.user_id,
    v.service_booked,
    f.fcm_token
  FROM verification v
  LEFT JOIN inserted i      ON TRUE
  LEFT JOIN workersverified w ON w.worker_id = COALESCE(i.worker_id, v.worker_id)
  LEFT JOIN userfcm f       ON f.user_id   = v.user_id;
`;

const deleteAcceptedAfterCancelQuery = `
  DELETE FROM accepted
  WHERE notification_id = $1
    AND verification_status = FALSE
`;

const checkUserCancellationStatusQuery = `
  SELECT 1 FROM accepted WHERE notification_id = $1
`;

// ============================================================================
// USER COUPON QUERIES
// ============================================================================

const getUserCouponsQuery = `
  SELECT
    u.service_completed,
    COALESCE(rr.coupons, NULL) AS coupons
  FROM
    public."user" u
  LEFT JOIN
    referral_rewards rr
  ON
    u."referral_Code" = rr.referral_code
  WHERE
    u.user_id = $1
`;

// ============================================================================
// USER REFERRAL QUERIES
// ============================================================================

const getUserReferralsQuery = `
  SELECT
    u1.referral_code AS referralCode,
    u2.name,
    u2.service_completed
  FROM "user" u1
  LEFT JOIN "user" u2 ON u2.referred_by = u1.referral_code
  WHERE u1.user_id = $1
`;

// ============================================================================
// USER OFFER QUERIES
// ============================================================================

const fetchOffersQuery = `
  SELECT
    o.offer_code,
    o.title,
    o.description,
    o.discount_percentage,
    o.min_booking_amount,
    o.max_discount_amount,
    o.start_date,
    o.end_date,
    o.applicable_for
  FROM offers o
  LEFT JOIN (
    SELECT offers_used
    FROM "user"
    WHERE user_id = $1
  ) u ON true
  WHERE o.is_active = TRUE
    AND o.start_date <= NOW()
    AND o.end_date >= NOW()
    AND (o.applicable_for = 'both' OR o.applicable_for = $2)
    AND (
      o.offer_code NOT ILIKE '%WELCOME%' OR
      (
        NOT EXISTS (
          SELECT 1
          FROM jsonb_array_elements(u.offers_used) AS used_offer
          WHERE used_offer->>'offer_code' = o.offer_code
            AND (used_offer->>'status' = 'applied' OR used_offer->>'status' = 'used')
        )
      )
    );
`;

const getSpecialOffersQuery = `
  SELECT
    discount_percentage::INT   AS discount_percentage,
    title,
    summary,
    image,
    backgroundColor,
    description
  FROM public.offers
  WHERE summary IS NOT NULL
    AND is_active = true
  ORDER BY discount_percentage DESC
`;

const getOfferDetailsQuery = `
  SELECT discount_percentage, min_booking_amount, max_discount_amount
  FROM offers
  WHERE offer_code = $1
    AND is_active = TRUE
    AND start_date <= NOW()
    AND end_date >= NOW()
  LIMIT 1
`;

const getUserOffersUsedQuery = `
  SELECT user_id, offers_used FROM "user" WHERE user_id = $1
`;

const addOfferToUserOffersUsedQuery = `
  UPDATE "user"
  SET offers_used = COALESCE(offers_used, '[]'::jsonb) || $1::jsonb
  WHERE user_id = $2
  AND NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(offers_used, '[]'::jsonb)) AS item
    WHERE item->>'offer_code' = $3
  )
`;

const updateOfferToAppliedStatusQuery = `
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

const updateOfferToUsedStatusQuery = `
  UPDATE "user"
  SET offers_used = (
    SELECT jsonb_agg(
      CASE
        WHEN elem->>'offer_code' = $1
        THEN elem || '{"status":"used"}'
        ELSE elem
      END
    )
    FROM jsonb_array_elements("user".offers_used) elem
  )
  WHERE user_id = $2
`;

const getAllActiveOffersQuery = `
  SELECT
    offer_code,
    title,
    description,
    discount_percentage,
    min_booking_amount,
    max_discount_amount,
    start_date,
    end_date,
    applicable_for,
    is_active
  FROM offers
  WHERE is_active = TRUE
    AND start_date <= NOW()
    AND end_date >= NOW()
  ORDER BY discount_percentage DESC
`;

const getOfferByCodeQuery = `
  SELECT
    offer_code,
    title,
    description,
    discount_percentage,
    min_booking_amount,
    max_discount_amount,
    start_date,
    end_date,
    applicable_for,
    is_active
  FROM offers
  WHERE offer_code = $1
`;

// ============================================================================
// COUPON VALIDATION AND APPLICATION QUERIES
// ============================================================================

const validateCouponQuery = `
  SELECT
    o.offer_code,
    o.discount_percentage,
    o.min_booking_amount,
    o.max_discount_amount,
    o.is_active,
    o.start_date,
    o.end_date,
    u.offers_used
  FROM offers o
  CROSS JOIN (
    SELECT offers_used FROM "user" WHERE user_id = $2
  ) u
  WHERE o.offer_code = $1
    AND o.is_active = TRUE
    AND o.start_date <= NOW()
    AND o.end_date >= NOW()
`;

const applyCouponToBookingQuery = `
  UPDATE accepted
  SET coupons_applied = $1::jsonb,
      discount = $2,
      total_cost = $3
  WHERE notification_id = $4
  RETURNING notification_id, coupons_applied, discount, total_cost
`;

const getCouponUsageByUserQuery = `
  SELECT
    offer_code,
    COUNT(*) as usage_count,
    SUM(discount) as total_discount_used
  FROM (
    SELECT
      jsonb_array_elements(coupons_applied)->>'offer_code' as offer_code,
      discount
    FROM accepted
    WHERE user_id = $1
    UNION ALL
    SELECT
      jsonb_array_elements(coupons_applied)->>'offer_code' as offer_code,
      discount
    FROM completenotifications
    WHERE user_id = $1
  ) coupon_usage
  WHERE offer_code IS NOT NULL
  GROUP BY offer_code
  ORDER BY usage_count DESC
`;

const getUserAvailableCouponsQuery = `
  SELECT
    o.offer_code,
    o.title,
    o.description,
    o.discount_percentage,
    o.min_booking_amount,
    o.max_discount_amount,
    CASE
      WHEN u.offers_used IS NULL THEN TRUE
      WHEN NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(u.offers_used) AS used_offer
        WHERE used_offer->>'offer_code' = o.offer_code
          AND used_offer->>'status' IN ('applied', 'used')
      ) THEN TRUE
      ELSE FALSE
    END as is_available
  FROM offers o
  CROSS JOIN (
    SELECT offers_used FROM "user" WHERE user_id = $1
  ) u
  WHERE o.is_active = TRUE
    AND o.start_date <= NOW()
    AND o.end_date >= NOW()
  ORDER BY o.discount_percentage DESC
`;

// ============================================================================
// DISCOUNT CALCULATION AND TRACKING QUERIES
// ============================================================================

const calculateDiscountForBookingQuery = `
  SELECT
    o.discount_percentage,
    o.min_booking_amount,
    o.max_discount_amount,
    LEAST(
      ($2 * o.discount_percentage / 100),
      o.max_discount_amount
    ) as calculated_discount,
    ($2 - LEAST(
      ($2 * o.discount_percentage / 100),
      o.max_discount_amount
    )) as final_amount
  FROM offers o
  WHERE o.offer_code = $1
    AND o.is_active = TRUE
    AND o.start_date <= NOW()
    AND o.end_date >= NOW()
    AND $2 >= o.min_booking_amount
`;

const getDiscountHistoryByUserQuery = `
  SELECT
    notification_id,
    service_booked,
    discount,
    total_cost,
    coupons_applied,
    created_at
  FROM (
    SELECT
      notification_id,
      service_booked,
      discount,
      total_cost,
      coupons_applied,
      created_at
    FROM accepted
    WHERE user_id = $1 AND discount > 0
    UNION ALL
    SELECT
      notification_id,
      service_booked,
      discount,
      total_cost,
      coupons_applied,
      created_at
    FROM completenotifications
    WHERE user_id = $1 AND discount > 0
  ) discount_history
  ORDER BY created_at DESC
  LIMIT $2 OFFSET $3
`;

const getTotalDiscountsByUserQuery = `
  SELECT
    user_id,
    COUNT(*) as bookings_with_discount,
    SUM(discount) as total_discount_received,
    AVG(discount) as average_discount
  FROM (
    SELECT user_id, discount, created_at
    FROM accepted
    WHERE user_id = $1 AND discount > 0
    UNION ALL
    SELECT user_id, discount, created_at
    FROM completenotifications
    WHERE user_id = $1 AND discount > 0
  ) all_discounts
  GROUP BY user_id
`;

// ============================================================================
// REFERRAL TRACKING AND REWARDS QUERIES
// ============================================================================

const getReferralByCodeQuery = `
  SELECT
    user_id,
    name,
    email,
    phone_number,
    referral_code,
    created_at
  FROM "user"
  WHERE referral_code = $1
`;

const getUserReferralStatsQuery = `
  SELECT
    u1.user_id,
    u1.referral_code,
    COUNT(u2.user_id) as total_referrals,
    COUNT(CASE WHEN u2.service_completed > 0 THEN 1 END) as active_referrals,
    SUM(u2.service_completed) as total_services_by_referrals
  FROM "user" u1
  LEFT JOIN "user" u2 ON u2.referred_by = u1.referral_code
  WHERE u1.user_id = $1
  GROUP BY u1.user_id, u1.referral_code
`;

const getReferredUsersQuery = `
  SELECT
    u2.user_id,
    u2.name,
    u2.email,
    u2.phone_number,
    u2.service_completed,
    u2.created_at
  FROM "user" u1
  JOIN "user" u2 ON u2.referred_by = u1.referral_code
  WHERE u1.user_id = $1
  ORDER BY u2.created_at DESC
  LIMIT $2 OFFSET $3
`;

const createReferralRecordQuery = `
  INSERT INTO referrals (referrer_user_id, referred_user_id, created_at)
  VALUES ($1, $2, CURRENT_TIMESTAMP)
  RETURNING referrer_user_id, referred_user_id, created_at
`;

const getReferralRewardsQuery = `
  SELECT
    referral_code,
    coupons,
    reward_amount,
    created_at
  FROM referral_rewards
  WHERE referral_code = (
    SELECT referral_code FROM "user" WHERE user_id = $1
  )
`;

const addReferralRewardQuery = `
  INSERT INTO referral_rewards (user_id, referral_code, reward_amount, reward_type, status, created_at)
  VALUES ($1, $2, $3, $4, 'earned', CURRENT_TIMESTAMP)
  RETURNING user_id, referral_code, reward_amount, reward_type, status
`;

const updateReferralRewardStatusQuery = `
  UPDATE referral_rewards
  SET status = $2, updated_at = CURRENT_TIMESTAMP
  WHERE user_id = $1 AND referral_code = $3
  RETURNING user_id, referral_code, reward_amount, status, updated_at
`;

// ============================================================================
// OFFER REDEMPTION AND USAGE TRACKING QUERIES
// ============================================================================

const redeemOfferQuery = `
  UPDATE "user"
  SET offers_used = (
    SELECT jsonb_agg(
      CASE
        WHEN elem->>'offer_code' = $1
        THEN jsonb_set(
          elem,
          '{status}',
          '"used"'::jsonb
        ) || jsonb_build_object(
          'redeemed_at', to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS'),
          'quantity', COALESCE((elem->>'quantity')::int, 0) + 1
        )
        ELSE elem
      END
    )
    FROM jsonb_array_elements(offers_used) elem
  )
  WHERE user_id = $2
  RETURNING user_id, offers_used
`;

const getOfferRedemptionHistoryQuery = `
  SELECT
    user_id,
    jsonb_array_elements(offers_used) as offer_details
  FROM "user"
  WHERE user_id = $1
    AND offers_used IS NOT NULL
`;

const trackOfferUsageQuery = `
  INSERT INTO offer_usage_tracking (
    user_id,
    offer_code,
    booking_id,
    discount_applied,
    original_amount,
    final_amount,
    used_at
  ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
  RETURNING user_id, offer_code, booking_id, discount_applied, used_at
`;

const getOfferUsageStatsQuery = `
  SELECT
    offer_code,
    COUNT(*) as total_usage,
    SUM(discount_applied) as total_discount_given,
    AVG(discount_applied) as avg_discount_per_use,
    COUNT(DISTINCT user_id) as unique_users
  FROM offer_usage_tracking
  WHERE offer_code = $1
  GROUP BY offer_code
`;

const getMostUsedOffersQuery = `
  SELECT
    o.offer_code,
    o.title,
    o.discount_percentage,
    COUNT(*) as usage_count,
    SUM(discount) as total_discount_amount
  FROM (
    SELECT
      jsonb_array_elements(coupons_applied)->>'offer_code' as offer_code,
      discount
    FROM accepted
    WHERE coupons_applied IS NOT NULL
    UNION ALL
    SELECT
      jsonb_array_elements(coupons_applied)->>'offer_code' as offer_code,
      discount
    FROM completenotifications
    WHERE coupons_applied IS NOT NULL
  ) usage
  JOIN offers o ON usage.offer_code = o.offer_code
  WHERE usage.offer_code IS NOT NULL
  GROUP BY o.offer_code, o.title, o.discount_percentage
  ORDER BY usage_count DESC
  LIMIT $1
`;

// ============================================================================
// USER LOCATION QUERIES
// ============================================================================

const storeUserLocationQuery = `
  INSERT INTO userLocation (longitude, latitude, user_id)
  VALUES ($1, $2, $3)
  ON CONFLICT (user_id)
  DO UPDATE SET longitude = EXCLUDED.longitude, latitude = EXCLUDED.latitude
`;

const getUserLocationQuery = `
  SELECT user_id, longitude, latitude, updated_at
  FROM userLocation
  WHERE user_id = $1
`;

const getAllUserLocationsQuery = `
  SELECT ul.user_id, ul.longitude, ul.latitude, ul.updated_at,
         u.name, u.phone, u.avatar_url
  FROM userLocation ul
  JOIN users u ON ul.user_id = u.id
  WHERE u.deleted_at IS NULL
  ORDER BY ul.updated_at DESC
`;

// ============================================================================
// USER ADDRESS QUERIES
// ============================================================================

const getUserAddressDetailsQuery = `
  SELECT
    N.messages,
    UN.city,
    UN.area,
    UN.pincode,
    UN.alternate_phone_number,
    UN.alternate_name,
    UN.service_booked,
    U.name,
    U.profile
  FROM accepted N
  JOIN UserNotifications UN ON N.user_notification_id = UN.user_notification_id
  JOIN "user" U ON UN.user_id = U.user_id
  WHERE N.notification_id = $1
`;

// ============================================================================
// USER CALL QUERIES
// ============================================================================

const getUserPhoneCallDetailsQuery = `
  SELECT
    u.phone_number AS mobile_number,
    w.phone_number AS from_number
  FROM accepted a
  JOIN "user" u ON a.user_id = u.user_id
  JOIN workersverified w ON a.worker_id = w.worker_id
  WHERE a.notification_id = $1
`;

const getUserTrackingCallDetailsQuery = `
  SELECT
    u.phone_number AS mobile_number,
    w.phone_number AS from_number
  FROM servicetracking s
  JOIN "user" u ON s.user_id = u.user_id
  JOIN workersverified w ON s.worker_id = w.worker_id
  WHERE s.tracking_id = $1
`;

// ============================================================================
// USER SESSION QUERIES
// ============================================================================

const updateUserLastActiveQuery = `
  UPDATE "user" SET last_active = $1 WHERE user_id = $2 RETURNING *
`;

// ============================================================================
// USER ACTION & TRACKING QUERIES
// ============================================================================

const createUserActionWithTrackQuery = `
  INSERT INTO useraction (user_id, screen_name, params, track)
  VALUES ($1, $2, $3, $4)
  ON CONFLICT (user_id)
  DO UPDATE SET
    screen_name = EXCLUDED.screen_name,
    params = EXCLUDED.params,
    track = EXCLUDED.track
  RETURNING *;
`;

const updateUserActionScreenQuery = `
  UPDATE useraction
  SET screen_name = $2, params = $3
  WHERE user_id = $1
  RETURNING *;
`;

const deleteUserActionByEncodedIdQuery = `
  UPDATE useraction
  SET track = (
    SELECT jsonb_agg(elem)
    FROM jsonb_array_elements(track) AS elem
    WHERE elem->>'encodedId' != $2
  )
  WHERE user_id = $1
  RETURNING *;
`;

const getUserActionByScreenQuery = `
  SELECT user_action_id, user_id, screen_name, params, track
  FROM useraction
  WHERE user_id = $1 AND screen_name = $2;
`;

const getAllUserActionsQuery = `
  SELECT
    ua.user_action_id,
    ua.user_id,
    ua.screen_name,
    ua.params,
    ua.track,
    u.name,
    u.email,
    u.phone_number,
    u.last_active
  FROM useraction ua
  JOIN "user" u ON ua.user_id = u.user_id
  ORDER BY u.last_active DESC
  LIMIT $1 OFFSET $2;
`;

const getUserActionCountQuery = `
  SELECT COUNT(*) as total
  FROM useraction;
`;

// ============================================================================
// USER ROUTE TRACKING QUERIES
// ============================================================================

const trackUserRouteQuery = `
  INSERT INTO useraction (user_id, track)
  VALUES ($1, $2)
  ON CONFLICT (user_id)
  DO UPDATE SET track = EXCLUDED.track
  RETURNING *;
`;

const getUserRouteHistoryQuery = `
  SELECT
    u.user_id,
    u.name,
    u.profile,
    u.phone_number,
    ua.track,
    ua.screen_name,
    u.last_active
  FROM "user" u
  LEFT JOIN useraction ua ON u.user_id = ua.user_id
  WHERE u.user_id = $1;
`;

const updateUserTrackByEncodedIdQuery = `
  UPDATE useraction
  SET track = (
    SELECT jsonb_agg(
      CASE
        WHEN elem->>'encodedId' = $2
          THEN elem || $3::jsonb
        ELSE elem
      END
    )
    FROM jsonb_array_elements(track) AS elem
  )
  WHERE user_id = $1
  RETURNING *;
`;

const addUserTrackItemQuery = `
  UPDATE useraction
  SET track = COALESCE(track, '[]'::jsonb) || $2::jsonb
  WHERE user_id = $1
  RETURNING *;
`;

const clearUserTrackQuery = `
  UPDATE useraction
  SET track = '[]'::jsonb
  WHERE user_id = $1
  RETURNING *;
`;

// ============================================================================
// USER NAVIGATION CANCELLATION TRACKING QUERIES
// ============================================================================

const updateNavigationCancelStatusQuery = `
  UPDATE accepted
  SET user_navigation_cancel_status = $2
  WHERE notification_id = $1
  AND (user_navigation_cancel_status IS NULL OR user_navigation_cancel_status != 'timeup')
  RETURNING user_navigation_cancel_status, notification_id, user_id, worker_id;
`;

const getNavigationCancelStatusQuery = `
  SELECT
    notification_id,
    user_id,
    worker_id,
    user_navigation_cancel_status,
    navigation_status,
    verification_status,
    created_at
  FROM accepted
  WHERE notification_id = $1;
`;

const bulkUpdateNavigationTimeoutQuery = `
  UPDATE accepted
  SET user_navigation_cancel_status = 'timeup'
  WHERE created_at < (NOW() - INTERVAL '2 minutes')
  AND user_navigation_cancel_status IS NULL
  AND verification_status = FALSE
  RETURNING notification_id, user_id;
`;

const getUserCancelledNavigationsQuery = `
  SELECT
    a.notification_id,
    a.user_navigation_cancel_status,
    a.service_booked,
    a.created_at,
    a.total_cost,
    w.name AS worker_name
  FROM accepted a
  LEFT JOIN workersverified w ON a.worker_id = w.worker_id
  WHERE a.user_id = $1
  AND a.user_navigation_cancel_status IN ('usercanceled', 'workercanceled', 'timeup')
  ORDER BY a.created_at DESC
  LIMIT $2 OFFSET $3;
`;

// ============================================================================
// USER ANALYTICS QUERIES
// ============================================================================

const getUserActivitySummaryQuery = `
  SELECT
    u.user_id,
    u.name,
    u.email,
    u.phone_number,
    u.created_at,
    u.last_active,
    COUNT(DISTINCT cn.notification_id) as total_bookings,
    COUNT(DISTINCT CASE WHEN cn.complete_status = 'completed' THEN cn.notification_id END) as completed_bookings,
    COUNT(DISTINCT CASE WHEN cn.complete_status = 'usercanceled' THEN cn.notification_id END) as cancelled_bookings,
    COALESCE(SUM(CASE WHEN cn.complete_status = 'completed' THEN cn.total_cost ELSE 0 END), 0) as total_spent,
    COALESCE(AVG(CASE WHEN cn.complete_status = 'completed' THEN cn.total_cost END), 0) as avg_booking_value,
    jsonb_array_length(COALESCE(ua.track, '[]'::jsonb)) as active_tracking_items,
    ua.screen_name as current_screen
  FROM "user" u
  LEFT JOIN completenotifications cn ON u.user_id = cn.user_id
  LEFT JOIN useraction ua ON u.user_id = ua.user_id
  WHERE u.user_id = $1
  GROUP BY u.user_id, ua.track, ua.screen_name;
`;

const getUserEngagementMetricsQuery = `
  SELECT
    u.user_id,
    u.name,
    u.last_active,
    u.created_at,
    EXTRACT(EPOCH FROM (u.last_active - u.created_at)) / 86400 as days_active,
    COUNT(DISTINCT DATE(cn.created_at)) as days_with_activity,
    COUNT(cn.notification_id) as total_interactions,
    COUNT(CASE WHEN cn.created_at > (NOW() - INTERVAL '7 days') THEN 1 END) as recent_interactions_7d,
    COUNT(CASE WHEN cn.created_at > (NOW() - INTERVAL '30 days') THEN 1 END) as recent_interactions_30d,
    jsonb_array_length(COALESCE(ua.track, '[]'::jsonb)) as pending_actions
  FROM "user" u
  LEFT JOIN completenotifications cn ON u.user_id = cn.user_id
  LEFT JOIN useraction ua ON u.user_id = ua.user_id
  WHERE u.user_id = $1
  GROUP BY u.user_id, ua.track;
`;

const getActiveUsersQuery = `
  SELECT
    u.user_id,
    u.name,
    u.email,
    u.phone_number,
    u.last_active,
    u.created_at,
    jsonb_array_length(COALESCE(ua.track, '[]'::jsonb)) as active_items,
    ua.screen_name
  FROM "user" u
  LEFT JOIN useraction ua ON u.user_id = ua.user_id
  WHERE u.last_active > $1
  ORDER BY u.last_active DESC
  LIMIT $2 OFFSET $3;
`;

const getUserBookingAnalyticsQuery = `
  SELECT
    DATE_TRUNC('week', cn.created_at)::DATE as week,
    COUNT(*) as total_bookings,
    COUNT(CASE WHEN cn.complete_status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN cn.complete_status = 'usercanceled' THEN 1 END) as cancelled,
    COALESCE(SUM(CASE WHEN cn.complete_status = 'completed' THEN cn.total_cost ELSE 0 END), 0) as total_revenue
  FROM completenotifications cn
  WHERE cn.user_id = $1
  GROUP BY DATE_TRUNC('week', cn.created_at)
  ORDER BY week DESC
  LIMIT $2;
`;

const getUserServicePreferencesQuery = `
  SELECT
    jsonb_array_elements_text(service_booked) as service,
    COUNT(*) as usage_count,
    COUNT(CASE WHEN complete_status = 'completed' THEN 1 END) as completed_count,
    COALESCE(AVG(CASE WHEN complete_status = 'completed' THEN total_cost END), 0) as avg_cost
  FROM completenotifications
  WHERE user_id = $1
  GROUP BY jsonb_array_elements_text(service_booked)
  ORDER BY usage_count DESC
  LIMIT $2;
`;

const getUserActivityByTimeQuery = `
  SELECT
    EXTRACT(HOUR FROM created_at) as hour_of_day,
    EXTRACT(DOW FROM created_at) as day_of_week,
    COUNT(*) as activity_count
  FROM completenotifications
  WHERE user_id = $1
  GROUP BY EXTRACT(HOUR FROM created_at), EXTRACT(DOW FROM created_at)
  ORDER BY activity_count DESC;
`;

const getUserRetentionMetricsQuery = `
  SELECT
    u.user_id,
    u.name,
    u.created_at as signup_date,
    u.last_active,
    MIN(cn.created_at) as first_booking_date,
    MAX(cn.created_at) as last_booking_date,
    COUNT(cn.notification_id) as total_bookings,
    EXTRACT(DAY FROM (MAX(cn.created_at) - MIN(cn.created_at))) as lifetime_days,
    CASE
      WHEN u.last_active > (NOW() - INTERVAL '7 days') THEN 'active'
      WHEN u.last_active > (NOW() - INTERVAL '30 days') THEN 'at_risk'
      ELSE 'churned'
    END as retention_status
  FROM "user" u
  LEFT JOIN completenotifications cn ON u.user_id = cn.user_id
  WHERE u.user_id = $1
  GROUP BY u.user_id;
`;

// ============================================================================
// USER ACTIVITY TRACKING QUERIES
// ============================================================================

const logUserScreenViewQuery = `
  INSERT INTO useraction (user_id, screen_name, track)
  VALUES ($1, $2, jsonb_build_array(jsonb_build_object(
    'screen', $2,
    'timestamp', NOW(),
    'duration', 0
  )))
  ON CONFLICT (user_id)
  DO UPDATE SET
    screen_name = EXCLUDED.screen_name,
    track = useraction.track || jsonb_build_array(jsonb_build_object(
      'screen', EXCLUDED.screen_name,
      'timestamp', NOW(),
      'duration', 0
    ))
  RETURNING *;
`;

const updateUserScreenDurationQuery = `
  UPDATE useraction
  SET track = (
    SELECT jsonb_agg(
      CASE
        WHEN elem->>'screen' = $2 AND elem->>'timestamp' = (
          SELECT MAX((t->>'timestamp')::timestamp)
          FROM jsonb_array_elements(track) AS t
          WHERE t->>'screen' = $2
        )::text
        THEN elem || jsonb_build_object('duration', $3)
        ELSE elem
      END
    )
    FROM jsonb_array_elements(track) AS elem
  )
  WHERE user_id = $1
  RETURNING *;
`;

const getUserScreenTimeAnalyticsQuery = `
  SELECT
    elem->>'screen' as screen_name,
    COUNT(*) as view_count,
    AVG((elem->>'duration')::numeric) as avg_duration,
    SUM((elem->>'duration')::numeric) as total_duration
  FROM useraction,
       jsonb_array_elements(track) AS elem
  WHERE user_id = $1
  AND elem->>'screen' IS NOT NULL
  GROUP BY elem->>'screen'
  ORDER BY total_duration DESC;
`;

const getMostActiveUsersQuery = `
  SELECT
    u.user_id,
    u.name,
    u.email,
    u.last_active,
    COUNT(cn.notification_id) as total_bookings,
    jsonb_array_length(COALESCE(ua.track, '[]'::jsonb)) as tracking_items,
    EXTRACT(EPOCH FROM (NOW() - u.last_active)) / 3600 as hours_since_active
  FROM "user" u
  LEFT JOIN completenotifications cn ON u.user_id = cn.user_id
  LEFT JOIN useraction ua ON u.user_id = ua.user_id
  GROUP BY u.user_id, ua.track
  ORDER BY total_bookings DESC, u.last_active DESC
  LIMIT $1 OFFSET $2;
`;

const getUserSessionsQuery = `
  SELECT
    user_id,
    last_active,
    created_at,
    EXTRACT(EPOCH FROM (last_active - created_at)) / 3600 as total_hours_active,
    CASE
      WHEN last_active > (NOW() - INTERVAL '5 minutes') THEN 'online'
      WHEN last_active > (NOW() - INTERVAL '1 hour') THEN 'recently_active'
      WHEN last_active > (NOW() - INTERVAL '24 hours') THEN 'today'
      WHEN last_active > (NOW() - INTERVAL '7 days') THEN 'this_week'
      ELSE 'inactive'
    END as session_status
  FROM "user"
  WHERE user_id = $1;
`;

module.exports = {
  getUserByIdQuery,
  createUserQuery,
  updateUserQuery,
  getUserByPhoneQuery,
  getAllUsersQuery,
  getUserCountQuery,
  deleteUserQuery,

  // FCM Token Queries
  storeFcmTokenForUserQuery,
  updateUserFcmTokenQuery,
  getUserFcmTokensQuery,
  deleteUserFcmTokenQuery,
  storeUserFcmTokenWithDeleteQuery,
  deleteUserFcmTokenByTokenQuery,
  getActiveUserFcmTokensQuery,
  getAllActiveUserFcmTokensQuery,
  storeUserReceivedNotificationQuery,
  getUserReceivedNotificationsQuery,
  insertUserNotificationRequestQuery,
  getUserNotificationByIdQuery,
  insertWorkerNotificationsForRequestQuery,
  getWorkerFcmTokensForNotificationQuery,

  // Notification Queries
  storeUserNotificationQuery,
  getUserNotificationsQuery,
  getUserUnreadNotificationCountQuery,
  markUserNotificationAsReadQuery,
  deleteUserNotificationQuery,
  markAllUserNotificationsAsReadQuery,

  // Status Update Queries
  updateUserStatusQuery,
  getUsersByStatusQuery,

  // Search and Filter Queries
  searchUsersByNameQuery,
  searchUsersByEmailQuery,
  getUsersByCreatedDateRangeQuery,

  // Complex Join Queries
  getUserWithBookingHistoryQuery,
  getUserWithPaymentSummaryQuery,
  getUserActiveBookingsWithWorkerQuery,

  // User Profile Queries
  completeUserSignUpQuery,
  updateUserReferralCodeQuery,
  registerUserWithReferralQuery,
  updateUserReferralCodeForNewUserQuery,

  // User Booking Queries
  getUserBookingsQuery,
  getUserAllBookingsQuery,
  getUserOngoingBookingsQuery,

  // User Action Queries
  getUserActionQuery,
  updateUserActionTrackQuery,
  insertUserActionQuery,
  getUserActionTrackQuery,
  updateUserOffersUsedStatusQuery,

  // User Tracking Queries
  getUserTrackRouteQuery,

  // User Navigation & Cancel Queries
  updateUserNavigationCancelStatusQuery,
  userNavigationCancelCombinedQuery,
  deleteAcceptedAfterCancelQuery,
  checkUserCancellationStatusQuery,

  // User Coupon Queries
  getUserCouponsQuery,

  // User Referral Queries
  getUserReferralsQuery,

  // User Offer Queries
  fetchOffersQuery,
  getSpecialOffersQuery,
  getOfferDetailsQuery,
  getUserOffersUsedQuery,
  addOfferToUserOffersUsedQuery,
  updateOfferToAppliedStatusQuery,
  updateOfferToUsedStatusQuery,
  getAllActiveOffersQuery,
  getOfferByCodeQuery,

  // Coupon Validation and Application Queries
  validateCouponQuery,
  applyCouponToBookingQuery,
  getCouponUsageByUserQuery,
  getUserAvailableCouponsQuery,

  // Discount Calculation and Tracking Queries
  calculateDiscountForBookingQuery,
  getDiscountHistoryByUserQuery,
  getTotalDiscountsByUserQuery,

  // Referral Tracking and Rewards Queries
  getReferralByCodeQuery,
  getUserReferralStatsQuery,
  getReferredUsersQuery,
  createReferralRecordQuery,
  getReferralRewardsQuery,
  addReferralRewardQuery,
  updateReferralRewardStatusQuery,

  // Offer Redemption and Usage Tracking Queries
  redeemOfferQuery,
  getOfferRedemptionHistoryQuery,
  trackOfferUsageQuery,
  getOfferUsageStatsQuery,
  getMostUsedOffersQuery,

  // User Location Queries
  storeUserLocationQuery,
  getUserLocationQuery,
  getAllUserLocationsQuery,

  // User Address Queries
  getUserAddressDetailsQuery,

  // User Call Queries
  getUserPhoneCallDetailsQuery,
  getUserTrackingCallDetailsQuery,

  // User Session Queries
  updateUserLastActiveQuery,

  // User Action & Tracking Queries
  createUserActionWithTrackQuery,
  updateUserActionScreenQuery,
  deleteUserActionByEncodedIdQuery,
  getUserActionByScreenQuery,
  getAllUserActionsQuery,
  getUserActionCountQuery,

  // User Route Tracking Queries
  trackUserRouteQuery,
  getUserRouteHistoryQuery,
  updateUserTrackByEncodedIdQuery,
  addUserTrackItemQuery,
  clearUserTrackQuery,

  // User Navigation Cancellation Tracking Queries
  updateNavigationCancelStatusQuery,
  getNavigationCancelStatusQuery,
  bulkUpdateNavigationTimeoutQuery,
  getUserCancelledNavigationsQuery,

  // User Analytics Queries
  getUserActivitySummaryQuery,
  getUserEngagementMetricsQuery,
  getActiveUsersQuery,
  getUserBookingAnalyticsQuery,
  getUserServicePreferencesQuery,
  getUserActivityByTimeQuery,
  getUserRetentionMetricsQuery,

  // User Activity Tracking Queries
  logUserScreenViewQuery,
  updateUserScreenDurationQuery,
  getUserScreenTimeAnalyticsQuery,
  getMostActiveUsersQuery,
  getUserSessionsQuery,
};
