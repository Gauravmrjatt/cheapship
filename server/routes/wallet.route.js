const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.post('/withdraw', walletController.requestWithdrawal);
router.get('/withdrawals', walletController.getUserWithdrawals);
router.get('/withdrawals/:id', walletController.getWithdrawalById);
router.get('/balance', walletController.getWalletBalance);

module.exports = router;