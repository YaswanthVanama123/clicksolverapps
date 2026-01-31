/**
 * Payment Database Queries
 * Contains common SQL queries for payment operations
 */

const getPaymentDetailsQuery = `
  SELECT id, booking_id, user_id, worker_id, amount, payment_method,
         transaction_id, status, payment_date, notes, created_at, updated_at
  FROM payments
  WHERE id = $1 AND deleted_at IS NULL;
`;

const createPaymentQuery = `
  INSERT INTO payments (booking_id, user_id, worker_id, amount, payment_method,
                        transaction_id, status, payment_date, notes, created_at, updated_at)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, booking_id, user_id, worker_id, amount, payment_method,
            transaction_id, status, payment_date, notes, created_at, updated_at;
`;

const updatePaymentStatusQuery = `
  UPDATE payments
  SET status = $2, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id, status, updated_at;
`;

const getPaymentsByBookingQuery = `
  SELECT id, booking_id, user_id, worker_id, amount, payment_method,
         transaction_id, status, payment_date, notes, created_at, updated_at
  FROM payments
  WHERE booking_id = $1 AND deleted_at IS NULL
  ORDER BY payment_date DESC;
`;

const getPaymentsByUserQuery = `
  SELECT id, booking_id, user_id, worker_id, amount, payment_method,
         transaction_id, status, payment_date, notes, created_at, updated_at
  FROM payments
  WHERE user_id = $1 AND deleted_at IS NULL
  ORDER BY payment_date DESC
  LIMIT $2 OFFSET $3;
`;

const getPaymentsByWorkerQuery = `
  SELECT id, booking_id, user_id, worker_id, amount, payment_method,
         transaction_id, status, payment_date, notes, created_at, updated_at
  FROM payments
  WHERE worker_id = $1 AND deleted_at IS NULL
  ORDER BY payment_date DESC
  LIMIT $2 OFFSET $3;
`;

const getPaymentsByStatusQuery = `
  SELECT id, booking_id, user_id, worker_id, amount, payment_method,
         transaction_id, status, payment_date, notes, created_at, updated_at
  FROM payments
  WHERE status = $1 AND deleted_at IS NULL
  ORDER BY payment_date DESC
  LIMIT $2 OFFSET $3;
`;

const getPaymentSummaryByWorkerQuery = `
  SELECT worker_id, COUNT(*) as total_payments, SUM(amount) as total_amount,
         AVG(amount) as average_amount
  FROM payments
  WHERE worker_id = $1 AND status = 'completed' AND deleted_at IS NULL
  GROUP BY worker_id;
`;

const getPaymentSummaryByUserQuery = `
  SELECT user_id, COUNT(*) as total_payments, SUM(amount) as total_amount,
         AVG(amount) as average_amount
  FROM payments
  WHERE user_id = $1 AND status = 'completed' AND deleted_at IS NULL
  GROUP BY user_id;
`;

const getRevenueByDateRangeQuery = `
  SELECT DATE(payment_date) as date, COUNT(*) as transaction_count,
         SUM(amount) as total_revenue
  FROM payments
  WHERE status = 'completed' AND payment_date BETWEEN $1 AND $2
         AND deleted_at IS NULL
  GROUP BY DATE(payment_date)
  ORDER BY date DESC;
`;

const checkPaymentByTransactionIdQuery = `
  SELECT id, booking_id, user_id, worker_id, amount, status
  FROM payments
  WHERE transaction_id = $1 AND deleted_at IS NULL;
`;

const deletePaymentQuery = `
  UPDATE payments
  SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND deleted_at IS NULL
  RETURNING id;
`;

// ============================================================================
// REFUND QUERIES
// ============================================================================

const createRefundQuery = `
  INSERT INTO refunds (payment_id, booking_id, refund_amount, refund_reason, status, processed_date, created_at, updated_at)
  VALUES ($1, $2, $3, $4, 'pending', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, payment_id, booking_id, refund_amount, refund_reason, status, created_at;
`;

const getRefundsByPaymentQuery = `
  SELECT id, payment_id, booking_id, refund_amount, refund_reason, status, processed_date, created_at
  FROM refunds
  WHERE payment_id = $1
  ORDER BY created_at DESC;
`;

const updateRefundStatusQuery = `
  UPDATE refunds
  SET status = $2, processed_date = CASE WHEN $2 = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = $1
  RETURNING id, status, refund_amount, processed_date, updated_at;
`;

const getPendingRefundsQuery = `
  SELECT r.id, r.payment_id, r.booking_id, r.refund_amount, r.refund_reason, r.created_at,
         p.transaction_id, p.amount, p.payment_method
  FROM refunds r
  JOIN payments p ON r.payment_id = p.id
  WHERE r.status = 'pending' AND p.deleted_at IS NULL
  ORDER BY r.created_at ASC
  LIMIT $1 OFFSET $2;
`;

// ============================================================================
// STATUS TRACKING QUERIES
// ============================================================================

const getPaymentStatusTimelineQuery = `
  SELECT id, payment_id, previous_status, current_status, status_changed_at, reason
  FROM payment_status_timeline
  WHERE payment_id = $1
  ORDER BY status_changed_at DESC;
`;

const createPaymentStatusTimelineQuery = `
  INSERT INTO payment_status_timeline (payment_id, previous_status, current_status, reason, status_changed_at)
  VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
  RETURNING id, payment_id, previous_status, current_status, status_changed_at;
`;

const getPaymentsByPaymentMethodQuery = `
  SELECT id, booking_id, user_id, worker_id, amount, payment_method,
         transaction_id, status, payment_date, created_at, updated_at
  FROM payments
  WHERE payment_method = $1 AND deleted_at IS NULL
  ORDER BY payment_date DESC
  LIMIT $2 OFFSET $3;
`;

const getPaymentsByTransactionStatusQuery = `
  SELECT id, booking_id, user_id, worker_id, amount, payment_method,
         transaction_id, status, payment_date, created_at, updated_at
  FROM payments
  WHERE status = $1 AND deleted_at IS NULL
  ORDER BY payment_date DESC
  LIMIT $2 OFFSET $3;
`;

// ============================================================================
// ANALYTICS AND REPORTING QUERIES
// ============================================================================

const getPaymentAnalyticsQuery = `
  SELECT
    COUNT(*) as total_payments,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_payments,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_payments,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_payments,
    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
    AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as average_payment_amount,
    MIN(payment_date) as first_payment_date,
    MAX(payment_date) as last_payment_date
  FROM payments
  WHERE deleted_at IS NULL;
`;

const getMonthlyRevenueQuery = `
  SELECT
    DATE_TRUNC('month', payment_date)::DATE as month,
    COUNT(*) as transaction_count,
    SUM(amount) as total_revenue,
    AVG(amount) as average_transaction_amount,
    MIN(amount) as min_transaction,
    MAX(amount) as max_transaction
  FROM payments
  WHERE status = 'completed' AND deleted_at IS NULL
  AND payment_date >= $1 AND payment_date <= $2
  GROUP BY DATE_TRUNC('month', payment_date)
  ORDER BY month DESC;
`;

const getDailyRevenueQuery = `
  SELECT
    DATE(payment_date) as date,
    COUNT(*) as transaction_count,
    SUM(amount) as total_revenue,
    AVG(amount) as average_transaction_amount
  FROM payments
  WHERE status = 'completed' AND deleted_at IS NULL
  AND payment_date >= $1 AND payment_date <= $2
  GROUP BY DATE(payment_date)
  ORDER BY date DESC;
`;

const getPaymentMethodAnalyticsQuery = `
  SELECT
    payment_method,
    COUNT(*) as transaction_count,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_transactions,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_transactions,
    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_amount,
    AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as average_amount
  FROM payments
  WHERE deleted_at IS NULL
  GROUP BY payment_method
  ORDER BY total_amount DESC;
`;

// ============================================================================
// COMPLEX JOIN QUERIES
// ============================================================================

const getPaymentWithBookingDetailsQuery = `
  SELECT
    p.id, p.booking_id, p.user_id, p.worker_id, p.amount, p.payment_method,
    p.transaction_id, p.status, p.payment_date, p.created_at,
    b.service_type, b.description, b.scheduled_date, b.status as booking_status,
    u.name as user_name, u.email as user_email,
    w.specialization, wu.name as worker_name
  FROM payments p
  LEFT JOIN bookings b ON p.booking_id = b.id AND b.deleted_at IS NULL
  LEFT JOIN users u ON p.user_id = u.id AND u.deleted_at IS NULL
  LEFT JOIN workers w ON p.worker_id = w.id AND w.deleted_at IS NULL
  LEFT JOIN users wu ON w.user_id = wu.id AND wu.deleted_at IS NULL
  WHERE p.id = $1 AND p.deleted_at IS NULL;
`;

const getUserPaymentHistoryQuery = `
  SELECT
    p.id, p.booking_id, p.amount, p.payment_method, p.status, p.payment_date,
    b.service_type, b.scheduled_date,
    w.specialization, wu.name as worker_name
  FROM payments p
  LEFT JOIN bookings b ON p.booking_id = b.id AND b.deleted_at IS NULL
  LEFT JOIN workers w ON p.worker_id = w.id AND w.deleted_at IS NULL
  LEFT JOIN users wu ON w.user_id = wu.id AND wu.deleted_at IS NULL
  WHERE p.user_id = $1 AND p.deleted_at IS NULL
  ORDER BY p.payment_date DESC
  LIMIT $2 OFFSET $3;
`;

const getWorkerPaymentHistoryQuery = `
  SELECT
    p.id, p.booking_id, p.amount, p.payment_method, p.status, p.payment_date,
    b.service_type, b.scheduled_date,
    u.name as customer_name, u.phone as customer_phone
  FROM payments p
  LEFT JOIN bookings b ON p.booking_id = b.id AND b.deleted_at IS NULL
  LEFT JOIN users u ON p.user_id = u.id AND u.deleted_at IS NULL
  WHERE p.worker_id = $1 AND p.status = 'completed' AND p.deleted_at IS NULL
  ORDER BY p.payment_date DESC
  LIMIT $2 OFFSET $3;
`;

const getIncompletePaymentsWithDetailsQuery = `
  SELECT
    p.id, p.booking_id, p.user_id, p.worker_id, p.amount, p.status,
    p.payment_date, p.transaction_id,
    b.scheduled_date, b.status as booking_status,
    u.name as user_name, u.email as user_email, u.phone as user_phone,
    wu.name as worker_name,
    CASE
      WHEN p.status = 'pending' THEN 'Awaiting payment'
      WHEN p.status = 'failed' THEN 'Payment failed - retry needed'
      WHEN p.status = 'cancelled' THEN 'Payment cancelled'
      ELSE 'Unknown'
    END as payment_issue_description
  FROM payments p
  LEFT JOIN bookings b ON p.booking_id = b.id
  LEFT JOIN users u ON p.user_id = u.id
  LEFT JOIN workers w ON p.worker_id = w.id
  LEFT JOIN users wu ON w.user_id = wu.id
  WHERE p.status IN ('pending', 'failed', 'cancelled') AND p.deleted_at IS NULL
  ORDER BY CASE WHEN p.status = 'failed' THEN 0 WHEN p.status = 'pending' THEN 1 ELSE 2 END,
           p.payment_date ASC
  LIMIT $1 OFFSET $2;
`;

const getWorkerEarningsWithRefundsQuery = `
  SELECT
    p.worker_id,
    COUNT(p.id) as total_payments,
    SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as gross_earnings,
    COALESCE(SUM(r.refund_amount), 0) as total_refunds,
    (SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) - COALESCE(SUM(r.refund_amount), 0)) as net_earnings
  FROM payments p
  LEFT JOIN refunds r ON p.id = r.payment_id AND r.status = 'completed'
  WHERE p.worker_id = $1 AND p.deleted_at IS NULL
  GROUP BY p.worker_id;
`;

// ============================================================================
// RAZORPAY ORDER QUERIES
// ============================================================================

const insertOrderQuery = `
  INSERT INTO orders (worker_id, order_id, amount, currency, status, created_at)
  VALUES ($1, $2, $3, $4, 'pending', NOW())
`;

const verifyPaymentCTEQuery = `
  WITH updated_order AS (
    UPDATE orders
    SET status = $3::text,
        updated_at = NOW()
    WHERE order_id = $1::text
      AND worker_id = $2::int
    RETURNING amount
  ),
  insert_payment AS (
    INSERT INTO payments (
      worker_id,
      order_id,
      payment_id,
      amount_paid,
      status,
      payment_method,
      transaction_date,
      error_message
    )
    VALUES (
      $2::int,
      $1::text,
      $4,
      (SELECT amount FROM updated_order),
      $3::text,
      $5::text,
      NOW(),
      $6::text
    )
    RETURNING order_id, payment_id, amount_paid, status
  )
  SELECT order_id, payment_id, amount_paid, status FROM insert_payment;
`;

const updateWorkerlifeCTEQuery = `
  WITH order_amt AS (
    SELECT amount::numeric AS amt
    FROM orders
    WHERE order_id = $1::text
  ),
  current_balance AS (
    SELECT COALESCE(balance_amount, 0) AS curr_balance
    FROM workerlife
    WHERE worker_id = $2::int
  ),
  new_balance AS (
    SELECT curr_balance + order_amt.amt AS computed_balance
    FROM current_balance, order_amt
  ),
  update_workerlife AS (
    UPDATE workerlife
    SET balance_amount = new_balance.computed_balance,
        balance_payment_history = COALESCE(balance_payment_history, '[]'::jsonb) ||
          jsonb_build_array(
            jsonb_build_object(
              'order_id', $1::text,
              'amount', (SELECT amt FROM order_amt),
              'time', TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'),
              'status', $3::text,
              'paid', 'Paid to Click Solver'
            )
          )
    FROM new_balance
    WHERE workerlife.worker_id = $2::int
  ),
  update_workersverified AS (
    UPDATE workersverified
    SET no_due = CASE WHEN $3::text = 'success' THEN true ELSE no_due END
    WHERE worker_id = $2::int
  )
  SELECT 1;
`;

const processPaymentCombinedQuery = `
  WITH update_servicecall AS (
    UPDATE servicecall
    SET payment = $1,
        payment_type = $2,
        end_time = NOW()
    WHERE notification_id = $3
    RETURNING notification_id
  ),
  update_accepted AS (
    UPDATE accepted a
    SET
      time = jsonb_set(
        COALESCE(a.time, '{}'::jsonb),
        '{paymentCompleted}',
        to_jsonb(to_char($4::timestamp, 'YYYY-MM-DD HH24:MI:SS'))
      )
    FROM update_servicecall us
    WHERE a.notification_id = us.notification_id
    RETURNING
      a.user_id,
      a.service_booked,
      a.worker_id,
      a.accepted_id,
      a.notification_id,
      a.user_notification_id,
      a.longitude,
      a.latitude,
      a.time,
      a.discount,
      a.total_cost,
      a.tip_amount
  ),
  upsert_workerlife AS (
    INSERT INTO workerlife (
      worker_id,
      service_counts,
      money_earned,
      balance_amount,
      cashback_approved_times
    )
    SELECT
      ua.worker_id,
      1,
      $6,
      -- For the first 15 services, start balance at 0
      0,
      0
    FROM update_accepted ua
    ON CONFLICT (worker_id) DO UPDATE
      SET
        service_counts         = workerlife.service_counts + 1,
        money_earned           = workerlife.money_earned + EXCLUDED.money_earned,
        balance_amount         = CASE
                                   -- If new total count ≤ 15, leave balance unchanged
                                   WHEN (workerlife.service_counts + 1) <= 15
                                     THEN workerlife.balance_amount
                                   -- After 15 services, apply commission/share logic
                                   WHEN $5 = 'cash'
                                     THEN workerlife.balance_amount - ($6 * 0.12)
                                   ELSE
                                     workerlife.balance_amount + ($6 * 0.88)
                                 END,
        cashback_approved_times = CASE
                                   -- Award cashback only once when crossing from 5 → 6 services
                                   WHEN workerlife.service_counts < 6
                                        AND (workerlife.service_counts + 1) = 6
                                     THEN 1
                                   ELSE workerlife.cashback_approved_times
                                 END
    RETURNING balance_amount
  ),
  insert_completenotifications AS (
    INSERT INTO completenotifications (
      accepted_id,
      notification_id,
      user_id,
      user_notification_id,
      service_booked,
      longitude,
      latitude,
      worker_id,
      time,
      discount,
      total_cost,
      tip_amount
    )
    SELECT
      ua.accepted_id,
      ua.notification_id,
      ua.user_id,
      ua.user_notification_id,
      ua.service_booked,
      ua.longitude,
      ua.latitude,
      ua.worker_id,
      ua.time,
      ua.discount,
      ua.total_cost,
      ua.tip_amount
    FROM update_accepted ua
    RETURNING notification_id
  ),
  get_user_fcms AS (
    SELECT
      ua.user_id,
      COALESCE(array_agg(uf.fcm_token), '{}') AS user_fcm_tokens
    FROM update_accepted ua
    LEFT JOIN userfcm uf ON uf.user_id = ua.user_id
    GROUP BY ua.user_id
  )
  SELECT
    ua.user_id,
    ua.service_booked,
    ua.worker_id,
    uw.balance_amount AS final_balance,
    gf.user_fcm_tokens
  FROM update_accepted ua
  JOIN upsert_workerlife uw ON TRUE
  LEFT JOIN get_user_fcms gf ON gf.user_id = ua.user_id;
`;

const deleteAcceptedByNotificationIdQuery = `
  DELETE FROM accepted WHERE notification_id = $1;
`;

// ============================================================================
// SERVICE CALL AND PAYMENT DETAILS QUERIES
// ============================================================================

const getServiceCallByNotificationIdQuery = `
  SELECT * FROM servicecall WHERE notification_id = $1
`;

const getPaymentDetailsWithUserQuery = `
  SELECT
    n.service,
    n.discount,
    n.total_cost,
    u.name
  FROM
    accepted n
  JOIN
    "user" u ON n.user_id = u.user_id
  WHERE
    n.notification_id = $1
`;

// ============================================================================
// WORKER BALANCE AND CASHBACK QUERIES
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
// PAYOUT AND WITHDRAWAL QUERIES
// ============================================================================

const createPayoutRequestQuery = `
  INSERT INTO payout_requests (worker_id, amount, status, razorpay_payout_id, created_at, updated_at)
  VALUES ($1, $2, 'pending', $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, worker_id, amount, status, razorpay_payout_id, created_at;
`;

const updatePayoutStatusQuery = `
  UPDATE payout_requests
  SET status = $2,
      processed_at = CASE WHEN $2 = 'completed' THEN CURRENT_TIMESTAMP ELSE processed_at END,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = $1
  RETURNING id, worker_id, amount, status, processed_at, updated_at;
`;

const getPayoutRequestsByWorkerQuery = `
  SELECT id, worker_id, amount, status, razorpay_payout_id,
         created_at, processed_at, updated_at
  FROM payout_requests
  WHERE worker_id = $1
  ORDER BY created_at DESC
  LIMIT $2 OFFSET $3;
`;

const getPendingPayoutsQuery = `
  SELECT pr.id, pr.worker_id, pr.amount, pr.status, pr.razorpay_payout_id,
         pr.created_at, wv.name, wv.phone_number
  FROM payout_requests pr
  JOIN workersverified wv ON pr.worker_id = wv.worker_id
  WHERE pr.status = 'pending'
  ORDER BY pr.created_at ASC
  LIMIT $1 OFFSET $2;
`;

// ============================================================================
// TRANSACTION TRACKING QUERIES
// ============================================================================

const insertTransactionLogQuery = `
  INSERT INTO transaction_logs (worker_id, transaction_type, amount, status,
                                 reference_id, metadata, created_at)
  VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
  RETURNING id, worker_id, transaction_type, amount, status, created_at;
`;

const getTransactionLogsByWorkerQuery = `
  SELECT id, worker_id, transaction_type, amount, status, reference_id,
         metadata, created_at
  FROM transaction_logs
  WHERE worker_id = $1
  ORDER BY created_at DESC
  LIMIT $2 OFFSET $3;
`;

const getTransactionLogByReferenceQuery = `
  SELECT id, worker_id, transaction_type, amount, status, reference_id,
         metadata, created_at
  FROM transaction_logs
  WHERE reference_id = $1;
`;

// ============================================================================
// COMMISSION AND FEE CALCULATION QUERIES
// ============================================================================

const calculateWorkerCommissionQuery = `
  SELECT
    worker_id,
    SUM(CASE
      WHEN payment_type = 'cash' THEN payment * 0.12
      ELSE 0
    END) as total_cash_commission,
    SUM(CASE
      WHEN payment_type != 'cash' THEN payment * 0.12
      ELSE 0
    END) as total_online_commission,
    SUM(payment * 0.12) as total_commission
  FROM servicecall
  WHERE worker_id = $1 AND payment IS NOT NULL
  GROUP BY worker_id;
`;

const getPlatformRevenueQuery = `
  SELECT
    DATE_TRUNC('month', end_time)::DATE as month,
    COUNT(*) as service_count,
    SUM(payment) as gross_revenue,
    SUM(payment * 0.12) as platform_commission,
    SUM(payment * 0.88) as worker_earnings
  FROM servicecall
  WHERE payment IS NOT NULL
    AND end_time BETWEEN $1 AND $2
  GROUP BY DATE_TRUNC('month', end_time)
  ORDER BY month DESC;
`;

// ============================================================================
// RAZORPAY SPECIFIC QUERIES
// ============================================================================

const getRazorpayOrderByIdQuery = `
  SELECT worker_id, order_id, amount, currency, status, created_at, updated_at
  FROM orders
  WHERE order_id = $1;
`;

const updateRazorpayOrderStatusQuery = `
  UPDATE orders
  SET status = $2, updated_at = NOW()
  WHERE order_id = $1
  RETURNING worker_id, order_id, amount, status, updated_at;
`;

const getFailedPaymentsQuery = `
  SELECT p.id, p.worker_id, p.order_id, p.payment_id, p.amount_paid,
         p.status, p.payment_method, p.error_message, p.transaction_date,
         o.amount as order_amount
  FROM payments p
  LEFT JOIN orders o ON p.order_id = o.order_id
  WHERE p.status = 'failed'
  ORDER BY p.transaction_date DESC
  LIMIT $1 OFFSET $2;
`;

module.exports = {
  getPaymentDetailsQuery,
  createPaymentQuery,
  updatePaymentStatusQuery,
  getPaymentsByBookingQuery,
  getPaymentsByUserQuery,
  getPaymentsByWorkerQuery,
  getPaymentsByStatusQuery,
  getPaymentSummaryByWorkerQuery,
  getPaymentSummaryByUserQuery,
  getRevenueByDateRangeQuery,
  checkPaymentByTransactionIdQuery,
  deletePaymentQuery,

  // Refund Queries
  createRefundQuery,
  getRefundsByPaymentQuery,
  updateRefundStatusQuery,
  getPendingRefundsQuery,

  // Status Tracking Queries
  getPaymentStatusTimelineQuery,
  createPaymentStatusTimelineQuery,
  getPaymentsByPaymentMethodQuery,
  getPaymentsByTransactionStatusQuery,

  // Analytics and Reporting Queries
  getPaymentAnalyticsQuery,
  getMonthlyRevenueQuery,
  getDailyRevenueQuery,
  getPaymentMethodAnalyticsQuery,

  // Complex Join Queries
  getPaymentWithBookingDetailsQuery,
  getUserPaymentHistoryQuery,
  getWorkerPaymentHistoryQuery,
  getIncompletePaymentsWithDetailsQuery,
  getWorkerEarningsWithRefundsQuery,

  // Razorpay Order Queries
  insertOrderQuery,
  verifyPaymentCTEQuery,
  updateWorkerlifeCTEQuery,
  processPaymentCombinedQuery,
  deleteAcceptedByNotificationIdQuery,

  // Service Call and Payment Details Queries
  getServiceCallByNotificationIdQuery,
  getPaymentDetailsWithUserQuery,

  // Worker Balance and Cashback Queries
  getPendingBalanceWorkersQuery,
  getWorkersPendingCashbackQuery,

  // Payout and Withdrawal Queries
  createPayoutRequestQuery,
  updatePayoutStatusQuery,
  getPayoutRequestsByWorkerQuery,
  getPendingPayoutsQuery,

  // Transaction Tracking Queries
  insertTransactionLogQuery,
  getTransactionLogsByWorkerQuery,
  getTransactionLogByReferenceQuery,

  // Commission and Fee Calculation Queries
  calculateWorkerCommissionQuery,
  getPlatformRevenueQuery,

  // Razorpay Specific Queries
  getRazorpayOrderByIdQuery,
  updateRazorpayOrderStatusQuery,
  getFailedPaymentsQuery,

  // Additional Razorpay Queries (for reference/future use)
  // Note: The following inline queries are used in controllers and can be extracted here if needed:
  // - Bank account validation queries
  // - UPI validation queries
  // - Fund account creation queries
  // - Payout initiation queries
  // - Transaction status check queries
};
