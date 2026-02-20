const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');
const adminController = require('../controllers/admin.controller');

// Public routes (no auth required)
router.post(
  '/forgot-password',
  [check('email', 'Please include a valid email').isEmail()],
  adminController.sendAdminForgotPasswordOtp
);

router.post(
  '/reset-password',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('otp', 'OTP is required').not().isEmpty(),
    check('otp', 'OTP must be 6 digits').isLength({ min: 6, max: 6 }),
    check('newPassword', 'Password must be at least 6 characters').isLength({ min: 6 })
  ],
  adminController.resetAdminPassword
);

// Protect all remaining routes with auth and admin check
router.use(authMiddleware, adminMiddleware);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Users
router.get('/users', adminController.getUsers);
router.patch('/users/:userId/status', adminController.toggleUserStatus);

// Orders
router.get('/orders', adminController.getAllOrders);
router.get('/orders/:id', adminController.getOrderById);

// Transactions
router.get(
  '/transactions',
  [
    check('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    check('pageSize').optional().isInt({ min: 1 }).withMessage('Page size must be a positive integer'),
    check('type').optional().isIn(['ALL', 'CREDIT', 'DEBIT']).withMessage('Invalid transaction type'),
    check('category').optional().isIn(['ALL', 'WALLET_TOPUP', 'ORDER_PAYMENT', 'REFUND', 'COD_REMITTANCE', 'COMMISSION']).withMessage('Invalid transaction category'),
    check('userId').optional().custom((value) => {
      if (value === '' || value === 'ALL') return true;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        throw new Error('Invalid User ID format');
      }
      return true;
    }),
    check('fromDate').optional().isISO8601().withMessage('Invalid fromDate format'),
    check('toDate').optional().isISO8601().withMessage('Invalid toDate format'),
  ],
  adminController.getAllTransactions
);

// Withdrawals
router.get('/withdrawals', adminController.getWithdrawals);
router.post('/withdrawals/:id/process', adminController.processWithdrawal);

// Settings
router.get('/settings/global-commission', adminController.getGlobalSettings);
router.post('/settings/global-commission', adminController.updateGlobalSettings);

// Commission Limits
router.get('/settings/commission-limits', adminController.getCommissionLimits);
router.post('/settings/commission-limits', adminController.updateCommissionLimits);

// Referral Level Setting (max levels only)
router.get('/settings/referral-levels', adminController.getReferralLevelSetting);
router.post('/settings/referral-levels', adminController.updateReferralLevelSetting);
router.get('/network-commission-stats', adminController.getNetworkCommissionStats);

// User Commission Bounds (Admin only)
router.get('/users/:userId/commission-bounds', adminController.getUserCommissionBounds);
router.post('/users/:userId/commission-bounds', adminController.setUserCommissionBounds);

// COD Remittance Management
router.get('/cod-orders', adminController.getAllCODOrders);
router.patch('/orders/:id/remittance', adminController.updateOrderRemittance);

module.exports = router;
