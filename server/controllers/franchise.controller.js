const { validationResult } = require('express-validator');

// Get all franchises (users referred by the current user)
const getFranchises = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    // First get the current user's referer code
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { referer_code: true }
    });

    if (!currentUser || !currentUser.referer_code) {
      return res.status(404).json({ message: 'User referral code not found' });
    }

    // Get all users who were referred by this user
    const franchises = await prisma.user.findMany({
      where: {
        referred_by: currentUser.referer_code
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        referer_code: true,
        commission_rate: true,
        assigned_rates: true,
        franchise_type: true,
        franchise_address: true,
        franchise_pincode: true,
        franchise_city: true,
        franchise_state: true,
        is_active: true,
        created_at: true,
        _count: {
          select: {
            orders: true
          }
        },
        orders: {
          select: {
            shipping_charge: true,
            base_shipping_charge: true,
            franchise_commission_amount: true,
            shipment_status: true,
            is_franchise_withdrawn: true
          }
        },
        withdrawals: {
          select: {
            amount: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

          const franchisesWithProfit = franchises.map(f => {
            const total_profit = f.orders.reduce((sum, order) => {
              return sum + parseFloat(order.franchise_commission_amount || 0);
            }, 0);
    
            const withdrawable_profit = f.orders.reduce((sum, order) => {
              if (order.shipment_status === 'DELIVERED' && !order.is_franchise_withdrawn) {
                return sum + parseFloat(order.franchise_commission_amount || 0);
              }
              return sum;
            }, 0);
    
            const pending_profit = f.orders.reduce((sum, order) => {
              if (order.shipment_status !== 'DELIVERED' && order.shipment_status !== 'CANCELLED' && !order.is_franchise_withdrawn) {
                return sum + parseFloat(order.franchise_commission_amount || 0);
              }
              return sum;
            }, 0);
    
            const total_base_shipping_charge = f.orders.reduce((sum, order) => {
              return sum + parseFloat(order.base_shipping_charge || 0);
            }, 0);
    
            const total_withdrawn = f.withdrawals.reduce((sum, w) => {
              if (w.status === 'COMPLETED' || w.status === 'APPROVED' || w.status === 'PENDING') {
                return sum + parseFloat(w.amount || 0);
              }
              return sum;
            }, 0);
    
            const { orders, withdrawals, ...rest } = f;
            return {
              ...rest,
              total_profit,
              withdrawable_profit,
              pending_profit,
              total_base_shipping_charge,
              total_withdrawn,
              balance: Math.max(0, withdrawable_profit - total_withdrawn)
            };
          });
    res.json(franchisesWithProfit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Withdraw commission earned from a specific franchise
const withdrawCommission = async (req, res) => {
  const { franchiseId } = req.params;
  const { amount } = req.body;
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Valid amount is required' });
  }

  try {
    // Get current user's referer code
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { referer_code: true }
    });

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify the franchise was referred by this user
    const franchise = await prisma.user.findFirst({
      where: {
        id: franchiseId,
        referred_by: currentUser.referer_code
      },
      include: {
      orders: {
        select: {
          franchise_commission_amount: true,
          shipment_status: true,
          is_franchise_withdrawn: true
        }
      },
      withdrawals: {
        select: {
          amount: true,
          status: true
        }
      }
    }
  });

  if (!franchise) {
    return res.status(404).json({ message: 'Franchise not found or not under your network' });
  }

  // Calculate available balance (Only non-withdrawn DELIVERED orders)
  const withdrawable_profit = franchise.orders.reduce((sum, order) => {
    if (order.shipment_status === 'DELIVERED' && !order.is_franchise_withdrawn) {
      return sum + parseFloat(order.franchise_commission_amount || 0);
    }
    return sum;
  }, 0);

  const total_withdrawn = franchise.withdrawals.reduce((sum, w) => {
    if (w.status === 'COMPLETED' || w.status === 'APPROVED' || w.status === 'PENDING') {
      return sum + parseFloat(w.amount || 0);
    }
    return sum;
  }, 0);

  const available_balance = Math.max(0, withdrawable_profit - total_withdrawn);

  if (amount > available_balance) {
    return res.status(400).json({ message: `Insufficient withdrawable balance. Available: ₹${available_balance}` });
  }

  // Create withdrawal request
  const withdrawal = await prisma.commissionWithdrawal.create({
    data: {
      user_id: userId, // The franchise network holder
      franchise_id: franchiseId, // The specific franchise whose commission is withdrawn
      amount: amount,
      status: 'PENDING'
    }
  });

    res.json({
      message: 'Withdrawal request submitted successfully',
      withdrawal
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get current user's referral code and link
const getMyReferralCode = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        referer_code: true,
        commission_rate: true,
        franchise_type: true,
        created_at: true
      }
    });

    if (!user || !user.referer_code) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Build the registration URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const referralLink = `${baseUrl}/auth/signup?ref=${user.referer_code}`;

    res.json({
      ...user,
      referral_link: referralLink
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Update franchise commission rate
const updateFranchiseRate = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { franchiseId } = req.params;
  const { commission_rate, assigned_rates } = req.body;
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    // Get current user's referer code
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { referer_code: true }
    });

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify the franchise was referred by this user
    const franchise = await prisma.user.findFirst({
      where: {
        id: franchiseId,
        referred_by: currentUser.referer_code
      }
    });

    if (!franchise) {
      return res.status(404).json({ message: 'Franchise not found or not under your network' });
    }

    const updateData = {};
    
    // Validate and add commission rate (0-100)
    if (commission_rate !== undefined) {
      if (commission_rate < 0 || commission_rate > 100) {
        return res.status(400).json({ message: 'Commission rate must be between 0 and 100' });
      }
      updateData.commission_rate = commission_rate;
    }

    // Add assigned rates if provided
    if (assigned_rates) {
      updateData.assigned_rates = assigned_rates;
    }

    // Update the franchise
    const updatedFranchise = await prisma.user.update({
      where: { id: franchiseId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        commission_rate: true,
        assigned_rates: true,
        franchise_type: true,
        updated_at: true
      }
    });

    res.json(updatedFranchise);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get franchise orders (for viewing orders created by a specific franchise)
const getFranchiseOrders = async (req, res) => {
  const { franchiseId } = req.params;
  const { page = 1, pageSize = 10, shipment_status } = req.query;
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  const pageNum = parseInt(page, 10);
  const pageSizeNum = parseInt(pageSize, 10);
  const offset = (pageNum - 1) * pageSizeNum;

  try {
    // Get current user's referer code
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { referer_code: true }
    });

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify the franchise was referred by this user
    const franchise = await prisma.user.findFirst({
      where: {
        id: franchiseId,
        referred_by: currentUser.referer_code
      }
    });

    if (!franchise) {
      return res.status(404).json({ message: 'Franchise not found or not under your network' });
    }

    const where = {
      user_id: franchiseId
    };

    if (shipment_status) {
      where.shipment_status = shipment_status;
    }

    const orders = await prisma.order.findMany({
      where,
      skip: offset,
      take: pageSizeNum,
      orderBy: {
        created_at: 'desc'
      },
      include: {
        order_pickup_address: true,
        order_receiver_address: true
      }
    });

    const totalOrders = await prisma.order.count({ where });

    res.json({
      data: orders,
      pagination: {
        total: totalOrders,
        totalPages: Math.ceil(totalOrders / pageSizeNum),
        currentPage: pageNum,
        pageSize: pageSizeNum
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Verify referral code (public endpoint for registration)
const verifyReferralCode = async (req, res) => {
  const { code } = req.query;
  const prisma = req.app.locals.prisma;

  if (!code) {
    return res.status(400).json({ valid: false, message: 'Referral code is required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { referer_code: code },
      select: {
        id: true,
        name: true,
        franchise_type: true,
        commission_rate: true
      }
    });

    if (!user) {
      return res.json({ valid: false, message: 'Invalid referral code' });
    }

    res.json({
      valid: true,
      franchise: {
        id: user.id,
        name: user.name,
        type: user.franchise_type,
        defaultCommissionRate: user.commission_rate || 5
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  getFranchises,
  getMyReferralCode,
  updateFranchiseRate,
  getFranchiseOrders,
  verifyReferralCode,
  withdrawCommission
};
