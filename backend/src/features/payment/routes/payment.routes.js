const express = require('express');
const {
  createOrder,
  verifyPayment,
  processPayment,
  getPaymentDetails,
  getServiceCompletedDetails,
  getWorkerDetails,
} = require('../controllers/index');
const { authenticateWorkerToken } = require('../../../middlewares/authworkerMiddleware');

const router = express.Router();

/**
 * POST /create-order
 * Create a payment order with Razorpay
 * Requires: authenticateWorkerToken
 */
router.post('/create-order', authenticateWorkerToken, createOrder);

/**
 * POST /verify-payment
 * Verify payment signature and update payment status
 * Requires: authenticateWorkerToken
 */
router.post('/verify-payment', authenticateWorkerToken, verifyPayment);

/**
 * POST /user/payed
 * Process payment for service completion
 */
router.post('/user/payed', processPayment);

/**
 * POST /payment/details
 * Get detailed payment information for a service
 */
router.post('/payment/details', getWorkerDetails);

/**
 * POST /worker/payment/scanner/details
 * Get payment details for scanner with service info
 */
router.post('/worker/payment/scanner/details', async (req, res) => {
  const { notification_id } = req.body;
  try {
    const { name, service, discount, total_cost } = await getPaymentDetails(
      notification_id
    );
    res.json({
      totalAmount: total_cost,
      name,
      service,
      discount,
    });
  } catch (error) {
    console.error('Error fetching scanner payment details:', error);
    res.status(500).json({ error: 'Error fetching payment details' });
  }
});

/**
 * POST /worker/payment/service/completed/details
 * Get service completed payment details
 */
router.post('/worker/payment/service/completed/details', getServiceCompletedDetails);

module.exports = router;
