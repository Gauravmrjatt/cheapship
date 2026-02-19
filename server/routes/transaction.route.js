const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const transactionController = require('../controllers/transaction.controller');

// All routes are protected
router.use(authMiddleware);

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Get user transactions
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [CREDIT, DEBIT]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SUCCESS, FAILED]
 *     responses:
 *       200:
 *         description: List of transactions
 */
router.get('/', transactionController.getTransactions);

/**
 * @swagger
 * /transactions/razorpay/order:
 *   post:
 *     summary: Create Razorpay order
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Razorpay order created
 */
router.post(
  '/razorpay/order',
  [
    check('amount', 'Valid amount is required').isNumeric().custom(v => v > 0)
  ],
  transactionController.createRazorpayOrder
);

/**
 * @swagger
 * /transactions/razorpay/verify:
 *   post:
 *     summary: Verify Razorpay payment
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - razorpay_order_id
 *               - razorpay_payment_id
 *               - razorpay_signature
 *               - amount
 *     responses:
 *       200:
 *         description: Payment verified
 */
router.post('/razorpay/verify', transactionController.verifyRazorpayPayment);

module.exports = router;
