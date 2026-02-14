const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const dashboardController = require('../controllers/dashboard.controller');

// All routes in this file are protected
router.use(authMiddleware);

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Get dashboard statistics for the authenticated user
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deliveredOrders:
 *                   type: integer
 *                 inTransitOrders:
 *                   type: integer
 *                 dispatchedOrders:
 *                   type: integer
 *                 manifestedOrders:
 *                   type: integer
 *                 rtoInTransitOrders:
 *                   type: integer
 *                 rtoOrders:
 *                   type: integer
 *                 totalOrders:
 *                   type: integer
 *                 lastMonthOrders:
 *                   type: integer
 *                 totalWeightShipped:
 *                   type: string
 *                 avgDeliveryTime:
 *                   type: string
 *                 deliverySuccessRate:
 *                   type: string
 *                 returnRate:
 *                   type: string
 *                 cancelledOrder:
 *                   type: integer
 *                 weightDisputedOrders:
 *                   type: integer
 *                 monthlyGrowth:
 *                   type: string
 *                 actionRequired:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.get('/', dashboardController.getDashboardStats);

module.exports = router;
