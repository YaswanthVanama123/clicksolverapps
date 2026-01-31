const client = require("../../../connection.js");

const userCoupons = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await client.query(
      `
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
      `,
      [userId]
    );

    if (result.rows.length > 0) {
      const { service_completed, coupons } = result.rows[0];
      res.json({ service_completed, coupons: coupons || null });
    } else {
      res.status(404).json({ message: "User not found or no data available" });
    }
  } catch (error) {
    console.error("Error fetching user coupons:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const userReferrals = async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);

    const result = await client.query(
      `
      SELECT
        u1.referral_code AS referralCode,
        u2.name,
        u2.service_completed
      FROM "user" u1
      LEFT JOIN "user" u2 ON u2.referred_by = u1.referral_code
      WHERE u1.user_id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "User not found or no referrals available" });
    }

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching user referrals:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const fetchOffers = async (req, res) => {
  try {
    const user_id = req.user.id;
    const role = req.user && req.user.role ? req.user.role : "user";

    const query = `
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

    const values = [user_id, role];
    const result = await client.query(query, values);
    const offers = result.rows;

    return res.status(200).json({
      success: true,
      offers,
    });
  } catch (error) {
    console.error("Error fetching offers:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const offerValidation = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { offer_code, totalAmount } = req.body;

    if (!user_id || !offer_code || totalAmount == null) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required parameters: user_id, offer_code, or totalAmount",
      });
    }

    const offerDetailQuery = `
      SELECT discount_percentage, min_booking_amount, max_discount_amount
      FROM offers
      WHERE offer_code = $1
        AND is_active = TRUE
        AND start_date <= NOW()
        AND end_date >= NOW()
      LIMIT 1`;
    const offerResult = await client.query(offerDetailQuery, [offer_code]);

    if (offerResult.rowCount === 0) {
      return res.status(200).json({
        valid: false,
        error: "Offer not valid or expired",
        discountAmount: 0,
        newTotal: Number(totalAmount),
      });
    }

    const userQuery = `SELECT user_id, offers_used FROM "user" WHERE user_id = $1`;
    const userResult = await client.query(userQuery, [user_id]);

    if (userResult.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const user = userResult.rows[0];
    const offersUsed = user.offers_used || [];

    if (offer_code.includes("WELCOME")) {
      const hasUsedWelcome = offersUsed.some(
        (item) =>
          item.offer_code === offer_code &&
          (item.status === "applied" || item.status === "used")
      );

      if (hasUsedWelcome) {
        return res.status(200).json({
          valid: false,
          error: "Offer already used",
          discountAmount: 0,
          newTotal: Number(totalAmount),
        });
      }
    }

    const offerExists = offersUsed.some(
      (item) => item.offer_code === offer_code
    );
    if (!offerExists) {
      const updateQuery = `
        UPDATE "user"
        SET offers_used = COALESCE(offers_used, '[]'::jsonb) || $1::jsonb
        WHERE user_id = $2
        AND NOT EXISTS (
          SELECT 1
          FROM jsonb_array_elements(COALESCE(offers_used, '[]'::jsonb)) AS item
          WHERE item->>'offer_code' = $3
        )`;
      await client.query(updateQuery, [
        JSON.stringify([{ offer_code, status: "pending", quantity: 0 }]),
        user_id,
        offer_code,
      ]);
    }

    const { discount_percentage, min_booking_amount, max_discount_amount } =
      offerResult.rows[0];

    if (Number(totalAmount) < Number(min_booking_amount)) {
      return res.status(200).json({
        valid: false,
        error: `Minimum booking amount required is ₹${min_booking_amount}`,
        discountAmount: 0,
        newTotal: Number(totalAmount),
      });
    }

    const discountCalc = Math.min(
      (Number(totalAmount) * Number(discount_percentage)) / 100,
      Number(max_discount_amount)
    );
    const newTotal = Number(totalAmount) - discountCalc;

    return res.status(200).json({
      valid: true,
      discountAmount: discountCalc,
      newTotal,
      error: null,
    });
  } catch (error) {
    console.error("Error in offer validation:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const getSpecialOffers = async (req, res) => {
  try {
    const result = await client.query(`
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
    `);

    return res.status(200).json({
      offers: result.rows,
    });
  } catch (error) {
    console.error("Error fetching special offers:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

module.exports = {
  userCoupons,
  userReferrals,
  fetchOffers,
  offerValidation,
  getSpecialOffers,
};
