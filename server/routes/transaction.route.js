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
 * /transactions/topup:
 *   post:
 *     summary: Top up wallet balance
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
 *               reference_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Wallet topped up successfully
 */
router.post(
  '/topup',
  [
    check('amount', 'Valid amount is required').isNumeric().custom(v => v > 0)
  ],
  transactionController.topUpWallet
);

module.exports = router;
