const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const addressController = require('../controllers/address.controller');

// All routes are protected
router.use(authMiddleware);

router.get('/', addressController.getAddresses);

router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('phone', 'Phone is required').not().isEmpty(),
    check('complete_address', 'Address is required').not().isEmpty(),
    check('city', 'City is required').not().isEmpty(),
    check('state', 'State is required').not().isEmpty(),
    check('pincode', 'Pincode is required').not().isEmpty(),
  ],
  addressController.createAddress
);

router.put('/:id', addressController.updateAddress);

router.delete('/:id', addressController.deleteAddress);

module.exports = router;
