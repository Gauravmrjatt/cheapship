const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const otpService = require('../services/otp.service');
const emailService = require('../services/email.service');
const firebaseService = require('../services/firebase.service');

// Helper to get referrer details including custom settings
const getReferrerDetails = async (prisma, refererCode) => {
  if (!refererCode) return null;
  return await prisma.user.findUnique({
    where: { referer_code: refererCode },
    select: { id: true, commission_rate: true, min_commission_rate: true, max_commission_rate: true, default_referred_pickup_id: true }
  });
};

// Helper to get global commission limits from system settings
const getGlobalCommissionLimits = async (prisma) => {
  const [minSetting, maxSetting] = await prisma.$transaction([
    prisma.systemSetting.findUnique({ where: { key: 'min_commission_rate' } }),
    prisma.systemSetting.findUnique({ where: { key: 'max_commission_rate' } })
  ]);
  console.group('Commission Limits');
  console.log('minSetting:', minSetting);
  console.log('maxSetting:', maxSetting);
  console.groupEnd('Commission Limits');
  return {
    min_rate: minSetting ? parseFloat(minSetting.value) : 0,
    max_rate: maxSetting ? parseFloat(maxSetting.value) : 100
  };
};

// Helper to auto-assign pickup address from referrer
const autoAssignPickupAddress = async (prisma, newUserId, referrer) => {
  if (!referrer || !referrer.default_referred_pickup_id) return;

  const templateAddress = await prisma.address.findUnique({
    where: { id: referrer.default_referred_pickup_id }
  });

  if (templateAddress) {
    await prisma.address.create({
      data: {
        user_id: newUserId,
        name: templateAddress.name,
        phone: templateAddress.phone,
        email: templateAddress.email,
        complete_address: templateAddress.complete_address,
        city: templateAddress.city,
        state: templateAddress.state,
        pincode: templateAddress.pincode,
        country: templateAddress.country,
        address_label: templateAddress.address_label || 'Pickup Address',
        is_shiprocket_pickup: templateAddress.is_shiprocket_pickup,
        pickup_nickname: templateAddress.pickup_nickname || 'Auto-Assigned',
        is_default: true
      }
    });
  }
};

const checkMobileExists = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { mobile } = req.body;
  const prisma = req.app.locals.prisma;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { mobile }
    });

    if (existingUser) {
      return res.status(200).json({ exists: true, message: 'User with this mobile number already exists.' });
    }

    return res.status(200).json({ exists: false, message: 'Mobile number is available.' });
  } catch (error) {
    console.error('Check mobile error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email: rawEmail, password, mobile, referred_by, franchise_type, franchise_address, franchise_pincode, franchise_city, franchise_state } = req.body;
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
      referredByUser = await getReferrerDetails(prisma, referred_by);

      if (!referredByUser) {
        return res.status(400).json({ message: 'Invalid referral code.' });
      }
    }

    const globalCommissionLimits = await getGlobalCommissionLimits(prisma);

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
        commission_rate: referredByUser ? (referredByUser.commission_rate || 5.00) : null,
        min_commission_rate: parseFloat(globalCommissionLimits.min_rate),
        max_commission_rate: parseFloat(globalCommissionLimits.max_rate),
      }
    });

    // Auto-assign pickup address if referrer has one
    // await autoAssignPickupAddress(prisma, user.id, referredByUser);

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

// Helper to log user login history
const logLoginHistory = async (prisma, userId, req, status = 'SUCCESS') => {
  try {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Simple device info from user agent
    let deviceInfo = 'Unknown Device';
    if (userAgent) {
      if (userAgent.includes('Mobi')) deviceInfo = 'Mobile Device';
      else if (userAgent.includes('Tablet')) deviceInfo = 'Tablet Device';
      else deviceInfo = 'Desktop Device';
    }

    await prisma.userLoginHistory.create({
      data: {
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent,
        device_info: deviceInfo,
        login_status: status
      }
    });
  } catch (error) {
    console.error('Error logging login history:', error);
  }
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email: rawEmail, password } = req.body;
  const email = rawEmail?.trim().toLowerCase();
  const prisma = req.app.locals.prisma;

  try {
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive'
        }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    if (!user.is_active) {
      return res.status(400).json({ message: 'Your account is deactivated. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      // Log failed attempt
      await logLoginHistory(prisma, user.id, req, 'FAILED');
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const payload = {
      user: {
        id: user.id
      }
    };

    // Log success
    await logLoginHistory(prisma, user.id, req, 'SUCCESS');

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

    let referredByUser = null;
    if (referred_by) {
      referredByUser = await getReferrerDetails(prisma, referred_by);

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
      commission_rate: referredByUser ? (referredByUser.commission_rate || 5.00) : null,
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

    const referredByUser = await getReferrerDetails(prisma, tempData.referred_by);
    const globalCommissionLimits = await getGlobalCommissionLimits(prisma);

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
        commission_rate: tempData.commission_rate || (referredByUser ? (referredByUser.commission_rate || 5.00) : null),
        min_commission_rate: globalCommissionLimits.min_rate,
        max_commission_rate: globalCommissionLimits.max_rate,
      }
    });

    // Auto-assign pickup address if referrer has one
    await autoAssignPickupAddress(prisma, user.id, referredByUser);

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
  const globalCommissionLimits = await getGlobalCommissionLimits(prisma);
  try {
    let user = null;
    let userEmail = email;

    if (email) {
      user = await prisma.user.findFirst({
        where: {
          email: {
            equals: email,
            mode: 'insensitive'
          }
        }
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

    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive'
        }
      }
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

    // Log login history
    await logLoginHistory(prisma, user.id, req, 'SUCCESS');

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

  const { email: rawEmail, mobile: rawMobile } = req.body;
  const email = rawEmail?.trim().toLowerCase();
  const mobile = rawMobile?.trim();
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
      // Fake success to prevent user enumeration
      return res.status(200).json({
        message: 'If an account with this email/mobile exists, an OTP has been sent.',
        expiresIn: otpService.OTP_EXPIRY_MINUTES * 60
      });
    }

    const rateLimitCheck = await otpService.checkRateLimit(prisma, userEmail, 'forgot_password');
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        message: rateLimitCheck.message,
        retryAfter: rateLimitCheck.retryAfter
      });
    }

    const otp = otpService.generateOtp();
    await otpService.createOtpRecord(prisma, userEmail, user.mobile, otp, 'forgot_password');

    // Send OTP to linked email (Vyom logic: mobile numbers trigger OTP to linked email)
    await emailService.sendOtpEmail(userEmail, otp, 'forgot_password');

    res.status(200).json({
      message: 'If an account with this email/mobile exists, an OTP has been sent.',
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

const initMobileRegistration = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { mobile, email } = req.body;
  const prisma = req.app.locals.prisma;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { mobile }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this mobile number already exists.' });
    }

    // Check if OTP was already verified for this session/mobile to enforce one-time OTP
    const recentlyVerified = await prisma.otpVerification.findFirst({
      where: {
        purpose: 'registration_mobile',
        mobile: mobile,
        verified: true,
        created_at: {
          gte: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes window
        }
      },
      orderBy: { created_at: 'desc' }
    });

    if (recentlyVerified) {
      return res.status(200).json({
        message: 'Mobile number already verified recently.',
        alreadyVerified: true
      });
    }

    const placeholderEmail = email ? email : `${mobile}@temp.local`;

    const rateLimitCheck = await otpService.checkRateLimit(prisma, placeholderEmail, 'registration_mobile');
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        message: rateLimitCheck.message,
        retryAfter: rateLimitCheck.retryAfter
      });
    }

    const otp = otpService.generateOtp();
    // Using a placeholder email because schema requires email
    await otpService.createOtpRecord(prisma, placeholderEmail, mobile, otp, 'registration_mobile');

    await otpService.sendSmsOtp(mobile, otp, 'registration_mobile');
    console.log('OTP sent to mobile:', mobile, otp);
    res.status(200).json({
      message: 'OTP sent to your mobile number.',
      expiresIn: otpService.OTP_EXPIRY_MINUTES * 60
    });
  } catch (error) {
    console.error('Init mobile registration error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const verifyMobileRegistration = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { mobile, otp } = req.body;
  const prisma = req.app.locals.prisma;

  try {
    const verifyResult = await otpService.verifyOtp(prisma, `${mobile}@temp.local`, otp, 'registration_mobile');

    if (!verifyResult.valid) {
      return res.status(400).json({ message: verifyResult.error });
    }

    // Generate a temporary token to prove mobile verification
    const verificationToken = jwt.sign(
      { mobile, verified: true },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    res.status(200).json({
      message: 'Mobile verified successfully.',
      verificationToken
    });
  } catch (error) {
    console.error('Verify mobile registration error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const completeRegistration = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { verificationToken, mobile, name, email: rawEmail, password, referred_by, franchise_type, franchise_address, franchise_pincode, franchise_city, franchise_state, terms_accepted } = req.body;
  const email = rawEmail?.trim().toLowerCase();
  const prisma = req.app.locals.prisma;

  try {
    // Verify the mobile token
    let decoded;
    let firebaseVerified = false;

    // Check if it's a Firebase idToken (starts with "eyJ")
    if (verificationToken && verificationToken.startsWith('eyJ')) {
      const firebaseResult = await firebaseService.verifyPhoneNumber(verificationToken);
      if (firebaseResult.valid) {
        decoded = { mobile: firebaseResult.phoneNumber, verified: true };
        firebaseVerified = true;
      } else {
        return res.status(400).json({ message: 'Invalid Firebase token.' });
      }
    } else if (verificationToken === "skipped_verification") {
      // Find if this mobile was verified in the last 30 minutes
      const recentlyVerified = await prisma.otpVerification.findFirst({
        where: {
          purpose: 'registration_mobile',
          mobile: mobile,
          verified: true,
          created_at: {
            gte: new Date(Date.now() - 30 * 60 * 1000)
          }
        },
        orderBy: { created_at: 'desc' }
      });

      if (!recentlyVerified) {
        return res.status(400).json({ message: 'Mobile verification expired or not found.' });
      }
      decoded = { mobile: recentlyVerified.mobile, verified: true };
    } else {
      try {
        decoded = jwt.verify(verificationToken, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(400).json({ message: 'Invalid or expired mobile verification token.' });
      }
    }

    if (!decoded.mobile || !decoded.verified) {
      return res.status(400).json({ message: 'Mobile verification failed.' });
    }

    const verifiedMobile = decoded.mobile;

    // Double check user doesn't exist
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { mobile: verifiedMobile }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or mobile already exists.' });
    }

    if (terms_accepted !== true && terms_accepted !== 'true') {
      return res.status(400).json({ message: 'You must accept the terms and conditions.' });
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
      referredByUser = await getReferrerDetails(prisma, referred_by);

      if (!referredByUser) {
        return res.status(400).json({ message: 'Invalid referral code.' });
      }
    }

    const globalCommissionLimits = await getGlobalCommissionLimits(prisma);

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
        commission_rate: referredByUser ? (referredByUser.commission_rate || 5.00) : null,
        min_commission_rate: globalCommissionLimits.min_rate,
        max_commission_rate: globalCommissionLimits.max_rate,
      }
    });

    // Auto-assign pickup address if referrer has one
    await autoAssignPickupAddress(prisma, user.id, referredByUser);

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
        res.status(201).json({ token, user: publicUser });
      }
    );
  } catch (error) {
    console.error('Complete registration error:', error);
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
        security_deposit: true,
        upi_id: true,
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

const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email: rawEmail, mobile, upi_id } = req.body;
  const email = rawEmail?.trim().toLowerCase();
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    // Check if email or mobile is already taken by another user
    if (email || mobile) {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            ...(email ? [{
              email: {
                equals: email,
                mode: 'insensitive'
              }
            }] : []),
            ...(mobile ? [{ mobile }] : [])
          ],
          NOT: { id: userId }
        }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Email or mobile number already in use.' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(mobile && { mobile }),
        ...(upi_id !== undefined && { upi_id })
      },
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
        security_deposit: true,
        upi_id: true,
        created_at: true,
        updated_at: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getLoginHistory = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    const history = await prisma.userLoginHistory.findMany({
      where: { user_id: userId },
      orderBy: { login_at: 'desc' },
      take: 20
    });

    res.json(history);
  } catch (error) {
    console.error('Get login history error:', error);
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
  getMe,
  updateProfile,
  initMobileRegistration,
  verifyMobileRegistration,
  completeRegistration,
  getLoginHistory,
  checkMobileExists
};
