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
        { id: { contains: search, mode: 'insensitive' } },
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
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }

  // Validate amount is a valid number
  const amountNumber = parseFloat(amount);
  if (isNaN(amountNumber) || amountNumber <= 0) {
    return res.status(400).json({ message: 'Invalid amount format' });
  }

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true }
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  try {
    const options = {
      amount: Math.round(amountNumber * 100),
      currency: 'INR',
      receipt: `rcpt_${crypto.randomUUID().slice(0, 12)}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Razorpay Order Error Details:', {
      message: error.message,
      code: error.code,
      description: error.description,
      reason: error.reason
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
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    amount,
    category = 'WALLET_TOPUP'
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !amount) {
    console.error('Missing required payment fields:', {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount
    });
    return res.status(400).json({ message: 'Missing required payment information.' });
  }

  const amountNumber = parseFloat(amount);
  if (isNaN(amountNumber) || amountNumber <= 0) {
    return res.status(400).json({ message: 'Invalid amount format' });
  }

  if (!process.env.RAZORPAY_KEY_SECRET) {
    console.error('RAZORPAY_KEY_SECRET not configured');
    return res.status(500).json({ message: 'Payment configuration error. Please contact support.' });
  }

  const isSecurityDeposit = category === 'SECURITY_DEPOSIT';

  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  const generated_signature = crypto
    .createHmac('sha256', key_secret)
    .update(razorpay_order_id + '|' + razorpay_payment_id)
    .digest('hex');

  console.log('Payment verification attempt:', {
    received_order_id: razorpay_order_id,
    received_payment_id: razorpay_payment_id,
    signature_match: generated_signature === razorpay_signature,
    amount: amountNumber,
    userId,
    category
  });

  if (generated_signature !== razorpay_signature) {
    return res.status(400).json({ message: 'Invalid signature' });
  }

  try {
    const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
    if (!razorpayOrder) {
      console.error('Razorpay order not found:', { razorpay_order_id });
      return res.status(400).json({ message: 'Invalid Razorpay order' });
    }

    const expectedAmount = razorpayOrder.amount / 100;
    if (expectedAmount !== amountNumber) {
      console.error('Amount mismatch:', { expectedAmount, receivedAmount: amountNumber });
      return res.status(400).json({ message: 'Amount mismatch - possible tampering detected' });
    }

    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    if (!payment) {
      console.error('Razorpay payment not found:', { razorpay_payment_id });
      return res.status(400).json({ message: 'Invalid Razorpay payment' });
    }

    if (payment.status !== 'captured') {
      console.error('Payment not captured:', { payment_status: payment.status });
      return res.status(400).json({ message: 'Payment not captured' });
    }

    const existingTransaction = await prisma.transaction.findFirst({
      where: { reference_id: razorpay_payment_id }
    });

    if (existingTransaction) {
      console.error('Payment already processed:', { razorpay_payment_id });
      return res.status(400).json({ message: 'Payment already processed' });
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const currentUser = await tx.user.findUnique({
        where: { id: userId },
        select: { wallet_balance: true, security_deposit: true }
      });

      if (!currentUser) {
        console.error('User not found during verification:', { userId });
        throw new Error('User not found');
      }

      const currentBalance = isSecurityDeposit
        ? Number(currentUser.security_deposit || 0)
        : Number(currentUser.wallet_balance || 0);

      let bonusAmount = 0;
      let totalCredit = amountNumber;

      if (isSecurityDeposit) {
        await tx.user.update({
          where: { id: userId },
          data: {
            security_deposit: { increment: amountNumber }
          }
        });
      } else {
        const applicablePlans = await tx.walletPlan.findMany({
          where: {
            is_active: true,
            recharge_amount: { lte: amountNumber }
          },
          orderBy: {
            discount_percentage: 'desc'
          },
          take: 1
        });

        const newDiscount =
          applicablePlans.length > 0 ? applicablePlans[0].discount_percentage : null;

        bonusAmount = newDiscount
          ? (amountNumber * Number(newDiscount)) / 100
          : 0;

        totalCredit = amountNumber + bonusAmount;

        await tx.user.update({
          where: { id: userId },
          data: { wallet_balance: { increment: totalCredit } }
        });
      }

      const closingBalance = currentBalance + totalCredit;

      // ✅ FIX: create transaction AFTER calculations (no update needed later)
      const newTransaction = await tx.transaction.create({
        data: {
          user_id: userId,
          amount: totalCredit,
          closing_balance: closingBalance,
          type: 'CREDIT',
          category: category,
          status: 'SUCCESS',
          description: isSecurityDeposit
            ? 'Security Deposit via Razorpay'
            : bonusAmount > 0
              ? `Wallet Top-up via Razorpay (₹${amountNumber} + ₹${bonusAmount.toFixed(2)} bonus)`
              : 'Wallet Top-up via Razorpay',
          reference_id: razorpay_payment_id
        }
      });

      return newTransaction;
    });

    res.json({
      message: isSecurityDeposit
        ? 'Security deposit paid'
        : 'Payment verified and wallet topped up',
      transaction,
      amount: amountNumber
    });
  } catch (error) {
    console.error('Verification Error:', {
      message: error.message,
      stack: error.stack,
      razorpay_order_id,
      razorpay_payment_id,
      userId
    });

    if (error.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(500).json({
      message: 'Payment verification failed. Please contact support.'
    });
  }
};

module.exports = {
  getTransactions,
  createRazorpayOrder,
  verifyRazorpayPayment
};
