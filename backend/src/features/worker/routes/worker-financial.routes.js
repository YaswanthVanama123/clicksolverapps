const express = require('express');
const {
  addBankAccount,
  createFundAccount,
  validateAndSaveUPI,
  getWorkerEarnings,
  balanceAmmountToPay,
  getWorkerBalanceDetails,
  balanceHistory,
  getWorkerCashbackDetails,
  workerCashbackPayed,
  cashbackHistory,
  getWorkersPendingCashback,
  pendingBalanceWorkers,
} = require('../controllers/index');
const { authenticateWorkerToken } = require('../../../middlewares');

const router = express.Router();

/**
 * POST /account/submit
 * Submit and verify bank account details
 * Authentication: Required (Worker token)
 * Body: { bank, accountNumber, ifscCode, accountHolderName }
 */
router.post('/account/submit', authenticateWorkerToken, addBankAccount);

/**
 * POST /account/fund_account
 * Create a fund account for bank transfers via Razorpay
 * Authentication: Required (Worker token)
 * Body: { name, ifsc, account_number, bank_name }
 */
router.post('/account/fund_account', authenticateWorkerToken, createFundAccount);

/**
 * POST /upi/submit
 * Submit and validate UPI ID
 * Authentication: Required (Worker token)
 * Body: { upi_id }
 */
router.post('/upi/submit', authenticateWorkerToken, validateAndSaveUPI);

/**
 * POST /worker/earnings
 * Retrieve worker earnings for a specific date or date range
 * Authentication: Required (Worker token)
 * Body: { date } or { startDate, endDate }
 */
router.post('/worker/earnings', authenticateWorkerToken, getWorkerEarnings);

/**
 * POST /balance/ammount
 * Retrieve balance amount payable to worker
 * Authentication: Required (Worker token)
 * Returns: Array of payments with payment details
 */
router.post('/balance/ammount', authenticateWorkerToken, balanceAmmountToPay);

/**
 * POST /worker/pending/balance
 * Retrieve pending balance details for a worker
 * Authentication: Optional
 * Body: { worker_id }
 */
router.post('/worker/pending/balance', getWorkerBalanceDetails);

/**
 * GET /worker/balance/history
 * Retrieve balance payment history for a worker
 * Authentication: Optional
 * Query: { worker_id }
 */
router.get('/worker/balance/history', balanceHistory);

/**
 * POST /worker/pending/cashback
 * Retrieve pending cashback details for a worker
 * Authentication: Optional
 * Body: { worker_id }
 */
router.post('/worker/pending/cashback', getWorkerCashbackDetails);

/**
 * POST /worker/cashback/payed
 * Mark cashback as paid and update worker records
 * Authentication: Optional
 * Body: { worker_id, cashbackCount, cashbackPayed }
 */
router.post('/worker/cashback/payed', workerCashbackPayed);

/**
 * GET /worker/cashback/history
 * Retrieve cashback history for a worker
 * Authentication: Optional
 * Query: { worker_id }
 */
router.get('/worker/cashback/history', cashbackHistory);

/**
 * GET /workers/pending/cashback
 * Retrieve all workers with pending cashback
 * Authentication: Optional
 * Returns: Array of workers with pending cashback details
 */
router.get('/workers/pending/cashback', getWorkersPendingCashback);

/**
 * GET /pending/balance/workers
 * Retrieve all workers with pending balance
 * Authentication: Optional
 * Returns: Array of workers with pending balance details
 */
router.get('/pending/balance/workers', pendingBalanceWorkers);

module.exports = router;

