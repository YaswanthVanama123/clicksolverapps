const express = require('express');
const { authenticateToken } = require('../../../middlewares/authMiddleware');
const {
  userCoupons,
  userReferrals,
  fetchOffers,
  offerValidation,
} = require('../controllers');

const router = express.Router();

/**
 * POST /user/coupons
 * User coupons management
 * Protected by authenticateToken middleware
 */
router.post('/user/coupons', authenticateToken, userCoupons);

/**
 * GET /user/referrals
 * Get user referral information
 * Protected by authenticateToken middleware
 */
router.get('/user/referrals', authenticateToken, userReferrals);

/**
 * GET /user/offers
 * Fetch available offers for the user
 * Protected by authenticateToken middleware
 */
router.get('/user/offers', authenticateToken, fetchOffers);

/**
 * POST /user/validate-offer
 * Validate and apply an offer/coupon for user
 * Protected by authenticateToken middleware
 */
router.post('/user/validate-offer', authenticateToken, offerValidation);

module.exports = router;
