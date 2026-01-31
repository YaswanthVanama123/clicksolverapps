const client = require("../../../connection.js");

// Service catalog queries
const getAllServices = async () => {
  try {
    const result = await client.query(`
      SELECT
        main_service_id,
        service_category,
        service_tag,
        service_details
      FROM allservices
    `);
    return result.rows;
  } catch (error) {
    console.error("Error fetching all services:", error);
    throw error;
  }
};

const getHomeServices = async () => {
  try {
    const query = `
      SELECT
        service_title,
        array_agg(service_id ORDER BY service_id)      AS service_ids,
        array_agg(service_name ORDER BY service_id)    AS service_names,
        array_agg(service_urls  ORDER BY service_id)    AS service_urls
      FROM services
      GROUP BY service_title
      ORDER BY service_title;
    `;
    const { rows } = await client.query(query);
    return rows;
  } catch (error) {
    console.error("Error fetching home services:", error);
    throw error;
  }
};

const getServiceCategories = async () => {
  try {
    const result = await client.query('SELECT * FROM "servicecategories"');
    return result.rows;
  } catch (err) {
    console.error("Error fetching servicecategories:", err);
    throw err;
  }
};

const getElectricianServices = async () => {
  try {
    const result = await client.query(
      'SELECT * FROM "services" WHERE service_title = $1',
      ["Electrician Services"]
    );
    return result.rows;
  } catch (err) {
    console.error("Error fetching electrician services:", err);
    throw err;
  }
};

const getPlumberServices = async () => {
  try {
    const result = await client.query(
      'SELECT * FROM "services" WHERE service_title = $1',
      ["Plumber"]
    );
    return result.rows;
  } catch (err) {
    console.error("Error fetching Plumber services:", err);
    throw err;
  }
};

const getCleaningServices = async () => {
  try {
    const result = await client.query(
      'SELECT * FROM "services" WHERE service_title = $1',
      ["Cleaning Department"]
    );
    return result.rows;
  } catch (err) {
    console.error("Error fetching Cleaning services:", err);
    throw err;
  }
};

const getPaintingServices = async () => {
  try {
    const result = await client.query(
      'SELECT * FROM "services" WHERE service_title = $1',
      ["House and Shop Painting"]
    );
    return result.rows;
  } catch (err) {
    console.error("Error fetching Painter services:", err);
    throw err;
  }
};

const getVehicleServices = async () => {
  try {
    const result = await client.query(
      'SELECT * FROM "services" WHERE service_title IN ($1, $2)',
      ["Vehical mechanics", "Salon for mens & kids"]
    );
    return result.rows;
  } catch (err) {
    console.error("Error fetching Vehicle services:", err);
    throw err;
  }
};

const getIndividualServicesByTitle = async (serviceTitle) => {
  try {
    const result = await client.query(
      'SELECT service_id, service_name, service_urls FROM "services" WHERE "service_title" = $1',
      [serviceTitle]
    );
    return result.rows;
  } catch (err) {
    console.error("Error fetching individual services:", err);
    throw err;
  }
};

const getServiceByName = async (serviceName) => {
  try {
    const query = `
      SELECT
        a.main_service_id,
        a.cost,
        a.service_tag,
        a.service_details,
        r.service_urls
      FROM allservices a
      JOIN (
          SELECT
            r.related_services,
            r.service_urls,
            ARRAY(SELECT jsonb_array_elements_text(r.related_services)) AS related_services_arr
          FROM relatedservices r
          WHERE r.service_category = $1
      ) AS r
        ON a.service_tag = ANY(r.related_services_arr)
      ORDER BY array_position(r.related_services_arr, a.service_tag);
    `;
    const result = await client.query(query, [serviceName]);
    return result.rows;
  } catch (error) {
    console.error("Error fetching service by name:", error);
    throw error;
  }
};

const getSubservices = async (selectedService) => {
  try {
    const result = await client.query(
      `SELECT
            asv.service_tag,
            asv.main_service_id,
            rs.service_category,
            s.service_id
        FROM
            servicecategories sc
        JOIN
            relatedservices rs ON sc.service_name = rs.service
        JOIN
            allservices asv ON asv.service_category = rs.service_category
        JOIN
            services s ON s.service_name = rs.service_category
        WHERE
            sc.service_name = $1;
        `,
      [selectedService]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching subservices:", error);
    throw error;
  }
};

const insertRelatedService = async (service, serviceCategory, relatedServices) => {
  try {
    const query = `
      INSERT INTO relatedservices (service, service_category, related_services)
      VALUES ($1, $2, $3) RETURNING *;
    `;
    const values = [service, serviceCategory, relatedServices];
    const result = await client.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error inserting related service:", error);
    throw error;
  }
};

// Service tracking queries
const insertServiceTracking = async (notificationId, trackingPin, trackingKey, serviceStatus, details) => {
  try {
    const query = `
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
    const values = [notificationId, trackingPin, trackingKey, serviceStatus, details];
    const result = await client.query(query, values);
    return result.rows;
  } catch (error) {
    console.error("Error inserting service tracking:", error);
    throw error;
  }
};

const getWorkerTrackingServices = async (workerId) => {
  try {
    const query = `
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
    const result = await client.query(query, [workerId]);
    return result.rows;
  } catch (error) {
    console.error("Error fetching worker tracking services:", error);
    throw error;
  }
};

const getUserTrackingServices = async (userId) => {
  try {
    const query = `
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
    const result = await client.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error("Error fetching user tracking services:", error);
    throw error;
  }
};

const getAllTrackingServices = async () => {
  try {
    const query = `
      SELECT
        st.service_status,
        st.created_at,
        st.tracking_id,
        ws.service
      FROM servicetracking st
      LEFT JOIN workerskills ws ON st.worker_id = ws.worker_id;
    `;
    const result = await client.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error fetching all tracking services:", error);
    throw error;
  }
};

const getServiceTrackingWorkerItemDetails = async (trackingId) => {
  try {
    const query = `
      SELECT
        st.service_booked,
        st.service_status,
        st.created_at,
        st.tracking_pin,
        st.total_cost,
        st.discount,
        st.longitude,
        st.latitude,
        u.name,
        u.phone_number,
        un.area
      FROM servicetracking st
      JOIN "user" u ON st.user_id = u.user_id
      JOIN usernotifications un ON st.user_notification_id = un.user_notification_id
      WHERE st.tracking_id = $1;
    `;
    const result = await client.query(query, [trackingId]);
    return result.rows;
  } catch (error) {
    console.error("Error fetching service tracking worker item details:", error);
    throw error;
  }
};

const getServiceTrackingUserItemDetails = async (trackingId) => {
  try {
    const query = `
      SELECT
        st.service_booked,
        st.service_status,
        st.created_at,
        st.tracking_pin,
        st.total_cost,
        st.discount,
        st.data,
        w.name,
        w.phone_number,
        un.area,
        ws.profile,
        ws.service
      FROM servicetracking st
      JOIN workersverified w ON st.worker_id = w.worker_id
      JOIN usernotifications un ON st.user_notification_id = un.user_notification_id
      JOIN workerskills ws ON w.worker_id = ws.worker_id
      WHERE st.tracking_id = $1;
    `;
    const result = await client.query(query, [trackingId]);
    return result.rows;
  } catch (error) {
    console.error("Error fetching service tracking user item details:", error);
    throw error;
  }
};

const updateServiceTrackingStatus = async (newStatus, trackingId) => {
  try {
    const query = `
      WITH updated AS (
        UPDATE servicetracking
        SET service_status = $1
        WHERE tracking_id = $2
        RETURNING tracking_id, service_status, user_id
      )
      SELECT updated.tracking_id, updated.service_status, uf.fcm_token
      FROM updated
      JOIN userfcm uf ON updated.user_id = uf.user_id;
    `;
    const values = [newStatus, trackingId];
    const result = await client.query(query, values);
    return result.rows;
  } catch (error) {
    console.error("Error updating service status:", error);
    throw error;
  }
};

const verifyServiceDeliveryOTP = async (trackingId, trackingPin) => {
  try {
    const query = `
      WITH fetched_data AS (
        SELECT
          st.tracking_pin,
          st.notification_id
        FROM servicetracking st
        WHERE st.tracking_id = $1
      ),
      update_accepted AS (
        UPDATE accepted a
        SET
          time = jsonb_set(
            COALESCE(a.time, '{}'::jsonb),
            '{workCompleted}',
            to_jsonb(to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS'))
          )
        WHERE a.notification_id = (SELECT notification_id FROM fetched_data)
          AND (SELECT tracking_pin FROM fetched_data) = $2
        RETURNING a.time
      )
      SELECT
        (SELECT notification_id FROM fetched_data) AS notification_id,
        EXISTS (SELECT 1 FROM update_accepted) AS otp_verified
      ;
    `;
    const result = await client.query(query, [trackingId, trackingPin]);
    return result.rows;
  } catch (error) {
    console.error("Error verifying service delivery OTP:", error);
    throw error;
  }
};

module.exports = {
  // Service catalog queries
  getAllServices,
  getHomeServices,
  getServiceCategories,
  getElectricianServices,
  getPlumberServices,
  getCleaningServices,
  getPaintingServices,
  getVehicleServices,
  getIndividualServicesByTitle,
  getServiceByName,
  getSubservices,
  insertRelatedService,
  // Service tracking queries
  insertServiceTracking,
  getWorkerTrackingServices,
  getUserTrackingServices,
  getAllTrackingServices,
  getServiceTrackingWorkerItemDetails,
  getServiceTrackingUserItemDetails,
  updateServiceTrackingStatus,
  verifyServiceDeliveryOTP,
};
