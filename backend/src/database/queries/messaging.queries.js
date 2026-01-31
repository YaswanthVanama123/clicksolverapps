/**
 * Messaging Database Queries
 * Contains SQL queries for messaging operations including chat messages,
 * FCM tokens, notifications, call tracking, and message read status
 */

// ============================================================================
// CHAT MESSAGES QUERIES
// ============================================================================

const insertChatMessageQuery = `
  INSERT INTO chat_messages (request_id, sender_id, sender_type, message, attachment_url, created_at, updated_at)
  VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, request_id, sender_id, sender_type, message, attachment_url, created_at, updated_at;
`;

const getMessagesByRequestIdQuery = `
  SELECT id, request_id, sender_id, sender_type, message, attachment_url, created_at, updated_at
  FROM chat_messages
  WHERE request_id = $1
  ORDER BY created_at ASC
  LIMIT $2 OFFSET $3;
`;

const getMessageCountByRequestQuery = `
  SELECT COUNT(*) as total
  FROM chat_messages
  WHERE request_id = $1;
`;

const getMessageByIdQuery = `
  SELECT id, request_id, sender_id, sender_type, message, attachment_url, created_at, updated_at
  FROM chat_messages
  WHERE id = $1;
`;

const updateChatMessageQuery = `
  UPDATE chat_messages
  SET message = COALESCE($2, message),
      attachment_url = COALESCE($3, attachment_url),
      updated_at = CURRENT_TIMESTAMP
  WHERE id = $1
  RETURNING id, request_id, sender_id, sender_type, message, attachment_url, updated_at;
`;

const deleteChatMessageQuery = `
  UPDATE chat_messages
  SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1
  RETURNING id;
`;

const getLatestMessageByRequestQuery = `
  SELECT id, request_id, sender_id, sender_type, message, attachment_url, created_at, updated_at
  FROM chat_messages
  WHERE request_id = $1
  ORDER BY created_at DESC
  LIMIT 1;
`;

// ============================================================================
// FCM TOKEN QUERIES
// ============================================================================

const storeFcmTokenQuery = `
  INSERT INTO fcm_tokens (user_id, user_type, token, device_id, device_type, created_at, updated_at)
  VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, user_id, user_type, token, device_id, device_type, created_at, updated_at;
`;

const updateFcmTokenQuery = `
  UPDATE fcm_tokens
  SET token = $2, updated_at = CURRENT_TIMESTAMP
  WHERE user_id = $1 AND device_id = $3 AND user_type = $4
  RETURNING id, user_id, user_type, token, device_id, device_type, updated_at;
`;

const getFcmTokensByUserIdQuery = `
  SELECT id, user_id, user_type, token, device_id, device_type, created_at, updated_at
  FROM fcm_tokens
  WHERE user_id = $1 AND user_type = $2
  ORDER BY updated_at DESC;
`;

const getFcmTokenByUserAndDeviceQuery = `
  SELECT id, user_id, user_type, token, device_id, device_type, created_at, updated_at
  FROM fcm_tokens
  WHERE user_id = $1 AND device_id = $2 AND user_type = $3;
`;

const deleteFcmTokenQuery = `
  DELETE FROM fcm_tokens
  WHERE id = $1
  RETURNING id;
`;

const deleteFcmTokenByUserAndDeviceQuery = `
  DELETE FROM fcm_tokens
  WHERE user_id = $1 AND device_id = $2 AND user_type = $3
  RETURNING id;
`;

const getAllActiveFcmTokensQuery = `
  SELECT id, user_id, user_type, token, device_id, device_type, created_at, updated_at
  FROM fcm_tokens
  WHERE updated_at > (CURRENT_TIMESTAMP - INTERVAL '90 days')
  ORDER BY updated_at DESC;
`;

const getActiveFcmTokensByUserTypeQuery = `
  SELECT id, user_id, user_type, token, device_id, device_type, created_at, updated_at
  FROM fcm_tokens
  WHERE user_type = $1 AND updated_at > (CURRENT_TIMESTAMP - INTERVAL '90 days')
  ORDER BY updated_at DESC;
`;

const deleteFcmTokenByTokenQuery = `
  DELETE FROM fcm_tokens
  WHERE token = $1
  RETURNING id, user_id, user_type;
`;

const upsertFcmTokenQuery = `
  INSERT INTO fcm_tokens (user_id, user_type, token, device_id, device_type, created_at, updated_at)
  VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT (user_id, device_id, user_type)
  DO UPDATE SET token = EXCLUDED.token, updated_at = CURRENT_TIMESTAMP
  RETURNING id, user_id, user_type, token, device_id, device_type, created_at, updated_at;
`;

// ============================================================================
// NOTIFICATIONS QUERIES
// ============================================================================

const storeNotificationQuery = `
  INSERT INTO notifications (user_id, user_type, title, body, notification_type, related_id, related_type, data, is_read, created_at, updated_at)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, user_id, user_type, title, body, notification_type, related_id, related_type, data, is_read, created_at, updated_at;
`;

const getNotificationsByUserIdQuery = `
  SELECT id, user_id, user_type, title, body, notification_type, related_id, related_type, data, is_read, created_at, updated_at
  FROM notifications
  WHERE user_id = $1 AND user_type = $2
  ORDER BY created_at DESC
  LIMIT $3 OFFSET $4;
`;

const getNotificationByIdQuery = `
  SELECT id, user_id, user_type, title, body, notification_type, related_id, related_type, data, is_read, created_at, updated_at
  FROM notifications
  WHERE id = $1;
`;

const updateNotificationReadStatusQuery = `
  UPDATE notifications
  SET is_read = $2, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1
  RETURNING id, is_read, updated_at;
`;

const markAllNotificationsAsReadQuery = `
  UPDATE notifications
  SET is_read = true, updated_at = CURRENT_TIMESTAMP
  WHERE user_id = $1 AND user_type = $2 AND is_read = false
  RETURNING id;
`;

const getUnreadNotificationCountQuery = `
  SELECT COUNT(*) as unread_count
  FROM notifications
  WHERE user_id = $1 AND user_type = $2 AND is_read = false;
`;

const deleteNotificationQuery = `
  DELETE FROM notifications
  WHERE id = $1
  RETURNING id;
`;

const deleteOldNotificationsQuery = `
  DELETE FROM notifications
  WHERE created_at < (CURRENT_TIMESTAMP - INTERVAL '30 days')
  RETURNING id;
`;

// ============================================================================
// CALL TRACKING QUERIES
// ============================================================================

const logCallQuery = `
  INSERT INTO call_logs (request_id, caller_id, caller_type, receiver_id, receiver_type, call_type, start_time, end_time, duration_seconds, status, call_data, created_at, updated_at)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, request_id, caller_id, caller_type, receiver_id, receiver_type, call_type, start_time, end_time, duration_seconds, status, call_data, created_at, updated_at;
`;

const updateCallStatusQuery = `
  UPDATE call_logs
  SET status = $2, end_time = CURRENT_TIMESTAMP, duration_seconds = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time))::INTEGER, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1
  RETURNING id, status, duration_seconds, updated_at;
`;

const getCallHistoryByRequestQuery = `
  SELECT id, request_id, caller_id, caller_type, receiver_id, receiver_type, call_type, start_time, end_time, duration_seconds, status, call_data, created_at, updated_at
  FROM call_logs
  WHERE request_id = $1
  ORDER BY created_at DESC
  LIMIT $2 OFFSET $3;
`;

const getCallHistoryByUserQuery = `
  SELECT id, request_id, caller_id, caller_type, receiver_id, receiver_type, call_type, start_time, end_time, duration_seconds, status, call_data, created_at, updated_at
  FROM call_logs
  WHERE (caller_id = $1 OR receiver_id = $1)
  ORDER BY created_at DESC
  LIMIT $2 OFFSET $3;
`;

const getCallByIdQuery = `
  SELECT id, request_id, caller_id, caller_type, receiver_id, receiver_type, call_type, start_time, end_time, duration_seconds, status, call_data, created_at, updated_at
  FROM call_logs
  WHERE id = $1;
`;

const getActiveCallsByUserQuery = `
  SELECT id, request_id, caller_id, caller_type, receiver_id, receiver_type, call_type, start_time, end_time, duration_seconds, status, call_data, created_at, updated_at
  FROM call_logs
  WHERE (caller_id = $1 OR receiver_id = $1) AND status = 'active'
  ORDER BY created_at DESC;
`;

const getCallStatisticsQuery = `
  SELECT
    COUNT(*) as total_calls,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_calls,
    SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed_calls,
    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_calls,
    AVG(duration_seconds) as average_duration
  FROM call_logs
  WHERE (caller_id = $1 OR receiver_id = $1);
`;

// ============================================================================
// MESSAGE READ STATUS QUERIES
// ============================================================================

const storeMessageReadStatusQuery = `
  INSERT INTO message_read_status (message_id, reader_id, read_at, created_at, updated_at)
  VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  RETURNING id, message_id, reader_id, read_at, created_at, updated_at;
`;

const getMessageReadStatusQuery = `
  SELECT id, message_id, reader_id, read_at, created_at, updated_at
  FROM message_read_status
  WHERE message_id = $1
  ORDER BY read_at ASC;
`;

const getMessageReadStatusByReaderQuery = `
  SELECT id, message_id, reader_id, read_at, created_at, updated_at
  FROM message_read_status
  WHERE message_id = $1 AND reader_id = $2;
`;

const getUnreadMessageCountByRequestQuery = `
  SELECT COUNT(DISTINCT cm.id) as unread_count
  FROM chat_messages cm
  LEFT JOIN message_read_status mrs ON cm.id = mrs.message_id AND mrs.reader_id = $2
  WHERE cm.request_id = $1 AND cm.sender_id != $2 AND mrs.id IS NULL;
`;

const markMessageAsReadQuery = `
  INSERT INTO message_read_status (message_id, reader_id, read_at, created_at, updated_at)
  VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT (message_id, reader_id) DO UPDATE
  SET read_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  RETURNING id, message_id, reader_id, read_at;
`;

const markAllMessagesAsReadQuery = `
  INSERT INTO message_read_status (message_id, reader_id, read_at, created_at, updated_at)
  SELECT cm.id, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM chat_messages cm
  LEFT JOIN message_read_status mrs ON cm.id = mrs.message_id AND mrs.reader_id = $2
  WHERE cm.request_id = $1 AND cm.sender_id != $2 AND mrs.id IS NULL
  ON CONFLICT (message_id, reader_id) DO UPDATE
  SET read_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  RETURNING id, message_id, reader_id;
`;

const getReadReceiptsForMessageQuery = `
  SELECT id, message_id, reader_id, read_at, created_at, updated_at
  FROM message_read_status
  WHERE message_id = $1
  ORDER BY read_at DESC;
`;

// ============================================================================
// MESSAGE SEARCH QUERIES
// ============================================================================

const searchMessagesByKeywordQuery = `
  SELECT id, request_id, sender_id, sender_type, message, attachment_url, created_at, updated_at
  FROM chat_messages
  WHERE request_id = $1 AND message ILIKE $2 AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT $3 OFFSET $4;
`;

const searchMessagesByKeywordAllRequestsQuery = `
  SELECT id, request_id, sender_id, sender_type, message, attachment_url, created_at, updated_at
  FROM chat_messages
  WHERE message ILIKE $1 AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT $2 OFFSET $3;
`;

const searchMessagesByUserQuery = `
  SELECT id, request_id, sender_id, sender_type, message, attachment_url, created_at, updated_at
  FROM chat_messages
  WHERE sender_id = $1 AND sender_type = $2 AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT $3 OFFSET $4;
`;

const searchMessagesByDateRangeQuery = `
  SELECT id, request_id, sender_id, sender_type, message, attachment_url, created_at, updated_at
  FROM chat_messages
  WHERE request_id = $1 AND created_at >= $2 AND created_at <= $3 AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT $4 OFFSET $5;
`;

const searchMessagesWithAttachmentsQuery = `
  SELECT id, request_id, sender_id, sender_type, message, attachment_url, created_at, updated_at
  FROM chat_messages
  WHERE request_id = $1 AND attachment_url IS NOT NULL AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT $2 OFFSET $3;
`;

const getMessageCountByKeywordQuery = `
  SELECT COUNT(*) as total
  FROM chat_messages
  WHERE request_id = $1 AND message ILIKE $2 AND deleted_at IS NULL;
`;

// ============================================================================
// ENHANCED MESSAGE DELIVERY QUERIES
// ============================================================================

const bulkInsertMessagesQuery = `
  INSERT INTO chat_messages (request_id, sender_id, sender_type, message, attachment_url, created_at, updated_at)
  SELECT * FROM UNNEST($1::INTEGER[], $2::INTEGER[], $3::VARCHAR[], $4::TEXT[], $5::TEXT[], $6::TIMESTAMP[], $7::TIMESTAMP[])
  RETURNING id, request_id, sender_id, sender_type, message, attachment_url, created_at, updated_at;
`;

const getRecentMessagesAcrossRequestsQuery = `
  SELECT DISTINCT ON (request_id)
    id, request_id, sender_id, sender_type, message, attachment_url, created_at, updated_at
  FROM chat_messages
  WHERE deleted_at IS NULL
  ORDER BY request_id, created_at DESC
  LIMIT $1 OFFSET $2;
`;

const getMessageThreadQuery = `
  SELECT id, request_id, sender_id, sender_type, message, attachment_url, created_at, updated_at
  FROM chat_messages
  WHERE request_id = $1 AND created_at >= $2 AND deleted_at IS NULL
  ORDER BY created_at ASC;
`;

const getTotalMessageCountByUserQuery = `
  SELECT COUNT(*) as total_messages
  FROM chat_messages
  WHERE sender_id = $1 AND sender_type = $2 AND deleted_at IS NULL;
`;

// ============================================================================
// ENHANCED CALL TRACKING QUERIES
// ============================================================================

const getCallLogsByDateRangeQuery = `
  SELECT id, request_id, caller_id, caller_type, receiver_id, receiver_type, call_type, start_time, end_time, duration_seconds, status, call_data, created_at, updated_at
  FROM call_logs
  WHERE start_time >= $1 AND start_time <= $2
  ORDER BY start_time DESC
  LIMIT $3 OFFSET $4;
`;

const getCallLogsByStatusQuery = `
  SELECT id, request_id, caller_id, caller_type, receiver_id, receiver_type, call_type, start_time, end_time, duration_seconds, status, call_data, created_at, updated_at
  FROM call_logs
  WHERE status = $1
  ORDER BY created_at DESC
  LIMIT $2 OFFSET $3;
`;

const getCallLogsByRequestAndUserQuery = `
  SELECT id, request_id, caller_id, caller_type, receiver_id, receiver_type, call_type, start_time, end_time, duration_seconds, status, call_data, created_at, updated_at
  FROM call_logs
  WHERE request_id = $1 AND (caller_id = $2 OR receiver_id = $2)
  ORDER BY created_at DESC
  LIMIT $3 OFFSET $4;
`;

const getTotalCallDurationByUserQuery = `
  SELECT
    SUM(duration_seconds) as total_duration_seconds,
    COUNT(*) as total_calls
  FROM call_logs
  WHERE (caller_id = $1 OR receiver_id = $1) AND status = 'completed';
`;

const getCallCountByRequestQuery = `
  SELECT COUNT(*) as total_calls
  FROM call_logs
  WHERE request_id = $1;
`;

const updateCallEndTimeAndDurationQuery = `
  UPDATE call_logs
  SET end_time = $2,
      duration_seconds = $3,
      status = $4,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = $1
  RETURNING id, status, end_time, duration_seconds, updated_at;
`;

// ============================================================================
// ACCEPTED TABLE MESSAGE QUERIES
// ============================================================================

const sendMessageToWorkerQuery = `
  WITH accepted_data AS (
    SELECT a.worker_id, a.messages, array_agg(f.fcm_token) AS tokens
    FROM accepted a
    JOIN fcm f ON a.worker_id = f.worker_id
    WHERE a.notification_id = $1
    GROUP BY a.worker_id, a.messages
  ),
  updated AS (
    UPDATE accepted
    SET messages = COALESCE(messages, '[]'::jsonb) || $2::jsonb
    WHERE notification_id = $1
    RETURNING messages
  )
  SELECT updated.messages, accepted_data.tokens
  FROM updated
  JOIN accepted_data ON true;
`;

const sendMessageToUserQuery = `
  WITH accepted_data AS (
    SELECT a.user_id, a.messages, array_agg(f.fcm_token) AS tokens
    FROM accepted a
    JOIN userfcm f ON a.user_id = f.user_id
    WHERE a.notification_id = $1
    GROUP BY a.user_id, a.messages
  ),
  updated AS (
    UPDATE accepted
    SET messages = COALESCE(messages, '[]'::jsonb) || $2::jsonb
    WHERE notification_id = $1
    RETURNING messages
  )
  SELECT updated.messages, accepted_data.tokens
  FROM updated
  JOIN accepted_data ON true;
`;

const getMessagesFromAcceptedQuery = `
  SELECT messages
  FROM accepted
  WHERE notification_id = $1
`;

const getWorkerFcmTokensQuery = `
  SELECT fcm_token
  FROM fcm
  WHERE worker_id = $1;
`;

// ============================================================================
// PHONE CALL QUERIES
// ============================================================================

const getPhoneNumbersForWorkerCallQuery = `
  SELECT
    u.phone_number AS from_number,
    w.phone_number AS mobile_number
  FROM accepted a
  JOIN "user" u ON a.user_id = u.user_id
  JOIN workersverified w ON a.worker_id = w.worker_id
  WHERE a.notification_id = $1
`;

const getPhoneNumbersForUserCallQuery = `
  SELECT
    u.phone_number AS mobile_number,
    w.phone_number AS from_number
  FROM accepted a
  JOIN "user" u ON a.user_id = u.user_id
  JOIN workersverified w ON a.worker_id = w.worker_id
  WHERE a.notification_id = $1
`;

const getPhoneNumbersForUserTrackingCallQuery = `
  SELECT
    u.phone_number AS mobile_number,
    w.phone_number AS from_number
  FROM servicetracking s
  JOIN "user" u ON s.user_id = u.user_id
  JOIN workersverified w ON s.worker_id = w.worker_id
  WHERE s.tracking_id = $1
`;

const getPhoneNumbersForWorkerTrackingCallQuery = `
  SELECT
    u.phone_number AS from_number,
    w.phone_number AS mobile_number
  FROM servicetracking s
  JOIN "user" u ON s.user_id = u.user_id
  JOIN workersverified w ON s.worker_id = w.worker_id
  WHERE s.tracking_id = $1
`;

module.exports = {
  // Chat Messages Queries
  insertChatMessageQuery,
  getMessagesByRequestIdQuery,
  getMessageCountByRequestQuery,
  getMessageByIdQuery,
  updateChatMessageQuery,
  deleteChatMessageQuery,
  getLatestMessageByRequestQuery,

  // FCM Token Queries
  storeFcmTokenQuery,
  updateFcmTokenQuery,
  getFcmTokensByUserIdQuery,
  getFcmTokenByUserAndDeviceQuery,
  deleteFcmTokenQuery,
  deleteFcmTokenByUserAndDeviceQuery,
  deleteFcmTokenByTokenQuery,
  getAllActiveFcmTokensQuery,
  getActiveFcmTokensByUserTypeQuery,
  upsertFcmTokenQuery,

  // Notifications Queries
  storeNotificationQuery,
  getNotificationsByUserIdQuery,
  getNotificationByIdQuery,
  updateNotificationReadStatusQuery,
  markAllNotificationsAsReadQuery,
  getUnreadNotificationCountQuery,
  deleteNotificationQuery,
  deleteOldNotificationsQuery,

  // Call Tracking Queries
  logCallQuery,
  updateCallStatusQuery,
  getCallHistoryByRequestQuery,
  getCallHistoryByUserQuery,
  getCallByIdQuery,
  getActiveCallsByUserQuery,
  getCallStatisticsQuery,

  // Message Read Status Queries
  storeMessageReadStatusQuery,
  getMessageReadStatusQuery,
  getMessageReadStatusByReaderQuery,
  getUnreadMessageCountByRequestQuery,
  markMessageAsReadQuery,
  markAllMessagesAsReadQuery,
  getReadReceiptsForMessageQuery,

  // Message Search Queries
  searchMessagesByKeywordQuery,
  searchMessagesByKeywordAllRequestsQuery,
  searchMessagesByUserQuery,
  searchMessagesByDateRangeQuery,
  searchMessagesWithAttachmentsQuery,
  getMessageCountByKeywordQuery,

  // Enhanced Message Delivery Queries
  bulkInsertMessagesQuery,
  getRecentMessagesAcrossRequestsQuery,
  getMessageThreadQuery,
  getTotalMessageCountByUserQuery,

  // Enhanced Call Tracking Queries
  getCallLogsByDateRangeQuery,
  getCallLogsByStatusQuery,
  getCallLogsByRequestAndUserQuery,
  getTotalCallDurationByUserQuery,
  getCallCountByRequestQuery,
  updateCallEndTimeAndDurationQuery,

  // Accepted Table Message Queries
  sendMessageToWorkerQuery,
  sendMessageToUserQuery,
  getMessagesFromAcceptedQuery,
  getWorkerFcmTokensQuery,

  // Phone Call Queries
  getPhoneNumbersForWorkerCallQuery,
  getPhoneNumbersForUserCallQuery,
  getPhoneNumbersForUserTrackingCallQuery,
  getPhoneNumbersForWorkerTrackingCallQuery,
};
