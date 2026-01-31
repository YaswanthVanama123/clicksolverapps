/**
 * Tracking Queries Module
 * Handles all database queries related to route tracking, location tracking,
 * navigation tracking, and service tracking integration.
 *
 * Query Structure:
 * - All queries use parameterized statements for SQL injection prevention
 * - Named parameters are used for clarity: $1, $2, etc.
 * - Comments document parameter order and return expectations
 */

// ============================================================================
// ROUTE TRACKING QUERIES
// ============================================================================

/**
 * Insert a new route tracking record
 * Stores route information including start/end points, distance, and duration
 * Params: serviceId, workerId, customerId, startLocation, endLocation, distance, duration, status
 */
const INSERT_ROUTE = `
  INSERT INTO routes (
    service_id,
    worker_id,
    customer_id,
    start_location,
    end_location,
    distance,
    duration,
    status,
    created_at,
    updated_at
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
  RETURNING id, service_id, worker_id, customer_id, start_location, end_location,
            distance, duration, status, created_at, updated_at;
`;

/**
 * Get route details by route ID
 * Param: routeId
 */
const GET_ROUTE_BY_ID = `
  SELECT
    id,
    service_id,
    worker_id,
    customer_id,
    start_location,
    end_location,
    distance,
    duration,
    status,
    created_at,
    updated_at
  FROM routes
  WHERE id = $1;
`;

/**
 * Get all routes for a specific service
 * Includes route details and associated worker/customer information
 * Param: serviceId
 */
const GET_ROUTES_BY_SERVICE = `
  SELECT
    r.id,
    r.service_id,
    r.worker_id,
    r.customer_id,
    r.start_location,
    r.end_location,
    r.distance,
    r.duration,
    r.status,
    r.created_at,
    r.updated_at,
    w.name as worker_name,
    w.phone as worker_phone,
    c.name as customer_name,
    c.phone as customer_phone
  FROM routes r
  LEFT JOIN workers w ON r.worker_id = w.id
  LEFT JOIN customers c ON r.customer_id = c.id
  WHERE r.service_id = $1
  ORDER BY r.created_at DESC;
`;

/**
 * Get routes for a specific worker
 * Param: workerId
 */
const GET_ROUTES_BY_WORKER = `
  SELECT
    id,
    service_id,
    worker_id,
    customer_id,
    start_location,
    end_location,
    distance,
    duration,
    status,
    created_at,
    updated_at
  FROM routes
  WHERE worker_id = $1
  ORDER BY created_at DESC;
`;

/**
 * Update route status
 * Params: status, routeId
 */
const UPDATE_ROUTE_STATUS = `
  UPDATE routes
  SET status = $1, updated_at = NOW()
  WHERE id = $2
  RETURNING id, status, updated_at;
`;

/**
 * Get route history for analysis/reporting
 * Params: workerId, startDate, endDate
 */
const GET_ROUTE_HISTORY = `
  SELECT
    id,
    service_id,
    worker_id,
    customer_id,
    start_location,
    end_location,
    distance,
    duration,
    status,
    created_at,
    updated_at
  FROM routes
  WHERE worker_id = $1
    AND created_at >= $2
    AND created_at <= $3
  ORDER BY created_at DESC;
`;

// ============================================================================
// LOCATION TRACKING QUERIES
// ============================================================================

/**
 * Insert or update user location tracking record
 * Stores real-time location data for workers/customers
 * Params: userId, userType (worker/customer), latitude, longitude, accuracy, speed, heading
 */
const INSERT_LOCATION_TRACKING = `
  INSERT INTO location_tracking (
    user_id,
    user_type,
    latitude,
    longitude,
    accuracy,
    speed,
    heading,
    created_at,
    updated_at
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
  ON CONFLICT (user_id, user_type) DO UPDATE
  SET latitude = $3,
      longitude = $4,
      accuracy = $5,
      speed = $6,
      heading = $7,
      updated_at = NOW()
  RETURNING id, user_id, user_type, latitude, longitude, accuracy, speed, heading, updated_at;
`;

/**
 * Get current location of a user
 * Params: userId, userType
 */
const GET_USER_CURRENT_LOCATION = `
  SELECT
    id,
    user_id,
    user_type,
    latitude,
    longitude,
    accuracy,
    speed,
    heading,
    created_at,
    updated_at
  FROM location_tracking
  WHERE user_id = $1 AND user_type = $2
  LIMIT 1;
`;

/**
 * Get location history for a user within time range
 * Params: userId, userType, startTime, endTime
 */
const GET_LOCATION_HISTORY = `
  SELECT
    id,
    user_id,
    user_type,
    latitude,
    longitude,
    accuracy,
    speed,
    heading,
    created_at,
    updated_at
  FROM location_tracking
  WHERE user_id = $1
    AND user_type = $2
    AND created_at >= $3
    AND created_at <= $4
  ORDER BY created_at DESC;
`;

/**
 * Get all active worker locations (for real-time map display)
 * Returns current locations of all active workers
 */
const GET_ALL_ACTIVE_WORKER_LOCATIONS = `
  SELECT
    lt.id,
    lt.user_id,
    lt.user_type,
    lt.latitude,
    lt.longitude,
    lt.accuracy,
    lt.speed,
    lt.heading,
    lt.updated_at,
    w.name as worker_name,
    w.phone as worker_phone,
    w.avatar_url
  FROM location_tracking lt
  JOIN workers w ON lt.user_id = w.id
  WHERE lt.user_type = 'worker'
    AND w.status = 'active'
  ORDER BY lt.updated_at DESC;
`;

/**
 * Get locations of workers assigned to a specific service
 * Param: serviceId
 */
const GET_SERVICE_WORKERS_LOCATIONS = `
  SELECT
    lt.id,
    lt.user_id,
    lt.latitude,
    lt.longitude,
    lt.accuracy,
    lt.speed,
    lt.heading,
    lt.updated_at,
    w.name as worker_name,
    w.phone as worker_phone
  FROM location_tracking lt
  JOIN workers w ON lt.user_id = w.id
  JOIN service_assignments sa ON w.id = sa.worker_id
  WHERE sa.service_id = $1
    AND lt.user_type = 'worker'
  ORDER BY lt.updated_at DESC;
`;

/**
 * Get customer location by service
 * Param: serviceId
 */
const GET_CUSTOMER_LOCATION_BY_SERVICE = `
  SELECT
    lt.id,
    lt.user_id,
    lt.latitude,
    lt.longitude,
    lt.accuracy,
    lt.speed,
    lt.heading,
    lt.updated_at,
    c.name as customer_name,
    c.phone as customer_phone
  FROM location_tracking lt
  JOIN customers c ON lt.user_id = c.id
  WHERE c.id = (
    SELECT customer_id FROM services WHERE id = $1
  )
  AND lt.user_type = 'customer';
`;

/**
 * Update location for a user (batch update optimized)
 * Params: userId, userType, latitude, longitude
 */
const UPDATE_USER_LOCATION = `
  UPDATE location_tracking
  SET latitude = $3,
      longitude = $4,
      updated_at = NOW()
  WHERE user_id = $1 AND user_type = $2
  RETURNING id, user_id, latitude, longitude, updated_at;
`;

/**
 * Get stale location records (not updated in X minutes)
 * Param: minutesThreshold (e.g., 5 for 5 minutes)
 */
const GET_STALE_LOCATIONS = `
  SELECT
    id,
    user_id,
    user_type,
    updated_at
  FROM location_tracking
  WHERE updated_at < NOW() - INTERVAL '1 minute' * $1
  ORDER BY updated_at ASC;
`;

// ============================================================================
// NAVIGATION TRACKING QUERIES
// ============================================================================

/**
 * Insert navigation tracking record
 * Tracks when a worker/customer starts navigation to a destination
 * Params: serviceId, userId, userType, destinationLat, destinationLng, status, eta
 */
const INSERT_NAVIGATION_TRACKING = `
  INSERT INTO navigation_tracking (
    service_id,
    user_id,
    user_type,
    destination_latitude,
    destination_longitude,
    status,
    eta,
    started_at,
    updated_at
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
  RETURNING id, service_id, user_id, user_type, destination_latitude,
            destination_longitude, status, eta, started_at, updated_at;
`;

/**
 * Get current navigation status for a user
 * Params: userId, userType
 */
const GET_ACTIVE_NAVIGATION = `
  SELECT
    id,
    service_id,
    user_id,
    user_type,
    destination_latitude,
    destination_longitude,
    status,
    eta,
    started_at,
    completed_at,
    updated_at
  FROM navigation_tracking
  WHERE user_id = $1
    AND user_type = $2
    AND status IN ('in_progress', 'delayed')
  ORDER BY started_at DESC
  LIMIT 1;
`;

/**
 * Get navigation tracking for a specific service
 * Param: serviceId
 */
const GET_NAVIGATION_BY_SERVICE = `
  SELECT
    id,
    service_id,
    user_id,
    user_type,
    destination_latitude,
    destination_longitude,
    status,
    eta,
    started_at,
    completed_at,
    updated_at
  FROM navigation_tracking
  WHERE service_id = $1
  ORDER BY started_at DESC;
`;

/**
 * Update navigation status
 * Tracks status changes: in_progress -> completed or delayed
 * Params: status, completedAt (nullable), navigationId
 */
const UPDATE_NAVIGATION_STATUS = `
  UPDATE navigation_tracking
  SET status = $1,
      completed_at = $2,
      updated_at = NOW()
  WHERE id = $3
  RETURNING id, status, completed_at, updated_at;
`;

/**
 * Update ETA for an active navigation
 * Param: eta (new estimated time), navigationId
 */
const UPDATE_NAVIGATION_ETA = `
  UPDATE navigation_tracking
  SET eta = $1, updated_at = NOW()
  WHERE id = $2
  RETURNING id, eta, updated_at;
`;

/**
 * Get navigation history for reporting
 * Params: userId, userType, startDate, endDate
 */
const GET_NAVIGATION_HISTORY = `
  SELECT
    id,
    service_id,
    user_id,
    user_type,
    destination_latitude,
    destination_longitude,
    status,
    eta,
    started_at,
    completed_at,
    EXTRACT(EPOCH FROM (completed_at - started_at)) as duration_seconds,
    updated_at
  FROM navigation_tracking
  WHERE user_id = $1
    AND user_type = $2
    AND started_at >= $3
    AND started_at <= $4
  ORDER BY started_at DESC;
`;

// ============================================================================
// CANCELLATION & STATUS TRACKING QUERIES
// ============================================================================

/**
 * Track service cancellation
 * Params: serviceId, cancelledBy (user_id), cancellationReason, cancelledAt
 */
const INSERT_CANCELLATION_TRACKING = `
  INSERT INTO cancellation_tracking (
    service_id,
    cancelled_by,
    cancellation_reason,
    cancellation_type,
    cancelled_at,
    created_at
  ) VALUES ($1, $2, $3, $4, $5, NOW())
  RETURNING id, service_id, cancelled_by, cancellation_reason, cancelled_at;
`;

/**
 * Get cancellation details for a service
 * Param: serviceId
 */
const GET_CANCELLATION_BY_SERVICE = `
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

/**
 * Get cancellation statistics for reporting
 * Params: startDate, endDate
 */
const GET_CANCELLATION_STATS = `
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

// ============================================================================
// SERVICE TRACKING INTEGRATION QUERIES
// ============================================================================

/**
 * Get comprehensive service tracking data
 * Combines route, location, and navigation data for a service
 * Param: serviceId
 */
const GET_SERVICE_FULL_TRACKING = `
  SELECT
    s.id as service_id,
    s.status as service_status,
    s.created_at as service_created_at,
    r.id as route_id,
    r.distance,
    r.duration,
    r.status as route_status,
    lt.user_id as worker_id,
    lt.latitude,
    lt.longitude,
    lt.accuracy,
    lt.updated_at as location_updated_at,
    nt.status as navigation_status,
    nt.eta,
    nt.started_at as navigation_started_at,
    w.name as worker_name,
    c.name as customer_name
  FROM services s
  LEFT JOIN routes r ON s.id = r.service_id
  LEFT JOIN location_tracking lt ON r.worker_id = lt.user_id AND lt.user_type = 'worker'
  LEFT JOIN navigation_tracking nt ON s.id = nt.service_id
  LEFT JOIN workers w ON r.worker_id = w.id
  LEFT JOIN customers c ON s.customer_id = c.id
  WHERE s.id = $1;
`;

/**
 * Insert service tracking checkpoint
 * Records major events/milestones in service lifecycle
 * Params: serviceId, checkpointType, details, latitude, longitude
 */
const INSERT_SERVICE_CHECKPOINT = `
  INSERT INTO service_tracking_checkpoints (
    service_id,
    checkpoint_type,
    details,
    latitude,
    longitude,
    created_at
  ) VALUES ($1, $2, $3, $4, $5, NOW())
  RETURNING id, service_id, checkpoint_type, details, created_at;
`;

/**
 * Get service tracking timeline
 * Returns all tracking events in chronological order
 * Param: serviceId
 */
const GET_SERVICE_TRACKING_TIMELINE = `
  SELECT
    'checkpoint' as event_type,
    stc.id,
    stc.service_id,
    stc.checkpoint_type as event_subtype,
    stc.details,
    stc.latitude,
    stc.longitude,
    stc.created_at as timestamp
  FROM service_tracking_checkpoints stc
  WHERE stc.service_id = $1
  UNION ALL
  SELECT
    'navigation' as event_type,
    nt.id,
    nt.service_id,
    nt.status as event_subtype,
    nt.status || ' - ETA: ' || nt.eta as details,
    nt.destination_latitude as latitude,
    nt.destination_longitude as longitude,
    nt.updated_at as timestamp
  FROM navigation_tracking nt
  WHERE nt.service_id = $1
  ORDER BY timestamp ASC;
`;

/**
 * Get tracking metrics for a service
 * Calculates various tracking-related metrics
 * Param: serviceId
 */
const GET_SERVICE_TRACKING_METRICS = `
  SELECT
    s.id as service_id,
    EXTRACT(EPOCH FROM (MAX(r.updated_at) - s.created_at)) as total_tracking_duration_seconds,
    COUNT(DISTINCT r.id) as total_routes,
    COUNT(DISTINCT nt.id) as total_navigation_events,
    MAX(r.distance) as max_route_distance,
    AVG(r.distance) as avg_route_distance,
    COUNT(DISTINCT lt.id) as location_updates_count
  FROM services s
  LEFT JOIN routes r ON s.id = r.service_id
  LEFT JOIN navigation_tracking nt ON s.id = nt.service_id
  LEFT JOIN location_tracking lt ON r.worker_id = lt.user_id
  WHERE s.id = $1
  GROUP BY s.id;
`;

/**
 * Get tracking data for worker performance analysis
 * Params: workerId, startDate, endDate
 */
const GET_WORKER_TRACKING_ANALYTICS = `
  SELECT
    w.id as worker_id,
    w.name as worker_name,
    COUNT(DISTINCT r.id) as services_completed,
    SUM(r.distance) as total_distance,
    AVG(r.distance) as avg_distance,
    SUM(EXTRACT(EPOCH FROM r.duration)) as total_duration_seconds,
    COUNT(DISTINCT lt.id) as location_updates,
    COUNT(DISTINCT CASE WHEN nt.status = 'completed' THEN nt.id END) as completed_navigations
  FROM workers w
  LEFT JOIN routes r ON w.id = r.worker_id
    AND r.created_at >= $2 AND r.created_at <= $3
  LEFT JOIN location_tracking lt ON w.id = lt.user_id
    AND lt.user_type = 'worker'
    AND lt.updated_at >= $2 AND lt.updated_at <= $3
  LEFT JOIN navigation_tracking nt ON nt.user_id = w.id
    AND nt.user_type = 'worker'
    AND nt.started_at >= $2 AND nt.started_at <= $3
  WHERE w.id = $1
  GROUP BY w.id, w.name;
`;

// ============================================================================
// SERVICE TRACKING QUERIES (FROM TRACKING-SERVICE.CONTROLLER)
// ============================================================================

/**
 * Update worker action for tracking
 * Upserts worker action with screen name and params
 * Params: workerId, screenName, params (JSON string)
 */
const UPDATE_WORKER_ACTION = `
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

/**
 * Create or update user background action for tracking
 * Manages user action tracking with screen navigation
 * Params: userId, initialTrack (JSONB), encodedId, userNotificationEncodedId, newActionJson, newActionArray
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
  RETURNING *;
`;

/**
 * Insert service tracking record with accepted service data
 * Creates tracking entry by selecting from accepted table and joining with userfcm
 * Params: notificationId, trackingPin, trackingKey, serviceStatus, details (JSONB)
 */
const INSERT_SERVICE_TRACKING = `
  WITH selected AS (
    SELECT
      a.accepted_id,
      a.notification_id,
      a.user_notification_id,
      a.longitude,
      a.latitude,
      a.worker_id,
      a.service_booked,
      a.user_id,
      a.total_cost,
      a.discount,
      a.tip_amount,
      u.fcm_token
    FROM accepted a
    JOIN userfcm u ON a.user_id = u.user_id
    WHERE a.notification_id = $1
  )
  INSERT INTO servicetracking (
    accepted_id,
    notification_id,
    user_notification_id,
    longitude,
    latitude,
    worker_id,
    service_booked,
    user_id,
    total_cost,
    discount,
    tip_amount,
    created_at,
    tracking_pin,
    tracking_key,
    service_status,
    data
  )
  SELECT
    selected.accepted_id,
    selected.notification_id,
    selected.user_notification_id,
    selected.longitude,
    selected.latitude,
    selected.worker_id,
    selected.service_booked,
    selected.user_id,
    selected.total_cost,
    selected.discount,
    selected.tip_amount,
    NOW(),
    $2,
    $3,
    $4,
    $5::jsonb
  FROM selected
  ON CONFLICT (accepted_id) DO NOTHING
  RETURNING
    accepted_id,
    notification_id,
    user_notification_id,
    longitude,
    latitude,
    worker_id,
    service_booked,
    user_id,
    total_cost,
    discount,
    tip_amount,
    created_at,
    tracking_pin,
    tracking_key,
    service_status,
    data,
    (SELECT ARRAY_AGG(fcm_token) FROM selected) AS fcm_tokens;
`;

/**
 * Get tracking services for a specific worker
 * Params: workerId
 */
const GET_WORKER_TRACKING_SERVICES = `
  SELECT
    st.service_status,
    st.created_at,
    st.tracking_id,
    st.tracking_key,
    ws.service
  FROM servicetracking st
  JOIN workerskills ws ON st.worker_id = ws.worker_id
  WHERE st.worker_id = $1;
`;

/**
 * Get all tracking services (admin query)
 * No params required
 */
const GET_ALL_TRACKING_SERVICES = `
  SELECT
    st.service_status,
    st.created_at,
    st.tracking_id,
    ws.service
  FROM servicetracking st
  LEFT JOIN workerskills ws ON st.worker_id = ws.worker_id;
`;

/**
 * Get tracking services for a specific user
 * Params: userId
 */
const GET_USER_TRACKING_SERVICES = `
  SELECT
    st.service_status,
    st.created_at,
    st.tracking_id,
    st.tracking_key,
    ws.service
  FROM servicetracking st
  JOIN workerskills ws ON st.worker_id = ws.worker_id
  WHERE st.user_id = $1;
`;

// ============================================================================
// LOCATION NAVIGATION QUERIES (FROM TRACKING-LOCATION.CONTROLLER)
// ============================================================================

/**
 * Update navigation status for accepted service
 * Sets navigation status to 'timeup' after timeout
 * Params: notificationId
 */
const UPDATE_NAVIGATION_STATUS_TIMEUP = `
  UPDATE accepted
  SET navigation_status = 'timeup'
  WHERE notification_id = $1;
`;

/**
 * Get user and worker location for navigation
 * Retrieves location data from accepted table
 * Params: notificationId
 */
const GET_USER_WORKER_LOCATION_BY_NOTIFICATION = `
  SELECT longitude, latitude, worker_id
  FROM accepted
  WHERE notification_id = $1;
`;

/**
 * Get location details for navigation by notification ID
 * Fetches endpoint coordinates from accepted table
 * Params: notificationId
 */
const GET_LOCATION_DETAILS_BY_NOTIFICATION = `
  SELECT
    a.worker_id,
    a.longitude AS end_longitude,
    a.latitude AS end_latitude
  FROM accepted a
  WHERE a.notification_id = $1;
`;

/**
 * Get navigation details by notification ID
 * Fetches navigation details for worker including user and service information
 * Params: notificationId
 */
const GET_NAVIGATION_DETAILS_BY_NOTIFICATION = `
  SELECT
    n.pin,
    n.service_booked,
    w.name,
    w.phone_number,
    un.area,
    un.city,
    un.pincode,
    un.alternate_name,
    un.alternate_phone_number,
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
// FIRESTORE LOCATION QUERIES (DOCUMENTATION)
// ============================================================================

/**
 * FIRESTORE INTEGRATION NOTES:
 *
 * This system uses a hybrid approach combining PostgreSQL and Firestore:
 * - PostgreSQL: Historical data, analytics, reporting, service records
 * - Firestore: Real-time location updates, active worker tracking, live positions
 *
 * ============================================================================
 * COLLECTION 1: /locations
 * ============================================================================
 * Purpose: Real-time worker and user location tracking during active services
 * Used by: tracking-location.controller.js, booking-location.controller.js
 *
 * Document Structure:
 * {
 *   worker_id: number,           // Worker ID from PostgreSQL
 *   user_id: number,             // User ID from PostgreSQL (optional)
 *   latitude: number,            // GPS latitude coordinate
 *   longitude: number,           // GPS longitude coordinate
 *   accuracy: number,            // GPS accuracy in meters
 *   speed: number,               // Current speed in m/s
 *   heading: number,             // Direction in degrees (0-360)
 *   timestamp: Timestamp,        // Firestore server timestamp
 *   notification_id: number,     // Associated notification/booking ID
 *   service_id: number,          // Associated service ID
 *   status: string,              // 'active' | 'idle' | 'offline'
 *   deviceInfo: {
 *     deviceId: string,
 *     platform: 'ios' | 'android' | 'web'
 *   }
 * }
 *
 * Query Examples:
 *
 * @example
 * // Get single worker location
 * const workerLocationSnapshot = await db
 *   .collection("locations")
 *   .where("worker_id", "==", workerId)
 *   .limit(1)
 *   .get();
 *
 * @example
 * // Get multiple worker locations (batch query)
 * // Note: Firestore 'in' queries limited to 10 items
 * const locationsRef = db.collection("locations");
 * const query = locationsRef.where("worker_id", "in", workerIds);
 * const snapshot = await query.get();
 * const locations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 *
 * @example
 * // Real-time location tracking with listener
 * const unsubscribe = db
 *   .collection("locations")
 *   .where("notification_id", "==", notificationId)
 *   .onSnapshot(snapshot => {
 *     snapshot.docChanges().forEach(change => {
 *       if (change.type === "modified") {
 *         const locationData = change.doc.data();
 *         // Update UI with new location
 *       }
 *     });
 *   });
 *
 * @example
 * // Update worker location (set with merge)
 * await db.collection("locations").doc(documentId).set({
 *   worker_id: workerId,
 *   latitude: newLat,
 *   longitude: newLng,
 *   timestamp: admin.firestore.FieldValue.serverTimestamp()
 * }, { merge: true });
 *
 * ============================================================================
 * COLLECTION 2: /workerLocations
 * ============================================================================
 * Purpose: Active worker availability and real-time positions for matching
 * Used by: worker-nearby.controller.js, worker-location.controller.js
 *
 * Document Structure:
 * {
 *   worker_id: number,           // Worker ID from PostgreSQL
 *   latitude: number,            // Current latitude
 *   longitude: number,           // Current longitude
 *   accuracy: number,            // GPS accuracy
 *   is_available: boolean,       // Worker availability status
 *   last_updated: Timestamp,     // Last location update time
 *   services: Array<string>,     // Services worker can provide
 *   subservices: Array<string>,  // Detailed service capabilities
 *   radius_km: number,           // Service radius in kilometers
 *   active_bookings: number      // Count of current active bookings
 * }
 *
 * Query Examples:
 *
 * @example
 * // Get nearby available workers (used for booking requests)
 * const snapshot = await db
 *   .collection("workerLocations")
 *   .where("worker_id", "in", eligibleWorkerIds)
 *   .get();
 *
 * @example
 * // Get all available workers in an area
 * // Note: Firestore doesn't support radius queries natively
 * // Fetch all workers and filter by distance client-side using Haversine formula
 * const allWorkersSnapshot = await db
 *   .collection("workerLocations")
 *   .where("is_available", "==", true)
 *   .get();
 *
 * // Then filter by distance using Haversine formula
 * const nearbyWorkers = allWorkersSnapshot.docs
 *   .map(doc => doc.data())
 *   .filter(worker => {
 *     const distance = haversineDistance(
 *       userLat, userLng,
 *       worker.latitude, worker.longitude
 *     );
 *     return distance <= radiusKm;
 *   });
 *
 * @example
 * // Update worker availability and location atomically
 * await db.collection("workerLocations").doc(workerId.toString()).set({
 *   worker_id: workerId,
 *   latitude: latitude,
 *   longitude: longitude,
 *   is_available: true,
 *   last_updated: admin.firestore.FieldValue.serverTimestamp(),
 *   active_bookings: admin.firestore.FieldValue.increment(1)
 * }, { merge: true });
 *
 * ============================================================================
 * COLLECTION 3: /locationHistory (Optional - for audit trails)
 * ============================================================================
 * Purpose: Historical location tracking for analytics and dispute resolution
 * Organization: /locationHistory/{userId}/points
 *
 * Document Structure:
 * {
 *   latitude: number,
 *   longitude: number,
 *   accuracy: number,
 *   timestamp: Timestamp,
 *   service_id: number,
 *   notification_id: number,
 *   event_type: string          // 'booking_start' | 'arrived' | 'in_progress' | 'completed'
 * }
 *
 * @example
 * // Store location history point
 * await db
 *   .collection("locationHistory")
 *   .doc(workerId.toString())
 *   .collection("points")
 *   .add({
 *     latitude: lat,
 *     longitude: lng,
 *     timestamp: admin.firestore.FieldValue.serverTimestamp(),
 *     service_id: serviceId,
 *     event_type: 'in_progress'
 *   });
 *
 * @example
 * // Query location history within date range
 * const historySnapshot = await db
 *   .collection("locationHistory")
 *   .doc(workerId.toString())
 *   .collection("points")
 *   .where("timestamp", ">=", startDate)
 *   .where("timestamp", "<=", endDate)
 *   .orderBy("timestamp", "desc")
 *   .limit(1000)
 *   .get();
 *
 * ============================================================================
 * REAL-TIME UPDATES AND LISTENERS
 * ============================================================================
 *
 * @example
 * // Set up real-time listener for worker location during service
 * const setupLocationListener = (notificationId, callback) => {
 *   const unsubscribe = db
 *     .collection("locations")
 *     .where("notification_id", "==", notificationId)
 *     .onSnapshot(
 *       snapshot => {
 *         snapshot.forEach(doc => {
 *           const location = doc.data();
 *           callback(location);
 *         });
 *       },
 *       error => {
 *         console.error("Location listener error:", error);
 *       }
 *     );
 *
 *   // Return unsubscribe function to clean up listener
 *   return unsubscribe;
 * };
 *
 * @example
 * // Clean up location data after service completion
 * const cleanupServiceLocation = async (notificationId) => {
 *   const snapshot = await db
 *     .collection("locations")
 *     .where("notification_id", "==", notificationId)
 *     .get();
 *
 *   const batch = db.batch();
 *   snapshot.docs.forEach(doc => {
 *     batch.delete(doc.ref);
 *   });
 *
 *   await batch.commit();
 * };
 *
 * ============================================================================
 * USER/WORKER PRESENCE TRACKING
 * ============================================================================
 *
 * @example
 * // Track user online/offline status
 * const userPresenceRef = db.collection("presence").doc(userId.toString());
 *
 * // Set user as online
 * await userPresenceRef.set({
 *   user_id: userId,
 *   user_type: 'customer' | 'worker',
 *   status: 'online',
 *   last_seen: admin.firestore.FieldValue.serverTimestamp(),
 *   active_notification_id: notificationId,
 *   device_token: fcmToken
 * });
 *
 * // Use disconnect handler to set offline status when connection lost
 * // Note: Firestore doesn't have built-in disconnect handlers like Realtime Database
 * // Implement with periodic heartbeat updates and TTL checks
 *
 * ============================================================================
 * GEOSPATIAL QUERIES
 * ============================================================================
 *
 * Note: Firestore doesn't support native geospatial radius queries.
 * Two approaches:
 *
 * 1. Geohash approach (recommended for production):
 *
 * @example
 * // Store geohash with location (use geofirestore-js library)
 * const GeoFirestore = require('geofirestore').GeoFirestore;
 * const geofirestore = new GeoFirestore(db);
 * const geocollection = geofirestore.collection('workerLocations');
 *
 * // Add location with geohash
 * await geocollection.add({
 *   coordinates: new admin.firestore.GeoPoint(latitude, longitude),
 *   worker_id: workerId,
 *   is_available: true
 * });
 *
 * // Query within radius
 * const query = geocollection.near({
 *   center: new admin.firestore.GeoPoint(userLat, userLng),
 *   radius: 10 // kilometers
 * });
 *
 * 2. Bounding box approach (simpler, less efficient):
 *
 * @example
 * // Calculate bounding box coordinates
 * const bounds = calculateBoundingBox(centerLat, centerLng, radiusKm);
 *
 * // Query within box
 * const snapshot = await db
 *   .collection("workerLocations")
 *   .where("latitude", ">=", bounds.minLat)
 *   .where("latitude", "<=", bounds.maxLat)
 *   .where("longitude", ">=", bounds.minLng)
 *   .where("longitude", "<=", bounds.maxLng)
 *   .get();
 *
 * // Then filter by actual distance
 * const workersInRadius = snapshot.docs
 *   .map(doc => doc.data())
 *   .filter(worker => {
 *     const distance = haversineDistance(
 *       centerLat, centerLng,
 *       worker.latitude, worker.longitude
 *     );
 *     return distance <= radiusKm;
 *   });
 *
 * ============================================================================
 * PERFORMANCE OPTIMIZATION
 * ============================================================================
 *
 * 1. Indexing Strategy:
 *    - Create composite index for: (worker_id, timestamp)
 *    - Create composite index for: (notification_id, timestamp)
 *    - Create composite index for: (is_available, last_updated)
 *
 * 2. Batch Operations:
 *    - Use batch writes for updating multiple locations
 *    - Limit batch size to 500 operations
 *
 * @example
 * // Batch update multiple worker locations
 * const batch = db.batch();
 * workerLocations.forEach(location => {
 *   const docRef = db.collection("locations").doc(location.worker_id.toString());
 *   batch.set(docRef, location, { merge: true });
 * });
 * await batch.commit();
 *
 * 3. Pagination for large result sets:
 *
 * @example
 * // Paginated location history
 * let query = db
 *   .collection("locationHistory")
 *   .doc(workerId.toString())
 *   .collection("points")
 *   .orderBy("timestamp", "desc")
 *   .limit(50);
 *
 * // Get next page using last document as cursor
 * if (lastDocument) {
 *   query = query.startAfter(lastDocument);
 * }
 *
 * 4. Cleanup old data:
 *    - Schedule Cloud Function to delete old location records
 *    - Keep only last 30 days of location history
 *
 * @example
 * // Cloud Function to cleanup old locations (Firebase Functions)
 * const thirtyDaysAgo = admin.firestore.Timestamp.fromDate(
 *   new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
 * );
 *
 * const oldLocations = await db
 *   .collection("locationHistory")
 *   .where("timestamp", "<", thirtyDaysAgo)
 *   .limit(500)
 *   .get();
 *
 * const batch = db.batch();
 * oldLocations.docs.forEach(doc => batch.delete(doc.ref));
 * await batch.commit();
 *
 * ============================================================================
 * INTEGRATION WITH POSTGRESQL
 * ============================================================================
 *
 * Data Flow:
 * 1. Worker updates location -> Write to Firestore (real-time)
 * 2. Periodic sync -> Store aggregated data in PostgreSQL (workerLocation table)
 * 3. Service completion -> Archive final route to PostgreSQL (routes table)
 * 4. Analytics queries -> Use PostgreSQL
 * 5. Real-time tracking -> Use Firestore
 *
 * Sync Strategy:
 * - Write location updates directly to Firestore for real-time tracking
 * - Every 30 seconds, sync current location to PostgreSQL workerLocation table
 * - On service completion, save full route to PostgreSQL routes table
 * - Archive Firestore location after service completion
 *
 * @example
 * // Sync Firestore to PostgreSQL (periodic background job)
 * const syncLocationToPG = async (workerId) => {
 *   // Get latest location from Firestore
 *   const snapshot = await db
 *     .collection("locations")
 *     .where("worker_id", "==", workerId)
 *     .orderBy("timestamp", "desc")
 *     .limit(1)
 *     .get();
 *
 *   if (!snapshot.empty) {
 *     const location = snapshot.docs[0].data();
 *
 *     // Update PostgreSQL
 *     await client.query(
 *       `INSERT INTO workerLocation (worker_id, longitude, latitude, updated_at)
 *        VALUES ($1, $2, $3, NOW())
 *        ON CONFLICT (worker_id)
 *        DO UPDATE SET longitude = $2, latitude = $3, updated_at = NOW()`,
 *       [workerId, location.longitude, location.latitude]
 *     );
 *   }
 * };
 *
 * ============================================================================
 * ERROR HANDLING
 * ============================================================================
 *
 * @example
 * // Robust Firestore query with error handling
 * const getWorkerLocation = async (workerId) => {
 *   try {
 *     const snapshot = await db
 *       .collection("locations")
 *       .where("worker_id", "==", workerId)
 *       .limit(1)
 *       .get();
 *
 *     if (snapshot.empty) {
 *       return null;
 *     }
 *
 *     return snapshot.docs[0].data();
 *   } catch (error) {
 *     console.error("Firestore query error:", error);
 *
 *     // Fallback to PostgreSQL if Firestore unavailable
 *     try {
 *       const result = await client.query(
 *         'SELECT * FROM workerLocation WHERE worker_id = $1',
 *         [workerId]
 *       );
 *       return result.rows[0] || null;
 *     } catch (pgError) {
 *       console.error("PostgreSQL fallback error:", pgError);
 *       return null;
 *     }
 *   }
 * };
 *
 * ============================================================================
 * SECURITY RULES (Firestore Rules)
 * ============================================================================
 *
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     // Worker locations - write only by authenticated workers
 *     match /locations/{locationId} {
 *       allow read: if request.auth != null;
 *       allow write: if request.auth != null &&
 *                    request.resource.data.worker_id == request.auth.uid;
 *     }
 *
 *     // Worker locations collection - admin read
 *     match /workerLocations/{workerId} {
 *       allow read: if request.auth != null;
 *       allow write: if request.auth != null &&
 *                    request.auth.token.worker_id == int(workerId);
 *     }
 *
 *     // Location history - restricted access
 *     match /locationHistory/{userId}/points/{pointId} {
 *       allow read: if request.auth != null &&
 *                   (request.auth.uid == userId || request.auth.token.admin == true);
 *       allow write: if request.auth != null && request.auth.uid == userId;
 *     }
 *   }
 * }
 */

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Route Tracking
  INSERT_ROUTE,
  GET_ROUTE_BY_ID,
  GET_ROUTES_BY_SERVICE,
  GET_ROUTES_BY_WORKER,
  UPDATE_ROUTE_STATUS,
  GET_ROUTE_HISTORY,

  // Location Tracking
  INSERT_LOCATION_TRACKING,
  GET_USER_CURRENT_LOCATION,
  GET_LOCATION_HISTORY,
  GET_ALL_ACTIVE_WORKER_LOCATIONS,
  GET_SERVICE_WORKERS_LOCATIONS,
  GET_CUSTOMER_LOCATION_BY_SERVICE,
  UPDATE_USER_LOCATION,
  GET_STALE_LOCATIONS,

  // Navigation Tracking
  INSERT_NAVIGATION_TRACKING,
  GET_ACTIVE_NAVIGATION,
  GET_NAVIGATION_BY_SERVICE,
  UPDATE_NAVIGATION_STATUS,
  UPDATE_NAVIGATION_ETA,
  GET_NAVIGATION_HISTORY,

  // Cancellation & Status Tracking
  INSERT_CANCELLATION_TRACKING,
  GET_CANCELLATION_BY_SERVICE,
  GET_CANCELLATION_STATS,

  // Service Tracking Integration
  GET_SERVICE_FULL_TRACKING,
  INSERT_SERVICE_CHECKPOINT,
  GET_SERVICE_TRACKING_TIMELINE,
  GET_SERVICE_TRACKING_METRICS,
  GET_WORKER_TRACKING_ANALYTICS,

  // Service Tracking Queries (from tracking-service.controller)
  UPDATE_WORKER_ACTION,
  UPSERT_USER_BACKGROUND_ACTION,
  INSERT_SERVICE_TRACKING,
  GET_WORKER_TRACKING_SERVICES,
  GET_ALL_TRACKING_SERVICES,
  GET_USER_TRACKING_SERVICES,

  // Location Navigation Queries (from tracking-location.controller)
  UPDATE_NAVIGATION_STATUS_TIMEUP,
  GET_USER_WORKER_LOCATION_BY_NOTIFICATION,
  GET_LOCATION_DETAILS_BY_NOTIFICATION,
  GET_NAVIGATION_DETAILS_BY_NOTIFICATION,
};
