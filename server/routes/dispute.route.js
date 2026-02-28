const express = require('express');
const router = express.Router();
const disputeController = require('../controllers/dispute.controller');
const auth = require('../middleware/auth.middleware'); // Assuming this exists
const admin = require('../middleware/admin.middleware'); // Assuming this exists for admin routes

router.use(auth);

router.get('/weight', disputeController.getWeightDisputes);
router.get('/rto', disputeController.getRTODisputes);
router.post('/weight/user', disputeController.userRaiseWeightDispute);

// Admin routes for creating and resolving disputes
router.post('/weight', admin, disputeController.createWeightDispute);
router.patch('/weight/:id/resolve', admin, disputeController.resolveWeightDispute);

module.exports = router;
