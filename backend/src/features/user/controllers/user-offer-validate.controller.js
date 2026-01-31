const client = require("../../../database/connection");
const { user: userQueries } = require("../../../database/queries");

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

    const offerResult = await client.query(userQueries.getOfferDetailsQuery, [
      offer_code,
    ]);

    if (offerResult.rowCount === 0) {
      return res.status(200).json({
        valid: false,
        error: "Offer not valid or expired",
        discountAmount: 0,
        newTotal: Number(totalAmount),
      });
    }

    const userResult = await client.query(userQueries.getUserOffersUsedQuery, [
      user_id,
    ]);

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
      await client.query(userQueries.addOfferToUserOffersUsedQuery, [
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

module.exports = {
  offerValidation,
};
