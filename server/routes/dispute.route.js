const express = require('express');
const router = express.Router();
const disputeController = require('../controllers/dispute.controller');
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');

router.use(auth);

router.get('/weight', disputeController.getWeightDisputes);
router.get('/rto', disputeController.getRTODisputes);
router.get('/weight/:id', disputeController.getWeightDisputeById);
router.get('/rto/:id', disputeController.getRTODisputeById);
router.post('/weight/user', disputeController.userRaiseWeightDispute);

// Admin routes
router.get('/weight/admin/all', admin, disputeController.getAllWeightDisputes);
router.get('/weight/admin/orders', admin, disputeController.searchOrdersForDispute);
router.post('/weight/admin', admin, disputeController.adminCreateWeightDispute);
router.post('/weight', admin, disputeController.createWeightDispute);
router.patch('/weight/:id/resolve', admin, disputeController.resolveWeightDispute);

// RTO Admin routes
router.get('/rto/admin/all', admin, disputeController.getAllRTODisputes);
router.get('/rto/admin/orders', admin, disputeController.searchOrdersForRTO);
router.post('/rto/admin', admin, disputeController.adminCreateRTODispute);

module.exports = router;
