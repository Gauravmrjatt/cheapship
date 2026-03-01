const { validationResult } = require('express-validator');
const razorpay = require('../utils/razorpay');
const crypto = require('crypto');

const getTransactions = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;
  const { page = 1, pageSize = 10, type, category, status, search, fromDate, toDate } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const pageSizeNum = parseInt(pageSize, 10);
  const offset = (pageNum - 1) * pageSizeNum;

  try {
    const where = { user_id: userId };
    if (type) where.type = type;
    if (category) where.category = category;
    if (status) where.status = status;

    if (fromDate || toDate) {
      where.created_at = {};
      if (fromDate) {
        where.created_at.gte = new Date(fromDate);
      }
      if (toDate) {
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.created_at.lte = endOfDay;
      }
    }

    if (search) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(search);
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { reference_id: { contains: search, mode: 'insensitive' } }
      ];
      if (isUUID) {
        where.OR.push({ id: search });
      }
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

    const orderIds = transactions
      .map(t => t.reference_id)
      .filter(id => id && /^\d+$/.test(id));

    let orderDetailsMap = {};
    if (orderIds.length > 0) {
      const numericOrderIds = orderIds.map(id => BigInt(id));
      const orders = await prisma.order.findMany({
        where: { id: { in: numericOrderIds } },
        select: { id: true, tracking_number: true }
      });
      orders.forEach(o => {
        orderDetailsMap[o.id.toString()] = { awb_code: o.tracking_number };
      });
    }

    const enhancedTransactions = transactions.map(t => {
      if (t.reference_id && orderDetailsMap[t.reference_id]) {
        return { ...t, order_details: orderDetailsMap[t.reference_id] };
      }
      return t;
    });

    res.json({
      data: enhancedTransactions,
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
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, category = 'WALLET_TOPUP' } = req.body;

  if (!process.env.RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ message: 'Payment configuration error. Please contact support.' });
  }

  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  const generated_signature = crypto
    .createHmac('sha256', key_secret)
    .update(razorpay_order_id + '|' + razorpay_payment_id)
    .digest('hex');

  if (generated_signature === razorpay_signature) {
    try {
      const transaction = await prisma.$transaction(async (tx) => {
        const isSecurityDeposit = category === 'SECURITY_DEPOSIT';

        // 1. Create transaction record
        const newTransaction = await tx.transaction.create({
          data: {
            user_id: userId,
            amount: amount,
            type: 'CREDIT',
            category: category,
            status: 'SUCCESS',
            description: isSecurityDeposit ? 'Security Deposit via Razorpay' : 'Wallet Top-up via Razorpay',
            reference_id: razorpay_payment_id
          }
        });

        if (isSecurityDeposit) {
          // Update security deposit
          await tx.user.update({
            where: { id: userId },
            data: {
              security_deposit: { increment: amount }
            }
          });
        } else {
          // 2. Check for matching WalletPlan based on recharge amount
          const applicablePlans = await tx.walletPlan.findMany({
            where: {
              is_active: true,
              recharge_amount: { lte: amount }
            },
            orderBy: {
              discount_percentage: 'desc'
            },
            take: 1
          });

          const newDiscount = applicablePlans.length > 0 ? applicablePlans[0].discount_percentage : null;

          // 3. Update user wallet balance (and active_discount if the new discount is higher)
          const user = await tx.user.findUnique({ where: { id: userId }, select: { active_discount: true } });
          const updateData = { wallet_balance: { increment: amount } };

          if (newDiscount && Number(newDiscount) > Number(user.active_discount || 0)) {
            updateData.active_discount = newDiscount;
          }

          await tx.user.update({
            where: { id: userId },
            data: updateData
          });
        }

        return newTransaction;
      });

      res.json({ message: isSecurityDeposit ? 'Security deposit paid' : 'Payment verified and wallet topped up', transaction });
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
