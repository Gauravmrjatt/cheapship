const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const supportController = require('../controllers/support.controller');

router.use(authMiddleware);

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
