const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const franchiseController = require('../controllers/franchise.controller');

/**
 * @swagger
 * tags:
 *   name: Franchise
 *   description: Franchise management endpoints
 */

/**
 * @swagger
 * /franchise/me:
 *   get:
 *     summary: Get current user's referral code and link
 *     tags: [Franchise]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User referral code details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/me', authMiddleware, franchiseController.getMyReferralCode);

/**
 * @swagger
 * /franchise/list:
 *   get:
 *     summary: Get all franchises (users referred by current user)
 *     tags: [Franchise]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of franchises
 *       401:
 *         description: Unauthorized
 */
router.get('/list', authMiddleware, franchiseController.getFranchises);

/**
 * @swagger
 * /franchise/{franchiseId}:
 *   put:
 *     summary: Update franchise commission rate
 *     tags: [Franchise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: franchiseId
 *         required: true
 *         schema:
 *           type: string
 *         description: The franchise user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - commission_rate
 *             properties:
 *               commission_rate:
 *                 type: number
 *                 description: Commission rate percentage (0-100)
 *     responses:
 *       200:
 *         description: Franchise updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Franchise not found
 */
router.put(
  '/:franchiseId',
  [
    authMiddleware,
    check('commission_rate', 'Commission rate is required').isNumeric(),
  ],
  franchiseController.updateFranchiseRate
);

/**
 * @swagger
 * /franchise/{franchiseId}/orders:
 *   get:
 *     summary: Get orders for a specific franchise
 *     tags: [Franchise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: franchiseId
 *         required: true
 *         schema:
 *           type: string
 *         description: The franchise user ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: shipment_status
 *         schema:
 *           type: string
 *         description: Filter by shipment status
 *     responses:
 *       200:
 *         description: List of orders
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Franchise not found
 */
router.get('/:franchiseId/orders', authMiddleware, franchiseController.getFranchiseOrders);

/**
 * @swagger
 * /franchise/{franchiseId}/withdraw:
 *   post:
 *     summary: Withdraw commission earned from a specific franchise
 *     tags: [Franchise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: franchiseId
 *         required: true
 *         schema:
 *           type: string
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
 *         description: Withdrawal request submitted
 */
router.post(
  '/:franchiseId/withdraw',
  [
    authMiddleware,
    check('amount', 'Valid amount is required').isNumeric().custom(val => val > 0),
  ],
  franchiseController.withdrawCommission
);

/**
 * @swagger
 * /franchise/verify:
 *   get:
 *     summary: Verify a referral code (public endpoint)
 *     tags: [Franchise]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: The referral code to verify
 *     responses:
 *       200:
 *         description: Verification result
 *       400:
 *         description: Bad request
 */
router.get('/verify', franchiseController.verifyReferralCode);

/**
 * @swagger
 * /franchise/my-referral-commissions:
 *   get:
 *     summary: Get current user's multi-level referral commissions
 *     tags: [Franchise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, pending, withdrawn]
 *         description: Filter by commission status
 *     responses:
 *       200:
 *         description: Referral commissions list
 *       401:
 *         description: Unauthorized
 */
router.get('/my-referral-commissions', authMiddleware, franchiseController.getMyReferralCommissions);

/**
 * @swagger
 * /franchise/withdraw-referral-commissions:
 *   post:
 *     summary: Withdraw multi-level referral commissions
 *     tags: [Franchise]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Withdrawal request submitted
 *       400:
 *         description: No withdrawable commissions
 *       401:
 *         description: Unauthorized
 */
router.post('/withdraw-referral-commissions', authMiddleware, franchiseController.withdrawReferralCommissions);

/**
 * @swagger
 * /franchise/referral-network-stats:
 *   get:
 *     summary: Get referral network stats with multi-level commissions
 *     tags: [Franchise]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Network stats
 *       401:
 *         description: Unauthorized
 */
router.get('/referral-network-stats', authMiddleware, franchiseController.getReferralNetworkStats);

module.exports = router;
