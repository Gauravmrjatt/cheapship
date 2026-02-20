const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/auth.controller');
const kycController = require('../controllers/kyc.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user details
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user details
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authMiddleware, authController.getMe);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user (legacy - without OTP)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - mobile
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               mobile:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request
 */
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('mobile', 'Mobile number is required').not().isEmpty()
  ],
  authController.register
);

/**
 * @swagger
 * /auth/send-registration-otp:
 *   post:
 *     summary: Send OTP for registration
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - mobile
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               mobile:
 *                 type: string
 *               referred_by:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Bad request
 *       429:
 *         description: Too many requests
 */
router.post(
  '/send-registration-otp',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('mobile', 'Mobile number is required').not().isEmpty()
  ],
  authController.sendRegistrationOtp
);

/**
 * @swagger
 * /auth/verify-registration-otp:
 *   post:
 *     summary: Verify OTP and complete registration
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid or expired OTP
 */
router.post(
  '/verify-registration-otp',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('otp', 'OTP is required').not().isEmpty(),
    check('otp', 'OTP must be 6 digits').isLength({ min: 6, max: 6 })
  ],
  authController.verifyRegistrationOtp
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user with password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       400:
 *         description: Invalid credentials
 */
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  authController.login
);

/**
 * @swagger
 * /auth/send-login-otp:
 *   post:
 *     summary: Send OTP for login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               mobile:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: User not found
 *       429:
 *         description: Too many requests
 */
router.post(
  '/send-login-otp',
  [
    check('email')
      .if((value) => value) // validate only if provided
      .isEmail()
      .withMessage('Please include a valid email'),

    check('mobile')
      .if((value) => value) // validate only if provided
      .notEmpty()
      .withMessage('Mobile cannot be empty'),

    // Require at least one
    check().custom((_, { req }) => {
      const { email, mobile } = req.body;

      if (!email && !mobile) {
        throw new Error('Either email or mobile is required');
      }

      return true;
    }),
  ],
  authController.sendLoginOtp
);

/**
 * @swagger
 * /auth/verify-login-otp:
 *   post:
 *     summary: Verify OTP and complete login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       400:
 *         description: Invalid or expired OTP
 */
router.post(
  '/verify-login-otp',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('otp', 'OTP is required').not().isEmpty(),
    check('otp', 'OTP must be 6 digits').isLength({ min: 6, max: 6 })
  ],
  authController.verifyLoginOtp
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Send OTP for password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP sent if account exists
 *       400:
 *         description: Bad request
 *       429:
 *         description: Too many requests
 */
router.post(
  '/forgot-password',
  [check('email', 'Please include a valid email').isEmail()],
  authController.forgotPassword
);

/**
 * @swagger
 * /auth/reset-password:
 *   put:
 *     summary: Reset password with OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired OTP
 */
router.put(
  '/reset-password',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('otp', 'OTP is required').not().isEmpty(),
    check('otp', 'OTP must be 6 digits').isLength({ min: 6, max: 6 }),
    check('newPassword', 'Password must be at least 6 characters').isLength({ min: 6 })
  ],
  authController.resetPassword
);

router.get('/kyc', authMiddleware, kycController.getKycStatus);
router.put(
  '/kyc',
  authMiddleware,
  [
    check('pan_number').optional().isLength({ min: 10, max: 10 }).withMessage('PAN must be 10 characters'),
    check('aadhaar_number').optional().isLength({ min: 12, max: 12 }).withMessage('Aadhaar must be 12 digits'),
    check('gst_number').optional().isLength({ min: 15, max: 15 }).withMessage('GST must be 15 characters')
  ],
  kycController.updateKyc
);

module.exports = router;
