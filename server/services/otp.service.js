const crypto = require('crypto');

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
const OTP_RATE_LIMIT_WINDOW_MINUTES = 15;
const OTP_RATE_LIMIT_MAX_ATTEMPTS = 3;

const otpStore = new Map();

const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const getOtpKey = (email, purpose) => `${email}:${purpose}`;

const getRateLimitKey = (email, purpose) => `ratelimit:${email}:${purpose}`;

const createOtpRecord = async (prisma, email, mobile, otp, purpose) => {
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  
  await prisma.otpVerification.deleteMany({
    where: {
      email,
      purpose,
      verified: false,
    },
  });

  const otpRecord = await prisma.otpVerification.create({
    data: {
      email,
      mobile,
      otp_code: otp,
      purpose,
      expires_at: expiresAt,
    },
  });

  return otpRecord;
};

const storeTempRegistrationData = async (prisma, email, data) => {
  const tempDataRecord = await prisma.tempRegistrationData.create({
    data: {
      email,
      name: data.name,
      mobile: data.mobile,
      password_hash: data.password_hash,
      referred_by: data.referred_by || null,
      franchise_type: data.franchise_type || null,
      franchise_address: data.franchise_address || null,
      franchise_pincode: data.franchise_pincode || null,
      franchise_city: data.franchise_city || null,
      franchise_state: data.franchise_state || null,
      commission_rate: data.commission_rate || null,
    },
  });

  return tempDataRecord;
};

const getTempRegistrationData = async (prisma, email) => {
  const tempData = await prisma.tempRegistrationData.findFirst({
    where: { email },
    orderBy: { created_at: 'desc' },
  });

  return tempData;
};

const deleteTempRegistrationData = async (prisma, email) => {
  await prisma.tempRegistrationData.deleteMany({
    where: { email },
  });
};

const verifyOtp = async (prisma, email, otp, purpose) => {
  const otpRecord = await prisma.otpVerification.findFirst({
    where: {
      email,
      purpose,
      verified: false,
    },
    orderBy: { created_at: 'desc' },
  });

  if (!otpRecord) {
    return { valid: false, error: 'OTP not found or already used' };
  }

  if (otpRecord.expires_at < new Date()) {
    return { valid: false, error: 'OTP has expired' };
  }

  if (otpRecord.otp_code !== otp) {
    return { valid: false, error: 'Invalid OTP' };
  }

  await prisma.otpVerification.update({
    where: { id: otpRecord.id },
    data: { verified: true },
  });

  return { valid: true, otpRecord };
};

const checkRateLimit = async (prisma, email, purpose) => {
  const windowStart = new Date(Date.now() - OTP_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
  
  const recentAttempts = await prisma.otpVerification.count({
    where: {
      email,
      purpose,
      created_at: {
        gte: windowStart,
      },
    },
  });

  if (recentAttempts >= OTP_RATE_LIMIT_MAX_ATTEMPTS) {
    const oldestInWindow = await prisma.otpVerification.findFirst({
      where: {
        email,
        purpose,
        created_at: {
          gte: windowStart,
        },
      },
      orderBy: { created_at: 'asc' },
    });

    const retryAfter = oldestInWindow
      ? Math.ceil((oldestInWindow.created_at.getTime() + OTP_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000 - Date.now()) / 60000)
      : OTP_RATE_LIMIT_WINDOW_MINUTES;

    return {
      allowed: false,
      retryAfter,
      message: `Too many OTP requests. Please try again in ${retryAfter} minutes.`,
    };
  }

  return { allowed: true };
};

const cleanupExpiredOtps = async (prisma) => {
  await prisma.otpVerification.deleteMany({
    where: {
      expires_at: {
        lt: new Date(),
      },
    },
  });
};

module.exports = {
  generateOtp,
  createOtpRecord,
  verifyOtp,
  checkRateLimit,
  cleanupExpiredOtps,
  storeTempRegistrationData,
  getTempRegistrationData,
  deleteTempRegistrationData,
  OTP_EXPIRY_MINUTES,
};
