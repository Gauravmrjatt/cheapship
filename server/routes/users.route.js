const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const auth = require('../middleware/auth.middleware'); // Assuming auth middleware exists

router.use(auth);

router.get('/profile', usersController.getProfile);
router.post('/commission-rate', usersController.updateCommissionRate);
router.post('/default-pickup', usersController.setDefaultReferredPickup);

// Security Deposits
router.get('/security-deposits', usersController.getUserSecurityDeposits);

module.exports = router;
