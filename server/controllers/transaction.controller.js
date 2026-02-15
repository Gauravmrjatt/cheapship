const { validationResult } = require('express-validator');

const getTransactions = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;
  const { page = 1, pageSize = 10, type, status } = req.query;

  const pageNum = parseInt(page, 10);
  const pageSizeNum = parseInt(pageSize, 10);
  const offset = (pageNum - 1) * pageSizeNum;

  try {
    const where = { user_id: userId };
    if (type) where.type = type;
    if (status) where.status = status;

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

const topUpWallet = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;
  const { amount, reference_id } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }

  try {
    // In a real app, verify the payment with the gateway (Razorpay/Paytm etc.)
    // For now, we'll simulate a successful top-up
    
    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Create transaction record
      const newTransaction = await tx.transaction.create({
        data: {
          user_id: userId,
          amount: amount,
          type: 'CREDIT',
          status: 'SUCCESS',
          description: 'Wallet Top-up',
          reference_id: reference_id || `TOPUP_${Date.now()}`
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

    res.json({ message: 'Wallet topped up successfully', transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  getTransactions,
  topUpWallet
};
