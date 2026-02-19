const { validationResult } = require('express-validator');
const razorpay = require('../utils/razorpay');
const crypto = require('crypto');

const getTransactions = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;
  const { page = 1, pageSize = 10, type, status, search } = req.query;

  const pageNum = parseInt(page, 10);
  const pageSizeNum = parseInt(pageSize, 10);
  const offset = (pageNum - 1) * pageSizeNum;

  try {
    const where = { user_id: userId };
    if (type) where.type = type;
    if (status) where.status = status;
    
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } },
        { reference_id: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [transactions, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        where,
        skip: offset,
        take: pageSizeNum,
        orderBy: { created_at: 'desc' }
      }),
      prisma.transaction.count({ where })
    ]);

    res.json({
      data: transactions,
      pagination: {
        total,
        totalPages: Math.ceil(total / pageSizeNum),
        currentPage: pageNum,
        pageSize: pageSizeNum
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const createRazorpayOrder = async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }

  try {
    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Razorpay Order Error Details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      description: error.description,
      source: error.source,
      step: error.step,
      reason: error.reason,
      metadata: error.metadata
    });
    res.status(500).json({ 
      message: 'Failed to create Razorpay order',
      error: error.message 
    });
  }
};

const verifyRazorpayPayment = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'your_key_secret';
  const generated_signature = crypto
    .createHmac('sha256', key_secret)
    .update(razorpay_order_id + '|' + razorpay_payment_id)
    .digest('hex');

  if (generated_signature === razorpay_signature) {
    try {
      const transaction = await prisma.$transaction(async (tx) => {
        // 1. Create transaction record
        const newTransaction = await tx.transaction.create({
          data: {
            user_id: userId,
            amount: amount,
            type: 'CREDIT',
            status: 'SUCCESS',
            description: 'Wallet Top-up via Razorpay',
            reference_id: razorpay_payment_id
          }
        });

        // 2. Update user wallet balance
        await tx.user.update({
          where: { id: userId },
          data: {
            wallet_balance: { increment: amount }
          }
        });

        return newTransaction;
      });

      res.json({ message: 'Payment verified and wallet topped up', transaction });
    } catch (error) {
      console.error('Verification Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    res.status(400).json({ message: 'Invalid signature' });
  }
};

module.exports = {
  getTransactions,
  createRazorpayOrder,
  verifyRazorpayPayment
};
