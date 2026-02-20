const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const otpService = require('../services/otp.service');
const emailService = require('../services/email.service');

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, mobile, referred_by, franchise_type, franchise_address, franchise_pincode, franchise_city, franchise_state } = req.body;
  const prisma = req.app.locals.prisma;

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { mobile: mobile }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or mobile already exists.' });
    }

    const generateRefererCode = () => {
      const prefix = 'VXVF';
      const random = Math.random().toString(36).substr(2, 6).toUpperCase();
      return `${prefix}${random}`;
    };

    const hashedPassword = await bcrypt.hash(password, 10);
    let refererCode = generateRefererCode();

    const existingRefererCode = await prisma.user.findUnique({
      where: { referer_code: refererCode }
    });
    if (existingRefererCode) {
      refererCode = generateRefererCode();
    }

    let referredByUser = null;
    if (referred_by) {
      referredByUser = await prisma.user.findUnique({
        where: { referer_code: referred_by }
      });
      
      if (!referredByUser) {
        return res.status(400).json({ message: 'Invalid referral code.' });
      }
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: hashedPassword,
        mobile,
        referer_code: refererCode,
        referred_by: referred_by || null,
        franchise_type: franchise_type || null,
        franchise_address: franchise_address || null,
        franchise_pincode: franchise_pincode || null,
        franchise_city: franchise_city || null,
        franchise_state: franchise_state || null,
        commission_rate: referred_by ? 5.00 : null,
      }
    });

    const publicUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      referer_code: user.referer_code,
      referred_by: user.referred_by,
      franchise_type: user.franchise_type,
      is_active: user.is_active,
      user_type: user.user_type,
      wallet_balance: user.wallet_balance,
      kyc_status: user.kyc_status,
      created_at: user.created_at
    };

    res.status(201).json(publicUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  const prisma = req.app.locals.prisma;

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5d' },
      (err, token) => {
        if (err) throw err;
        const publicUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          referer_code: user.referer_code,
          referred_by: user.referred_by,
          franchise_type: user.franchise_type,
          is_active: user.is_active,
          user_type: user.user_type,
          wallet_balance: user.wallet_balance,
          kyc_status: user.kyc_status,
          created_at: user.created_at
        };
        res.json({ token, user: publicUser });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const sendRegistrationOtp = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email: rawEmail, mobile, password, referred_by, franchise_type, franchise_address, franchise_pincode, franchise_city, franchise_state } = req.body;
  const email = rawEmail?.trim().toLowerCase();
  const prisma = req.app.locals.prisma;

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { mobile: mobile }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or mobile already exists.' });
    }

    const rateLimitCheck = await otpService.checkRateLimit(prisma, email, 'registration');
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({ 
        message: rateLimitCheck.message,
        retryAfter: rateLimitCheck.retryAfter 
      });
    }

    if (referred_by) {
      const referredByUser = await prisma.user.findUnique({
        where: { referer_code: referred_by }
      });
      
      if (!referredByUser) {
        return res.status(400).json({ message: 'Invalid referral code.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await otpService.storeTempRegistrationData(prisma, email, {
      name,
      mobile,
      password_hash: hashedPassword,
      referred_by,
      franchise_type,
      franchise_address,
      franchise_pincode,
      franchise_city,
      franchise_state,
      commission_rate: referred_by ? 5.00 : null,
    });

    const otp = otpService.generateOtp();
    await otpService.createOtpRecord(prisma, email, mobile, otp, 'registration');

    await emailService.sendOtpEmail(email, otp, 'registration');

    res.status(200).json({ 
      message: 'OTP sent to your email address.',
      expiresIn: otpService.OTP_EXPIRY_MINUTES * 60
    });
  } catch (error) {
    console.error('Send registration OTP error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const verifyRegistrationOtp = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email: rawEmail, otp } = req.body;
  const email = rawEmail?.trim().toLowerCase();
  const prisma = req.app.locals.prisma;

  try {
    const verifyResult = await otpService.verifyOtp(prisma, email, otp, 'registration');
    
    if (!verifyResult.valid) {
      return res.status(400).json({ message: verifyResult.error });
    }

    const tempData = await otpService.getTempRegistrationData(prisma, email);
    
    if (!tempData) {
      return res.status(400).json({ message: 'Registration data not found. Please start registration again.' });
    }

    const generateRefererCode = () => {
      const prefix = 'VXVF';
      const random = Math.random().toString(36).substr(2, 6).toUpperCase();
      return `${prefix}${random}`;
    };

    let refererCode = generateRefererCode();
    const existingRefererCode = await prisma.user.findUnique({
      where: { referer_code: refererCode }
    });
    if (existingRefererCode) {
      refererCode = generateRefererCode();
    }

    const user = await prisma.user.create({
      data: {
        name: tempData.name,
        email: tempData.email,
        password_hash: tempData.password_hash,
        mobile: tempData.mobile,
        referer_code: refererCode,
        referred_by: tempData.referred_by,
        franchise_type: tempData.franchise_type,
        franchise_address: tempData.franchise_address,
        franchise_pincode: tempData.franchise_pincode,
        franchise_city: tempData.franchise_city,
        franchise_state: tempData.franchise_state,
        commission_rate: tempData.commission_rate,
      }
    });

    await otpService.deleteTempRegistrationData(prisma, email);

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5d' },
      (err, token) => {
        if (err) throw err;
        const publicUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          referer_code: user.referer_code,
          referred_by: user.referred_by,
          franchise_type: user.franchise_type,
          is_active: user.is_active,
          user_type: user.user_type,
          wallet_balance: user.wallet_balance,
          created_at: user.created_at
        };
        res.status(201).json({ token, user: publicUser });
      }
    );
  } catch (error) {
    console.error('Verify registration OTP error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const sendLoginOtp = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email: rawEmail, mobile } = req.body;
  const email = rawEmail?.trim().toLowerCase();
  const prisma = req.app.locals.prisma;

  try {
    let user = null;
    let userEmail = email;

    if (email) {
      user = await prisma.user.findUnique({
        where: { email }
      });
      userEmail = email;
    } else if (mobile) {
      user = await prisma.user.findUnique({
        where: { mobile }
      });
      if (user) {
        userEmail = user.email;
      }
    }

    if (!user) {
      return res.status(400).json({ message: 'User not found. Please check your email or mobile number.' });
    }

    if (!user.is_active) {
      return res.status(400).json({ message: 'Your account is deactivated. Please contact support.' });
    }

    const rateLimitCheck = await otpService.checkRateLimit(prisma, userEmail, 'login');
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({ 
        message: rateLimitCheck.message,
        retryAfter: rateLimitCheck.retryAfter 
      });
    }

    const otp = otpService.generateOtp();
    await otpService.createOtpRecord(prisma, userEmail, user.mobile, otp, 'login');
     console.log(otp)
    await emailService.sendOtpEmail(userEmail, otp, 'login');

    res.status(200).json({ 
      message: 'OTP sent to your email address.',
      expiresIn: otpService.OTP_EXPIRY_MINUTES * 60,
      // email: userEmail.replace(/(.{2}).*(@.*)/, '$1***$2')
      email: userEmail
    });
  } catch (error) {
    console.error('Send login OTP error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const verifyLoginOtp = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email: rawEmail, otp } = req.body;
  const email = rawEmail?.trim().toLowerCase();
  const prisma = req.app.locals.prisma;

  try {
    const verifyResult = await otpService.verifyOtp(prisma, email, otp, 'login');
    
    if (!verifyResult.valid) {
      return res.status(400).json({ message: verifyResult.error });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ message: 'User not found.' });
    }

    if (!user.is_active) {
      return res.status(400).json({ message: 'Your account is deactivated. Please contact support.' });
    }

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5d' },
      (err, token) => {
        if (err) throw err;
        const publicUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          referer_code: user.referer_code,
          referred_by: user.referred_by,
          franchise_type: user.franchise_type,
          is_active: user.is_active,
          user_type: user.user_type,
          wallet_balance: user.wallet_balance,
          kyc_status: user.kyc_status,
          created_at: user.created_at
        };
        res.json({ token, user: publicUser });
      }
    );
  } catch (error) {
    console.error('Verify login OTP error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email: rawEmail } = req.body;
  const email = rawEmail?.trim().toLowerCase();
  const prisma = req.app.locals.prisma;

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(200).json({ 
        message: 'If an account with this email exists, an OTP has been sent.',
        expiresIn: otpService.OTP_EXPIRY_MINUTES * 60
      });
    }

    const rateLimitCheck = await otpService.checkRateLimit(prisma, email, 'forgot_password');
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({ 
        message: rateLimitCheck.message,
        retryAfter: rateLimitCheck.retryAfter 
      });
    }

    const otp = otpService.generateOtp();
    await otpService.createOtpRecord(prisma, email, user.mobile, otp, 'forgot_password');

    await emailService.sendOtpEmail(email, otp, 'forgot_password');

    res.status(200).json({ 
      message: 'If an account with this email exists, an OTP has been sent.',
      expiresIn: otpService.OTP_EXPIRY_MINUTES * 60
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email: rawEmail, otp, newPassword } = req.body;
  const email = rawEmail?.trim().toLowerCase();
  const prisma = req.app.locals.prisma;

  try {
    const verifyResult = await otpService.verifyOtp(prisma, email, otp, 'forgot_password');
    
    if (!verifyResult.valid) {
      return res.status(400).json({ message: verifyResult.error });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ message: 'User not found.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: hashedPassword }
    });

    res.status(200).json({ message: 'Password reset successfully. Please login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getMe = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        wallet_balance: true,
        user_type: true,
        referer_code: true,
        referred_by: true,
        commission_rate: true,
        franchise_type: true,
        is_active: true,
        kyc_status: true,
        created_at: true,
        updated_at: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  register,
  login,
  sendRegistrationOtp,
  verifyRegistrationOtp,
  sendLoginOtp,
  verifyLoginOtp,
  forgotPassword,
  resetPassword,
  getMe
};
