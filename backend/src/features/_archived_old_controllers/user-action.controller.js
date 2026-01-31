const { getMessaging } = require("firebase-admin/messaging");
const client = require("../../../connection.js");

const createUserAction = async (req, res) => {
  const userId = req.user.id;
  const {
    encodedId,
    screen,
    serviceBooked,
    area,
    city,
    alternateName,
    alternatePhoneNumber,
    pincode,
    location,
    discount,
    tipAmount,
    offer,
  } = req.body;

  try {
    const query = `
      SELECT * FROM useraction
      WHERE user_id = $1;
    `;

    const result = await client.query(query, [userId]);
    const existingUserAction = result.rows[0];

    const hasAdditionalFields =
      area || city || alternateName || alternatePhoneNumber || pincode;

    if (existingUserAction) {
      let updatedTrack = existingUserAction.track;

      if (screen === "") {
        updatedTrack = updatedTrack.filter(
          (item) => item.encodedId !== encodedId
        );
      } else {
        updatedTrack = updatedTrack.filter(
          (item) => item.encodedId !== encodedId
        );

        const newAction = {
          screen,
          encodedId,
          serviceBooked,
        };

        if (hasAdditionalFields) {
          newAction.area = area;
          newAction.city = city;
          newAction.alternateName = alternateName;
          newAction.alternatePhoneNumber = alternatePhoneNumber;
          newAction.pincode = pincode;
          newAction.location = location;
          newAction.discount = discount;
          newAction.tipAmount = tipAmount;
          newAction.offer = offer;
        }

        updatedTrack.push(newAction);
      }

      const updateQuery = `
        UPDATE useraction
        SET track = $1
        WHERE user_id = $2
        RETURNING *;
      `;
      const updateResult = await client.query(updateQuery, [
        JSON.stringify(updatedTrack),
        userId,
      ]);
      const updatedTrackScreen = updateResult.rows[0];

      res.json(updatedTrackScreen);
    } else {
      let newTrack = [];

      if (screen) {
        const newAction = {
          screen,
          encodedId,
          serviceBooked,
        };

        if (hasAdditionalFields) {
          newAction.area = area;
          newAction.city = city;
          newAction.alternateName = alternateName;
          newAction.alternatePhoneNumber = alternatePhoneNumber;
          newAction.pincode = pincode;
          newAction.location = location;
          newAction.discount = discount;
          newAction.tipAmount = tipAmount;
          newAction.offer = offer;
        }

        newTrack = [newAction];
      }

      const insertQuery = `
        INSERT INTO useraction (user_id, track)
        VALUES ($1, $2)
        RETURNING *;
      `;
      const insertResult = await client.query(insertQuery, [
        userId,
        JSON.stringify(newTrack),
      ]);
      const updatedTrackScreen = insertResult.rows[0];

      res.json(updatedTrackScreen);
    }
  } catch (error) {
    console.error("Error inserting or updating user action:", error);
    res
      .status(500)
      .json({ message: "Error inserting or updating user action" });
  }
};

const userActionRemove = async (req, res) => {
  const userId = req.user.id;
  const { screen, encodedId, offer } = req.body;

  console.log("offer applied", offer);

  try {
    if (offer) {
      const offerCodeValue = offer.offer_code;
      console.log("offers applied changes", offerCodeValue);
      const queryText = `
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

      const values = [offerCodeValue, userId];

      await client.query(queryText, values);
    }

    const query = `
      SELECT track FROM useraction
      WHERE user_id = $1;
    `;

    const result = await client.query(query, [userId]);
    const existingTrack = result.rows[0]?.track;

    if (!existingTrack) {
      return res.status(404).json({ message: "User action not found" });
    }

    const updatedTrack = existingTrack.filter(
      (item) => item.encodedId !== encodedId
    );

    if (updatedTrack.length === existingTrack.length) {
      return res.status(404).json({ message: "No matching encodedId found" });
    }

    const updateQuery = `
      UPDATE useraction
      SET track = $1
      WHERE user_id = $2
      RETURNING *;
    `;
    const updateResult = await client.query(updateQuery, [
      JSON.stringify(updatedTrack),
      userId,
    ]);

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error("Error removing user action:", error);
    res.status(500).json({ message: "Error removing user action" });
  }
};

const getUserTrackRoute = async (req, res) => {
  const id = req.user.id;
  try {
    const query = `
      SELECT u.name, u.profile, ua.track
      FROM "user" u
      LEFT JOIN useraction ua ON u.user_id = ua.user_id
      WHERE u.user_id = $1;
    `;

    const result = await client.query(query, [id]);

    if (result.rows.length > 0) {
      const { name, track, profile } = result.rows[0];

      if (track) {
        res.status(200).json({ track, user: name, profile });
      } else {
        res.status(203).json({ user: name, profile });
      }
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    console.error(`Error fetching user with ID ${id}:`, err);
    res.status(500).json({ message: "Error fetching user data" });
  }
};

const userCancelNavigation = async (req, res) => {
  const { notification_id } = req.body;

  if (!notification_id) {
    return res.status(400).json({ error: "Notification ID is required" });
  }

  try {
    const query = `
      UPDATE accepted
      SET user_navigation_cancel_status = 'usercanceled'
      WHERE notification_id = $1
      AND (user_navigation_cancel_status IS NULL OR user_navigation_cancel_status != 'timeup')
      RETURNING user_navigation_cancel_status;
    `;

    const result = await client.query(query, [notification_id]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Cancellation time is up or Notification not found" });
    }

    const updatedStatus = result.rows[0].user_navigation_cancel_status;

    if (updatedStatus === "timeup") {
      return res.status(404).json({ error: "Cancellation time is up" });
    }

    return res.status(200).json({ message: "Cancellation successful" });
  } catch (error) {
    console.error("Error updating cancellation status:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

const userNavigationCancel = async (req, res) => {
  const { notification_id, offer_code } = req.body;
  const encodedUserNotificationId = Buffer.from(
    notification_id.toString()
  ).toString("base64");

  try {
    await client.query("BEGIN");
    console.log("Transaction started for notification_id:", notification_id);

    const combinedQuery = await client.query(
      `
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
      `,
      [notification_id, offer_code]
    );

    if (combinedQuery.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        error: "Cancellation not performed. Invalid ID or already canceled.",
      });
    }

    await client.query(
      `DELETE FROM accepted
         WHERE notification_id = $1
           AND verification_status = FALSE`,
      [notification_id]
    );

    await client.query("COMMIT");
    console.log(
      "Transaction committed successfully for notification_id:",
      notification_id
    );

    const { verified, worker_id, user_id, service_booked, fcm_token } =
      combinedQuery.rows[0];

    if (!verified) {
      if (fcm_token) {
        const message = {
          notification: {
            title: "Booking Cancelled",
            body: `User has cancelled the booking for ${service_booked}`,
          },
          token: fcm_token,
          data: {
            notification_id: encodedUserNotificationId,
          },
        };

        try {
          await getMessaging().send(message);
          console.log("FCM notification sent successfully");
        } catch (fcmError) {
          console.error("Error sending FCM notification:", fcmError);
        }
      }

      return res.status(200).json({
        message: "Cancellation successful",
        verified: false,
      });
    }

    return res.status(200).json({
      message: "Booking verified, cannot cancel",
      verified: true,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error during cancellation:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const userCancellationStatus = async (req, res) => {
  const { notification_id } = req.query;

  if (!notification_id) {
    return res.status(400).json({ error: "Notification ID is required" });
  }

  try {
    const result = await client.query(
      "SELECT 1 FROM accepted WHERE notification_id = $1",
      [notification_id]
    );

    if (result.rows.length > 0) {
      return res.status(200).json({ message: "Row found" });
    } else {
      return res.status(205).json({ message: "User cancelled" });
    }
  } catch (error) {
    console.error("Error checking cancellation status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createUserAction,
  userActionRemove,
  getUserTrackRoute,
  userCancelNavigation,
  userNavigationCancel,
  userCancellationStatus,
};
