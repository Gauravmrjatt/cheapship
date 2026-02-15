const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

    // Generate a unique referer code for the new user
    const generateRefererCode = () => {
      const prefix = 'VXVF';
      const random = Math.random().toString(36).substr(2, 6).toUpperCase();
      return `${prefix}${random}`;
    };

    const hashedPassword = await bcrypt.hash(password, 10);
    let refererCode = generateRefererCode();

    // Check if referer code already exists (unlikely but possible)
    const existingRefererCode = await prisma.user.findUnique({
      where: { referer_code: refererCode }
    });
    if (existingRefererCode) {
      refererCode = generateRefererCode();
    }

    // Check if the referred_by code is valid (if provided)
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
        // Default 5% commission rate if user is registering via franchise
        commission_rate: referred_by ? 5.00 : null,
      }
    });

    const { password_hash, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
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
        const { password_hash, ...userWithoutPassword } = user;
        res.json({ token, user: userWithoutPassword });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;
  // For now, just return a success message
  res.status(200).json({ message: 'Password reset link sent to your email.' });
};

module.exports = {
  register,
  login,
  forgotPassword,
};
