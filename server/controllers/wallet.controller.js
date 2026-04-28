const { validationResult } = require('express-validator');

const requestWithdrawal = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;
  const { amount, note } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Amount must be greater than 0' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        wallet_balance: true,
        upi_id: true,
        bank_name: true,
        beneficiary_name: true,
        account_number: true,
        ifsc_code: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (Number(user.wallet_balance) < amount) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrder = await prisma.order.findFirst({
      where: {
        user_id: userId,
        created_at: { gte: thirtyDaysAgo },
        shipment_status: { notIn: ['CANCELLED', 'RTO', 'RTO_DELIVERED'] }
      },
      orderBy: { created_at: 'desc' }
    });

    if (recentOrder) {
      return res.status(400).json({ 
        message: 'You must wait 30 days after your last order to withdraw funds',
        last_order_date: recentOrder.created_at
      });
    }

    const pendingWithdrawal = await prisma.walletWithdrawal.findFirst({
      where: {
        user_id: userId,
        status: 'PENDING'
      }
    });

    if (pendingWithdrawal) {
      return res.status(400).json({ message: 'You already have a pending withdrawal request' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const withdrawal = await tx.walletWithdrawal.create({
        data: {
          user_id: userId,
          amount,
          note: note || null,
          status: 'PENDING'
        }
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          wallet_balance: { decrement: amount }
        }
      });

      const updatedUser = await tx.user.findUnique({
        where: { id: userId },
        select: { wallet_balance: true }
      });

      await tx.transaction.create({
        data: {
          user_id: userId,
          amount,
          closing_balance: updatedUser.wallet_balance,
          type: 'DEBIT',
          category: 'WITHDRAWAL_REQUEST',
          status: 'PENDING',
          description: `Withdrawal request of ₹${amount}`
        }
      });

      return withdrawal;
    });

    res.status(201).json({
      message: 'Withdrawal request submitted successfully',
      withdrawal: result
    });
  } catch (error) {
    console.error('Withdrawal request error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getUserWithdrawals = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    const withdrawals = await prisma.walletWithdrawal.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            mobile: true,
            upi_id: true,
            bank_name: true,
            beneficiary_name: true
          }
        }
      }
    });

    res.json(withdrawals);
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getWithdrawalById = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const withdrawal = await prisma.walletWithdrawal.findFirst({
      where: {
        id,
        user_id: userId
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            mobile: true,
            upi_id: true,
            bank_name: true,
            beneficiary_name: true,
            account_number: true,
            ifsc_code: true
          }
        }
      }
    });

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    res.json(withdrawal);
  } catch (error) {
    console.error('Get withdrawal error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getWalletBalance = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        wallet_balance: true,
        security_deposit: true,
        upi_id: true,
        bank_name: true,
        beneficiary_name: true,
        account_number: true,
        ifsc_code: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrder = await prisma.order.findFirst({
      where: {
        user_id: userId,
        created_at: { gte: thirtyDaysAgo },
        shipment_status: { notIn: ['CANCELLED', 'RTO', 'RTO_DELIVERED'] }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      wallet_balance: user.wallet_balance,
      is_withdrawable: !recentOrder,
      last_order_date: recentOrder?.created_at || null,
      has_bank_details: !!(user.bank_name || user.upi_id),
      upi_id: user.upi_id,
      bank_name: user.bank_name,
      beneficiary_name: user.beneficiary_name,
      account_number: user.account_number ? `XXXX${user.account_number.slice(-4)}` : null,
      ifsc_code: user.ifsc_code
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  requestWithdrawal,
  getUserWithdrawals,
  getWithdrawalById,
  getWalletBalance
};