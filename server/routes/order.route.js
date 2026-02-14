const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const orderController = require('../controllers/order.controller');

// All routes in this file are protected
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management endpoints
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order_type
 *               - shipment_type
 *               - payment_mode
 *               - total_amount
 *               - pickup_address
 *               - receiver_address
 *             properties:
 *               order_type:
 *                 type: string
 *                 enum: [SURFACE, EXPRESS]
 *               shipment_type:
 *                 type: string
 *                 enum: [DOMESTIC, INTERNATIONAL]
 *               payment_mode:
 *                 type: string
 *                 enum: [PREPAID, COD]
 *               total_amount:
 *                 type: number
 *               pickup_address:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   email:
 *                     type: string
 *                   address:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   pincode:
 *                     type: string
 *               receiver_address:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   email:
 *                     type: string
 *                   address:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   pincode:
 *                     type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  [
    check('order_type', 'Order type is required').isIn(['SURFACE', 'EXPRESS']),
    check('shipment_type', 'Shipment type is required').isIn(['DOMESTIC', 'INTERNATIONAL']),
    check('payment_mode', 'Payment mode is required').isIn(['PREPAID', 'COD']),
    check('total_amount', 'Total amount is required').isNumeric(),
    check('pickup_address', 'Pickup address is required').isObject(),
    check('pickup_address.name', 'Pickup address name is required').not().isEmpty(),
    check('pickup_address.phone', 'Pickup address phone is required').not().isEmpty(),
    check('pickup_address.email', 'Pickup address email must be a valid email').isEmail(),
    check('pickup_address.address', 'Pickup address address is required').not().isEmpty(),
    check('pickup_address.city', 'Pickup address city is required').not().isEmpty(),
    check('pickup_address.state', 'Pickup address state is required').not().isEmpty(),
    check('pickup_address.pincode', 'Pickup address pincode is required').not().isEmpty(),
    check('receiver_address', 'Receiver address is required').isObject(),
    check('receiver_address.name', 'Receiver address name is required').not().isEmpty(),
    check('receiver_address.phone', 'Receiver address phone is required').not().isEmpty(),
    check('receiver_address.email', 'Receiver address email must be a valid email').isEmail(),
    check('receiver_address.address', 'Receiver address address is required').not().isEmpty(),
    check('receiver_address.city', 'Receiver address city is required').not().isEmpty(),
    check('receiver_address.state', 'Receiver address state is required').not().isEmpty(),
    check('receiver_address.pincode', 'Receiver address pincode is required').not().isEmpty(),
  ],
  orderController.createOrder
);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders for a user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: shipment_status
 *         schema:
 *           type: string
 *           enum: [MANIFESTED, IN_TRANSIT, DISPATCHED, DELIVERED, NOT_PICKED, PENDING, CANCELLED, RTO]
 *         description: Filter by shipment status
 *       - in: query
 *         name: order_type
 *         schema:
 *           type: string
 *           enum: [SURFACE, EXPRESS]
 *         description: Filter by order type
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: A list of orders
 *       401:
 *         description: Unauthorized
 */
router.get('/', orderController.getOrders);

/**
 * @swagger
 * /orders/calculate-rates:
 *   get:
 *     summary: Calculate shipping rates using Shiprocket
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pickup_postcode
 *         required: true
 *         schema:
 *           type: string
 *         description: Pincode from where the order will be picked
 *       - in: query
 *         name: delivery_postcode
 *         required: true
 *         schema:
 *           type: string
 *         description: Pincode where the order will be delivered
 *       - in: query
 *         name: weight
 *         required: true
 *         schema:
 *           type: string
 *         description: Weight of the shipment in kg
 *       - in: query
 *         name: cod
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *         description: 1 for Cash on Delivery, 0 for Prepaid
 *       - in: query
 *         name: declared_value
 *         schema:
 *           type: number
 *         description: Declared value of the shipment
 *       - in: query
 *         name: length
 *         schema:
 *           type: number
 *         description: Length of the shipment in cm
 *       - in: query
 *         name: breadth
 *         schema:
 *           type: number
 *         description: Breadth of the shipment in cm
 *       - in: query
 *         name: height
 *         schema:
 *           type: number
 *         description: Height of the shipment in cm
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [Surface, Air]
 *         description: Transport mode
 *     responses:
 *       200:
 *         description: List of available couriers and rates
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Internal server error
 */
router.get(
  '/calculate-rates',
  [
    check('pickup_postcode', 'Pickup postcode is required').not().isEmpty(),
    check('delivery_postcode', 'Delivery postcode is required').not().isEmpty(),
    check('weight', 'Weight is required').not().isEmpty(),
  ],
  orderController.calculateRates
);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get an order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The order ID
 *     responses:
 *       200:
 *         description: The order details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.get('/:id', orderController.getOrderById);

module.exports = router;
