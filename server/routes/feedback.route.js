const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');

router.use(auth);

router.post('/', feedbackController.submitFeedback);
router.get('/', admin, feedbackController.getFeedbacks);
router.get('/:id', admin, feedbackController.getFeedbackById);

module.exports = router;
