const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');
const supportController = require('../controllers/support.controller');

router.use(authMiddleware);

router.get('/tickets/admin/all', adminMiddleware, supportController.getAllTickets);
router.get('/tickets/admin/:id', adminMiddleware, supportController.getTicketById);
router.patch('/tickets/admin/:id/status', adminMiddleware, supportController.updateTicketStatus);

router.post(
    '/tickets',
    [
        check('subject', 'Subject is required').not().isEmpty(),
        check('message', 'Message is required').not().isEmpty(),
    ],
    supportController.createTicket
);

router.get('/tickets', supportController.getMyTickets);

module.exports = router;
