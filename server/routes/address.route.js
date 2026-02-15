const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const addressController = require('../controllers/address.controller');

// All routes are protected
router.use(authMiddleware);

router.get('/', addressController.getAddresses);
router.get('/shiprocket-pickup', addressController.getShiprocketPickupLocations);

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

router.post(
  '/shiprocket-pickup',
  [
    check('pickup_location', 'Pickup location nickname is required').not().isEmpty(),
    check('name', 'Shipper name is required').not().isEmpty(),
    check('email', 'Email is required').isEmail(),
    check('phone', 'Phone is required').not().isEmpty(),
    check('address', 'Address is required').not().isEmpty(),
    check('city', 'City is required').not().isEmpty(),
    check('state', 'State is required').not().isEmpty(),
    check('country', 'Country is required').not().isEmpty(),
    check('pin_code', 'Pincode is required').not().isEmpty(),
  ],
  addressController.addShiprocketPickupLocation
);

router.put('/:id', addressController.updateAddress);

router.delete('/:id', addressController.deleteAddress);

module.exports = router;
