const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');
const adminController = require('../controllers/admin.controller');

// Protect all routes with auth and admin check
router.use(authMiddleware, adminMiddleware);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Users
router.get('/users', adminController.getUsers);
router.patch('/users/:userId/status', adminController.toggleUserStatus);

// Orders
router.get('/orders', adminController.getAllOrders);

// Withdrawals
router.get('/withdrawals', adminController.getWithdrawals);
router.post('/withdrawals/:id/process', adminController.processWithdrawal);

// Settings
router.get('/settings/global-commission', adminController.getGlobalSettings);
router.post('/settings/global-commission', adminController.updateGlobalSettings);

module.exports = router;
