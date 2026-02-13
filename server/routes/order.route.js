const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const orderController = require('../controllers/order.controller');

// All routes in this file are protected
router.use(authMiddleware);

// @route   POST api/v1/orders
// @desc    Create an order
// @access  Private
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
    check('pickup_address.address', 'Pickup address address is required').not().isEmpty(),
    check('pickup_address.city', 'Pickup address city is required').not().isEmpty(),
    check('pickup_address.state', 'Pickup address state is required').not().isEmpty(),
    check('pickup_address.pincode', 'Pickup address pincode is required').not().isEmpty(),
    check('receiver_address', 'Receiver address is required').isObject(),
    check('receiver_address.name', 'Receiver address name is required').not().isEmpty(),
    check('receiver_address.phone', 'Receiver address phone is required').not().isEmpty(),
    check('receiver_address.address', 'Receiver address address is required').not().isEmpty(),
    check('receiver_address.city', 'Receiver address city is required').not().isEmpty(),
    check('receiver_address.state', 'Receiver address state is required').not().isEmpty(),
    check('receiver_address.pincode', 'Receiver address pincode is required').not().isEmpty(),
  ],
  orderController.createOrder
);

// @route   GET api/v1/orders
// @desc    Get all orders for a user with pagination and filtering
// @access  Private
router.get('/', orderController.getOrders);

// @route   GET api/v1/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', orderController.getOrderById);

module.exports = router;
