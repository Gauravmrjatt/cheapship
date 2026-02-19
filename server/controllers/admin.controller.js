const getDashboardStats = async (req, res) => {
  const prisma = req.app.locals.prisma;
  
  try {
    const [
      totalUsers,
      activeUsers,
      totalOrders,
      totalRevenue,
      pendingWithdrawals,
      recentOrders,
      userBalanceAggregate
    ] = await prisma.$transaction([
      prisma.user.count({ where: { user_type: 'NORMAL' } }),
      prisma.user.count({ where: { user_type: 'NORMAL', is_active: true } }),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: {
          shipping_charge: true
        }
      }),
      prisma.commissionWithdrawal.count({ where: { status: 'PENDING' } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: { user: { select: { name: true, email: true } } }
      }),
      prisma.user.aggregate({
        where: { user_type: 'NORMAL' },
        _sum: {
          wallet_balance: true
        }
      })
    ]);

    res.json({
      totalUsers,
      activeUsers,
      totalOrders,
      totalRevenue: totalRevenue._sum.shipping_charge || 0,
      totalUserBalance: userBalanceAggregate._sum.wallet_balance || 0,
      pendingWithdrawals,
      recentOrders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getUsers = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { page = 1, pageSize = 10, search, status } = req.query;
  
  const pageNum = parseInt(page, 10);
  const pageSizeNum = parseInt(pageSize, 10);
  const offset = (pageNum - 1) * pageSizeNum;

  const where = {
    user_type: 'NORMAL'
  };

  if (status === 'ACTIVE') {
    where.is_active = true;
  } else if (status === 'BLOCKED') {
    where.is_active = false;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { mobile: { contains: search, mode: 'insensitive' } }
    ];
  }

  try {
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip: offset,
        take: pageSizeNum,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          wallet_balance: true,
          is_active: true,
          created_at: true,
          _count: {
            select: { orders: true }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      data: users,
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

const toggleUserStatus = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { userId } = req.params;
  const { is_active } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { is_active },
      select: { id: true, is_active: true }
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getAllOrders = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { page = 1, pageSize = 10, status, search, userId } = req.query;

  const pageNum = parseInt(page, 10);
  const pageSizeNum = parseInt(pageSize, 10);
  const offset = (pageNum - 1) * pageSizeNum;

  const where = {};

  if (status && status !== 'ALL') {
    where.shipment_status = status;
  }

  if (userId) {
    where.user_id = userId;
  }

  if (search) {
    where.OR = [
      { id: { equals: parseInt(search) || undefined } }, // If search is number
      { courier_name: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  try {
    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        skip: offset,
        take: pageSizeNum,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      data: orders,
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

const getWithdrawals = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { status, page = 1, pageSize = 10 } = req.query;

  const pageNum = parseInt(page, 10);
  const pageSizeNum = parseInt(pageSize, 10);
  const offset = (pageNum - 1) * pageSizeNum;

  const where = {};
  if (status && status !== 'ALL') {
    where.status = status;
  }

  try {
    const [withdrawals, total] = await prisma.$transaction([
      prisma.commissionWithdrawal.findMany({
        where,
        skip: offset,
        take: pageSizeNum,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: { name: true, email: true, wallet_balance: true }
          }
        }
      }),
      prisma.commissionWithdrawal.count({ where })
    ]);

    res.json({
      data: withdrawals,
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

const processWithdrawal = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { id } = req.params;
  const { status } = req.body; // APPROVED or REJECTED

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const withdrawal = await tx.commissionWithdrawal.findUnique({
        where: { id }
      });

      if (!withdrawal) throw new Error('Withdrawal not found');
      if (withdrawal.status !== 'PENDING') throw new Error('Withdrawal already processed');

      // Update withdrawal status
      const updatedWithdrawal = await tx.commissionWithdrawal.update({
        where: { id },
        data: { status }
      });

      // If approved, create a debit transaction for the user
      // Note: The actual "money" logic depends on how you store commission.
      // If commission is already in wallet_balance, then Approved means money is sent out, so debit wallet.
      // If Rejected, money stays in wallet (or rather, the lock is released).
      
      // Assuming 'withdraw' created a pending record but didn't debit yet?
      // Or typically, you debit on request (hold funds) and refund on reject.
      // Let's assume standard: Request -> Debit Wallet (Hold) -> Admin Approve (Done) or Reject (Refund).
      // Checking `franchise.controller.js`: It creates a record but didn't debit wallet there! 
      // Wait, franchise controller checked balance but didn't decrement it. 
      // I should fix that logic or handle it here.
      // Let's assume:
      // Approve -> Debit Wallet (Real payout)
      // Reject -> Do nothing (Balance remains)
      
               if (status === 'APPROVED') {
                  // Check balance again
                  const user = await tx.user.findUnique({ where: { id: withdrawal.user_id } });
                  if (Number(user.wallet_balance) < Number(withdrawal.amount)) {
                      throw new Error('Insufficient user balance for approval');
                  }
       
                  await tx.user.update({
                      where: { id: withdrawal.user_id },
                      data: { wallet_balance: { decrement: withdrawal.amount } }
                  });
                  
                  // If it's a franchise withdrawal, consume the orders
                  if (withdrawal.franchise_id) {
                    await tx.order.updateMany({
                      where: {
                        user_id: withdrawal.franchise_id,
                        shipment_status: 'DELIVERED',
                        is_franchise_withdrawn: false
                      },
                      data: {
                        is_franchise_withdrawn: true,
                        franchise_commission_amount: 0
                      }
                    });
                  } else {
                    // This is a multi-level referral commission withdrawal
                    // Commission records are already marked as withdrawn when request was created
                    // Just verify they exist and are marked properly
                    const withdrawnCommissions = await tx.orderReferralCommission.findMany({
                      where: {
                        referrer_id: withdrawal.user_id,
                        is_withdrawn: true,
                        withdrawn_at: {
                          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
                        }
                      }
                    });
                    
                    if (withdrawnCommissions.length === 0) {
                      console.warn(`No withdrawn commission records found for withdrawal ${withdrawal.id}`);
                    }
                  }
       
                  await tx.transaction.create({
                      data: {
                          user_id: withdrawal.user_id,
                          amount: withdrawal.amount,
                          type: 'DEBIT',
                          status: 'SUCCESS',
                          description: withdrawal.franchise_id ? 'Franchise Commission Withdrawal Approved' : 'Referral Commission Withdrawal Approved',
                          reference_id: withdrawal.id
                      }
                  });
               }
      return updatedWithdrawal;
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message || 'Internal Server Error' });
  }
};

const getGlobalSettings = async (req, res) => {
  const prisma = req.app.locals.prisma;
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'global_commission_rate' }
    });
    res.json({ rate: setting ? parseFloat(setting.value) : 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const updateGlobalSettings = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { rate } = req.body;

  try {
    const setting = await prisma.systemSetting.upsert({
      where: { key: 'global_commission_rate' },
      update: { value: rate.toString() },
      create: { 
        key: 'global_commission_rate',
        value: rate.toString(),
        description: 'Global commission rate percentage added to all orders'
      }
    });
    res.json(setting);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getAllTransactions = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { page = 1, pageSize = 10, type, search, userId } = req.query;

  const pageNum = parseInt(page, 10);
  const pageSizeNum = parseInt(pageSize, 10);
  const offset = (pageNum - 1) * pageSizeNum;

  const where = {};

  if (type && type !== 'ALL') {
    where.type = type;
  }

  if (userId) {
    where.user_id = userId;
  }

  if (search) {
    where.OR = [
      { reference_id: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  try {
    const [transactions, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        where,
        skip: offset,
        take: pageSizeNum,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
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

const getCommissionLimits = async (req, res) => {
  const prisma = req.app.locals.prisma;
  try {
    const [minSetting, maxSetting] = await prisma.$transaction([
      prisma.systemSetting.findUnique({
        where: { key: 'min_commission_rate' }
      }),
      prisma.systemSetting.findUnique({
        where: { key: 'max_commission_rate' }
      })
    ]);

    res.json({
      min_rate: minSetting ? parseFloat(minSetting.value) : 0,
      max_rate: maxSetting ? parseFloat(maxSetting.value) : 100
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const updateCommissionLimits = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { min_rate, max_rate } = req.body;

  if (min_rate === undefined || max_rate === undefined) {
    return res.status(400).json({ message: 'Both min_rate and max_rate are required' });
  }

  if (min_rate < 0 || min_rate > 100 || max_rate < 0 || max_rate > 100) {
    return res.status(400).json({ message: 'Commission rates must be between 0 and 100' });
  }

  if (min_rate > max_rate) {
    return res.status(400).json({ message: 'Min rate cannot be greater than max rate' });
  }

  try {
    const [minSetting, maxSetting] = await prisma.$transaction([
      prisma.systemSetting.upsert({
        where: { key: 'min_commission_rate' },
        update: { value: min_rate.toString() },
        create: {
          key: 'min_commission_rate',
          value: min_rate.toString(),
          description: 'Minimum commission rate percentage for franchises'
        }
      }),
      prisma.systemSetting.upsert({
        where: { key: 'max_commission_rate' },
        update: { value: max_rate.toString() },
        create: {
          key: 'max_commission_rate',
          value: max_rate.toString(),
          description: 'Maximum commission rate percentage for franchises'
        }
      })
    ]);

    res.json({
      min_rate: parseFloat(minSetting.value),
      max_rate: parseFloat(maxSetting.value)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get referral level setting (max levels)
const getReferralLevelSetting = async (req, res) => {
  const prisma = req.app.locals.prisma;

  try {
    const setting = await prisma.systemSetting.findFirst({
      where: { key: 'max_referral_levels' }
    });
    res.json({
      max_levels: setting ? parseInt(setting.value) : 1, 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Update referral level setting (max levels)
const updateReferralLevelSetting = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { max_levels } = req.body;

  if (max_levels === undefined || typeof max_levels !== 'number' || max_levels < 0 || max_levels > 10) {
    return res.status(400).json({ message: 'max_levels must be a number between 0 and 10' });
  }

  try {
    // Find existing setting or create new one
    const existingSetting = await prisma.systemSetting.findFirst({
      where: { key: 'max_referral_levels' }
    });

    let result;
    if (existingSetting) {
      // Update existing
      result = await prisma.systemSetting.update({
        where: { key: 'max_referral_levels' },
        data: { value: max_levels.toString() }
      });
    } else {
      // Create new
      result = await prisma.systemSetting.create({
        data: {
          key: 'max_referral_levels',
          value: max_levels.toString(),
          description: 'Maximum number of referral levels for franchises'
        }
      });
    }

    res.json({
      max_levels: parseInt(result.value),
      is_active: result.is_active
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get network commission stats for admin
const getNetworkCommissionStats = async (req, res) => {
  const prisma = req.app.locals.prisma;
  
  try {
    const [
      totalReferralCommissions,
      pendingReferralCommissions,
      withdrawnReferralCommissions
    ] = await prisma.$transaction([
      prisma.orderReferralCommission.aggregate({
        _sum: { amount: true },
        _count: true
      }),
      prisma.orderReferralCommission.aggregate({
        where: { is_withdrawn: false },
        _sum: { amount: true },
        _count: true
      }),
      prisma.orderReferralCommission.aggregate({
        where: { is_withdrawn: true },
        _sum: { amount: true },
        _count: true
      })
    ]);
    
    res.json({
      total_commission: totalReferralCommissions._sum.amount || 0,
      total_count: totalReferralCommissions._count,
      pending_commission: pendingReferralCommissions._sum.amount || 0,
      pending_count: pendingReferralCommissions._count,
      withdrawn_commission: withdrawnReferralCommissions._sum.amount || 0,
      withdrawn_count: withdrawnReferralCommissions._count
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Admin: Set commission bounds for a specific user
const setUserCommissionBounds = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { userId } = req.params;
  const { min_rate, max_rate } = req.body;

  if (min_rate === undefined || max_rate === undefined) {
    return res.status(400).json({ message: 'Both min_rate and max_rate are required' });
  }

  if (min_rate > max_rate) {
    return res.status(400).json({ message: 'Min rate cannot be greater than max rate' });
  }

  if (min_rate < 0 || min_rate > 100 || max_rate < 0 || max_rate > 100) {
    return res.status(400).json({ message: 'Commission rates must be between 0 and 100' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        min_commission_rate: min_rate,
        max_commission_rate: max_rate
      },
      select: {
        id: true,
        name: true,
        email: true,
        min_commission_rate: true,
        max_commission_rate: true,
        updated_at: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Admin: Get commission bounds for a specific user
const getUserCommissionBounds = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { userId } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        min_commission_rate: true,
        max_commission_rate: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user_id: user.id,
      name: user.name,
      email: user.email,
      bounds: {
        min_rate: user.min_commission_rate ? parseFloat(user.min_commission_rate) : 0,
        max_rate: user.max_commission_rate ? parseFloat(user.max_commission_rate) : 100
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  toggleUserStatus,
  getAllOrders,
  getWithdrawals,
  processWithdrawal,
  getGlobalSettings,
  updateGlobalSettings,
  getAllTransactions,
  getCommissionLimits,
  updateCommissionLimits,
  getReferralLevelSetting,
  updateReferralLevelSetting,
  getNetworkCommissionStats,
  setUserCommissionBounds,
  getUserCommissionBounds
};
