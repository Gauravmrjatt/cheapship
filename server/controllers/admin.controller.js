const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const otpService = require('../services/otp.service');
const emailService = require('../services/email.service');
const moment = require('moment-timezone');

const sendAdminForgotPasswordOtp = async (req, res) => {
  const { email: rawEmail } = req.body;
  const email = rawEmail?.trim().toLowerCase();
  const prisma = req.app.locals.prisma;

  try {
    const admin = await prisma.user.findFirst({
      where: { email, user_type: 'ADMIN' }
    });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const rateLimitCheck = await otpService.checkRateLimit(prisma, email, 'admin_forgot_password');
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        message: rateLimitCheck.message,
        retryAfter: rateLimitCheck.retryAfter
      });
    }

    const otp = otpService.generateOtp();
    await otpService.createOtpRecord(prisma, email, admin.mobile, otp, 'admin_forgot_password');

    await emailService.sendOtpEmail(email, otp, 'forgot_password');

    res.status(200).json({
      message: 'OTP sent to your email',
      expiresIn: otpService.OTP_EXPIRY_MINUTES * 60
    });
  } catch (error) {
    console.error('Admin forgot password error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const resetAdminPassword = async (req, res) => {
  const { email: rawEmail, otp, newPassword } = req.body;
  const email = rawEmail?.trim().toLowerCase();
  const prisma = req.app.locals.prisma;

  try {
    const admin = await prisma.user.findFirst({
      where: { email, user_type: 'ADMIN' }
    });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const verifyResult = await otpService.verifyOtp(prisma, email, otp, 'admin_forgot_password');

    if (!verifyResult.valid) {
      return res.status(400).json({ message: verifyResult.error });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: admin.id },
      data: { password_hash: hashedPassword }
    });

    res.status(200).json({ message: 'Password reset successfully. Please login with your new password.' });
  } catch (error) {
    console.error('Admin reset password error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getDashboardStats = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    // Basic stats
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
        _sum: { shipping_charge: true }
      }),
      prisma.commissionWithdrawal.count({ where: { status: 'PENDING' } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: { name: true, email: true, mobile: true }
          }
        }
      }),
      prisma.user.aggregate({
        where: { user_type: 'NORMAL' },
        _sum: { wallet_balance: true }
      })
    ]);

    // Order counts by status
    const [
      deliveredOrdersCount,
      inTransitOrdersCount,
      dispatchedOrdersCount,
      manifestedOrdersCount,
      rtoOrdersCount,
      cancelledOrdersCount,
      pendingOrdersCount,
      notPickedOrdersCount
    ] = await Promise.all([
      prisma.order.count({ where: { shipment_status: 'DELIVERED' } }),
      prisma.order.count({ where: { shipment_status: 'IN_TRANSIT' } }),
      prisma.order.count({ where: { shipment_status: 'DISPATCHED' } }),
      prisma.order.count({ where: { shipment_status: 'MANIFESTED' } }),
      prisma.order.count({ where: { shipment_status: 'RTO' } }),
      prisma.order.count({ where: { shipment_status: 'CANCELLED' } }),
      prisma.order.count({ where: { shipment_status: 'PENDING' } }),
      prisma.order.count({ where: { shipment_status: 'NOT_PICKED' } })
    ]);

    // Last month orders for growth calculation
    const lastMonthOrders = await prisma.order.count({
      where: {
        created_at: { gte: lastMonth }
      }
    });

    // Total Weight Shipped (from delivered orders)
    const deliveredOrdersWithWeight = await prisma.order.findMany({
      where: {
        shipment_status: 'DELIVERED',
        weight: { not: null }
      },
      select: { weight: true }
    });
    const totalWeightShipped = deliveredOrdersWithWeight.reduce((sum, order) => sum + parseFloat(order.weight || 0), 0).toFixed(2);

    // Average Delivery Time
    let avgDeliveryTimeDays = 0;
    const deliveredOrdersWithTimestamps = await prisma.order.findMany({
      where: {
        shipment_status: 'DELIVERED',
        delivered_at: { not: null }
      },
      select: {
        created_at: true,
        delivered_at: true
      }
    });

    if (deliveredOrdersWithTimestamps.length > 0) {
      const totalDeliveryTimeMs = deliveredOrdersWithTimestamps.reduce((sum, order) => {
        if (order.delivered_at && order.created_at) {
          return sum + (new Date(order.delivered_at).getTime() - new Date(order.created_at).getTime());
        }
        return sum;
      }, 0);
      const avgDeliveryTimeMs = totalDeliveryTimeMs / deliveredOrdersWithTimestamps.length;
      avgDeliveryTimeDays = (avgDeliveryTimeMs / (1000 * 60 * 60 * 24)).toFixed(0);
    }

    // Success and Return Rates
    const deliverySuccessRate = totalOrders > 0 ? ((deliveredOrdersCount / totalOrders) * 100).toFixed(0) : 0;
    const returnRate = totalOrders > 0 ? ((rtoOrdersCount / totalOrders) * 100).toFixed(0) : 0;

    // Monthly Growth
    const monthlyGrowthRaw = lastMonthOrders > 0 ? ((totalOrders - lastMonthOrders) / lastMonthOrders) * 100 : 100;
    const monthlyGrowth = `${monthlyGrowthRaw > 0 ? '+' : ''}${monthlyGrowthRaw.toFixed(1)}%`;

    // Pending Disputes - count ALL disputes (no status filter)
    const weightDisputeOrders = await prisma.weightDispute.count();
    const rtoDisputeOrders = await prisma.rTODispute.count();
    const actionRequired = weightDisputeOrders + rtoDisputeOrders;

    // 30-day graph data
    const ordersForGraph = await prisma.order.findMany({
      where: {
        created_at: { gte: thirtyDaysAgo }
      },
      select: {
        created_at: true,
        shipment_status: true
      },
      orderBy: { created_at: 'asc' }
    });

    // Group orders by date and status
    const graphDataMap = {};
    for (let i = 0; i <= 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      graphDataMap[dateStr] = {
        date: dateStr,
        DELIVERED: 0,
        PENDING: 0,
        CANCELLED: 0,
        IN_TRANSIT: 0,
        DISPATCHED: 0,
        MANIFESTED: 0,
        RTO: 0,
        NOT_PICKED: 0,
        TOTAL: 0
      };
    }

    ordersForGraph.forEach(order => {
      const dateStr = new Date(order.created_at).toISOString().split('T')[0];
      if (graphDataMap[dateStr]) {
        graphDataMap[dateStr].TOTAL += 1;
        const status = order.shipment_status;
        if (graphDataMap[dateStr][status] !== undefined) {
          graphDataMap[dateStr][status] += 1;
        }
      }
    });

    const graphData = Object.values(graphDataMap).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      // Basic stats
      totalUsers,
      activeUsers,
      totalOrders,
      totalRevenue: totalRevenue._sum.shipping_charge || 0,
      totalUserBalance: userBalanceAggregate._sum.wallet_balance || 0,
      pendingWithdrawals,
      recentOrders,

      // Order status counts
      deliveredOrders: deliveredOrdersCount,
      inTransitOrders: inTransitOrdersCount,
      dispatchedOrders: dispatchedOrdersCount,
      manifestedOrders: manifestedOrdersCount,
      rtoOrders: rtoOrdersCount,
      pendingOrders: pendingOrdersCount,
      notPickedOrders: notPickedOrdersCount,
      cancelledOrders: cancelledOrdersCount,

      // Metrics
      lastMonthOrders,
      totalWeightShipped: `${totalWeightShipped} kg`,
      avgDeliveryTime: `${avgDeliveryTimeDays} days`,
      deliverySuccessRate: `${deliverySuccessRate}%`,
      returnRate: `${returnRate}%`,
      monthlyGrowth,

      // Disputes
      weightDisputeOrders,
      rtoDisputeOrders,
      actionRequired,

      // Graph data
      graphData
    });
  } catch (error) {
    console.error('Admin dashboard stats error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getUsers = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { page = 1, pageSize = 10, search, status } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
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
    const searchTerm = search.trim();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(searchTerm);
    
    where.OR = [
      { id: isUuid ? searchTerm : undefined },
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { email: { contains: searchTerm, mode: 'insensitive' } },
      { mobile: { contains: searchTerm } }
    ].filter(condition => {
      const keys = Object.keys(condition);
      return keys.length > 0 && condition[keys[0]] !== undefined;
    });
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
          upi_id: true,
          security_deposit: true,
          min_commission_rate: true,
          max_commission_rate: true,
          _count: {
            select: { orders: true }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    const usersData = users.map(user => ({
      ...user,
      min_commission_rate: user.min_commission_rate ? parseFloat(user.min_commission_rate) : null,
      max_commission_rate: user.max_commission_rate ? parseFloat(user.max_commission_rate) : null
    }));

    res.json({
      data: usersData,
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

const changeUserPassword = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { userId } = req.params;
  const { new_password } = req.body;

  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    const hashedPassword = await bcrypt.hash(new_password, 10);
    
    await prisma.user.update({
      where: { id: userId },
      data: { password_hash: hashedPassword }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const changeUserEmail = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { userId } = req.params;
  const { email } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: { email: email.toLowerCase() }
    });

    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({ message: 'Email already in use by another user' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { email: email.toLowerCase() }
    });

    res.json({ message: 'Email updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getAllOrders = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const {
    page = 1,
    pageSize = 10,
    status,
    search,
    userId,
    shipmentType,
    paymentMode,
    orderType,
    from,
    to
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const pageSizeNum = parseInt(pageSize, 10);
  const offset = (pageNum - 1) * pageSizeNum;

  const where = {};

  if (status && status !== 'ALL') {
    where.shipment_status = status;
  }

  if (userId) {
    where.user_id = userId;
  }

  if (shipmentType && shipmentType !== 'ALL') {
    where.shipment_type = shipmentType;
  }

  if (paymentMode && paymentMode !== 'ALL') {
    where.payment_mode = paymentMode;
  }

  if (orderType && orderType !== 'ALL') {
    where.order_type = orderType;
  }

  if (from || to) {
    where.created_at = {};
    if (from) {
      where.created_at.gte = new Date(from);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.created_at.lte = toDate;
    }
  }

  if (search) {
    const searchTerm = search.trim();
    const searchNum = parseInt(searchTerm, 10);

    const orConditions = [
      { id: isNaN(searchNum) ? undefined : BigInt(searchNum) },
      { shiprocket_order_id: { contains: searchTerm, mode: 'insensitive' } },
      { shiprocket_shipment_id: { contains: searchTerm, mode: 'insensitive' } },
      { tracking_number: { contains: searchTerm, mode: 'insensitive' } },
      { label_url: { contains: searchTerm, mode: 'insensitive' } },
      { manifest_url: { contains: searchTerm, mode: 'insensitive' } },
      { vyom_order_id: { contains: searchTerm, mode: 'insensitive' } },
      { vyom_shipment_id: { contains: searchTerm, mode: 'insensitive' } },
      { courier_name: { contains: searchTerm, mode: 'insensitive' } },
    ].filter(condition => {
      const keys = Object.keys(condition);
      return keys.length > 0 && condition[keys[0]] !== undefined;
    });

    const matchingUsers = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { mobile: { contains: searchTerm } }
        ]
      },
      select: { id: true }
    });
    
    if (matchingUsers.length > 0) {
      const userIds = matchingUsers.map(u => u.id);
      orConditions.push({ user_id: { in: userIds } });
    }

    if (orConditions.length > 0) {
      where.OR = orConditions;
    }
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
            select: { name: true, email: true, mobile: true }
          },
          order_pickup_address: true,
          order_receiver_address: true
        }
      }),
      prisma.order.count({ where })
    ]);

    const ordersWithPriceBreakdown = orders.map(order => ({
      ...order,
      price_breakdown: {
        base_shipping_charge: order.base_shipping_charge,
        global_commission_rate: order.global_commission_rate,
        global_commission_amount: order.global_commission_amount,
        franchise_commission_rate: order.franchise_commission_rate,
        franchise_commission_amount: order.franchise_commission_amount,
        final_shipping_charge: order.shipping_charge
      }
    }));

    res.json({
      data: ordersWithPriceBreakdown,
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
  const { status, page = 1, pageSize = 10, search } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const pageSizeNum = parseInt(pageSize, 10);
  const offset = (pageNum - 1) * pageSizeNum;

  const baseWhere = {};
  if (status && status !== 'ALL') {
    baseWhere.status = status;
  }

  if (search) {
    const searchTerm = search.trim();
    const matchingUsers = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { mobile: { contains: searchTerm } }
        ]
      },
      select: { id: true }
    });
    const userIds = matchingUsers.map(u => u.id);
    if (userIds.length > 0) {
      baseWhere.user_id = { in: userIds };
    } else {
      return res.json({
        data: [],
        pagination: {
          total: 0,
          totalPages: 0,
          currentPage: pageNum,
          pageSize: pageSizeNum
        }
      });
    }
  }

  try {
    const userIdsWithWithdrawals = await prisma.commissionWithdrawal.findMany({
      where: baseWhere,
      select: { user_id: true },
      distinct: ['user_id']
    });

    const validUserIds = userIdsWithWithdrawals.map(w => w.user_id);

    const userGroups = await prisma.user.findMany({
      where: {
        id: { in: validUserIds }
      },
      select: {
        id: true,
        name: true,
        email: true,
        wallet_balance: true,
        upi_id: true,
        mobile: true,
        _count: {
          select: {
            withdrawals: {
              where: baseWhere
            }
          }
        }
      },
      skip: offset,
      take: pageSizeNum
    });

    const userIds = userGroups.map(u => u.id);

    const aggregatedData = await prisma.commissionWithdrawal.groupBy({
      by: ['user_id', 'status'],
      where: {
        ...baseWhere,
        user_id: { in: userIds }
      },
      _sum: {
        amount: true
      },
      _count: true
    });

    const totalUsers = await prisma.user.count({
      where: { id: { in: validUserIds } }
    });

    const groupedWithdrawals = userGroups.map(user => {
      const userData = aggregatedData.filter(d => d.user_id === user.id);
      
      const pendingRequests = userData.find(d => d.status === 'PENDING');
      const approvedRequests = userData.find(d => d.status === 'APPROVED');
      const rejectedRequests = userData.find(d => d.status === 'REJECTED');

      const totalPending = pendingRequests?._sum.amount || 0;
      const totalApproved = approvedRequests?._sum.amount || 0;
      const totalRejected = rejectedRequests?._sum.amount || 0;

      const overallStatus = pendingRequests ? 'PENDING' : (approvedRequests ? 'APPROVED' : (rejectedRequests ? 'REJECTED' : 'PENDING'));

      return {
        id: user.id,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          upi_id: user.upi_id,
          mobile: user.mobile,
          wallet_balance: user.wallet_balance
        },
        request_count: user._count.commissionWithdrawal,
        total_amount: totalPending + totalApproved + totalRejected,
        pending_amount: totalPending,
        approved_amount: totalApproved,
        rejected_amount: totalRejected,
        status: overallStatus,
        created_at: new Date().toISOString()
      };
    });

    res.json({
      data: groupedWithdrawals,
      pagination: {
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / pageSizeNum),
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
  const { status, reference_id } = req.body;

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
      const updateData = { status };
      if (status === 'APPROVED' && reference_id) {
        updateData.reference_id = reference_id;
      }

      const updatedWithdrawal = await tx.commissionWithdrawal.update({
        where: { id },
        data: updateData
      });

      // Funds were already debited from wallet when the withdrawal request was created (franchise.controller.js withdrawCommission).
      // APPROVE -> funds stay withheld (payout goes out via UPI), create DEBIT transaction record
      // REJECT -> just mark as rejected, funds stay debited (user can withdraw again from available balance)

      if (status === 'APPROVED') {
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
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
              }
            }
          });

          if (withdrawnCommissions.length === 0) {
            console.warn(`No withdrawn commission records found for withdrawal ${withdrawal.id}`);
          }
        }

        // Record the DEBIT transaction (funds already withheld on request)
        const currentUser = await tx.user.findUnique({
          where: { id: withdrawal.user_id },
          select: { wallet_balance: true }
        });

        await tx.transaction.create({
          data: {
            user_id: withdrawal.user_id,
            amount: withdrawal.amount,
            closing_balance: Number(currentUser.wallet_balance),
            type: 'DEBIT',
            category: 'COMMISSION',
            status: 'SUCCESS',
            description: withdrawal.franchise_id ? 'Franchise Commission Withdrawal Approved' : 'Referral Commission Withdrawal Approved',
            reference_id: withdrawal.id
          }
        });
      } else if (status === 'REJECTED') {
        // Just mark as rejected - no wallet credit, funds stay debited
        // User can withdraw again from their available balance
      }
      return updatedWithdrawal;
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message || 'Internal Server Error' });
  }
};

const processUserWithdrawals = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { userId } = req.params;
  const { status, reference_id } = req.body;

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const pendingWithdrawals = await prisma.commissionWithdrawal.findMany({
      where: {
        user_id: userId,
        status: 'PENDING'
      }
    });

    if (pendingWithdrawals.length === 0) {
      return res.status(404).json({ message: 'No pending withdrawal requests found for this user' });
    }

    const totalPendingAmount = pendingWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);

    if (status === 'APPROVED') {
      await prisma.$transaction(async (tx) => {
        for (const withdrawal of pendingWithdrawals) {
          const updateData = { status: 'APPROVED' };
          if (reference_id) {
            updateData.reference_id = reference_id;
          }

          await tx.commissionWithdrawal.update({
            where: { id: withdrawal.id },
            data: updateData
          });

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
          }

          const currentUser = await tx.user.findUnique({
            where: { id: withdrawal.user_id },
            select: { wallet_balance: true }
          });

          await tx.transaction.create({
            data: {
              user_id: withdrawal.user_id,
              amount: withdrawal.amount,
              closing_balance: Number(currentUser.wallet_balance),
              type: 'DEBIT',
              category: 'COMMISSION',
              status: 'SUCCESS',
              description: withdrawal.franchise_id ? 'Franchise Commission Withdrawal Approved' : 'Referral Commission Withdrawal Approved',
              reference_id: withdrawal.id
            }
          });
        }
      });
    } else if (status === 'REJECTED') {
      await prisma.commissionWithdrawal.updateMany({
        where: {
          user_id: userId,
          status: 'PENDING'
        },
        data: { status: 'REJECTED' }
      });
    }

    res.json({ 
      message: `Processed ${pendingWithdrawals.length} withdrawal requests`,
      processed_count: pendingWithdrawals.length,
      total_amount: totalPendingAmount,
      status
    });
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

// Get security refund days setting
const getSecurityRefundDays = async (req, res) => {
  const prisma = req.app.locals.prisma;
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'security_refund_days' }
    });
    res.json({ days: setting ? parseInt(setting.value) : 30 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Update security refund days setting
const updateSecurityRefundDays = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { days } = req.body;

  if (!days || days < 1 || days > 365) {
    return res.status(400).json({ message: 'Days must be between 1 and 365' });
  }

  try {
    const setting = await prisma.systemSetting.upsert({
      where: { key: 'security_refund_days' },
      update: { value: days.toString() },
      create: {
        key: 'security_refund_days',
        value: days.toString(),
        description: 'Number of days after which security deposit is refunded'
      }
    });
    res.json({ days: parseInt(setting.value) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getSecurityRefundSchedule = async (req, res) => {
  const prisma = req.app.locals.prisma;
  try {
    const schedule = await prisma.securityRefundSchedule.findFirst({
      orderBy: { created_at: 'desc' }
    });
    res.json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const setSecurityRefundSchedule = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { scheduled_date, is_active } = req.body;

  try {
    // Frontend sends IST datetime string. Convert to UTC for storage.
    let parsedDate;
    if (scheduled_date) {
      parsedDate = moment.tz(scheduled_date, 'Asia/Kolkata').toDate();
    }

    // Check if schedule exists, update or create
    const existing = await prisma.securityRefundSchedule.findFirst({
      orderBy: { created_at: 'desc' }
    });

    let schedule;
    if (existing) {
      schedule = await prisma.securityRefundSchedule.update({
        where: { id: existing.id },
        data: {
          scheduled_date: parsedDate,
          is_active: is_active !== undefined ? is_active : true
        }
      });
    } else {
      schedule = await prisma.securityRefundSchedule.create({
        data: {
          scheduled_date: parsedDate,
          is_active: is_active !== undefined ? is_active : true
        }
      });
    }
    res.json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get all security deposits (admin)
const getAllSecurityDeposits = async (req, res) => {
  const prisma = req.app.locals.prisma;
  try {
    const { page = 1, pageSize = 20, status, userId, search } = req.query;
    
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSizeNum = parseInt(pageSize, 10);
    const offset = (pageNum - 1) * pageSizeNum;

    const where = {};
    if (status) {
      where.status = status;
    }
    if (userId) {
      where.user_id = userId;
    }

    if (search) {
        const searchTerm = search.trim();
        const matchingUsers = await prisma.user.findMany({
          where: {
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { email: { contains: searchTerm, mode: 'insensitive' } },
              { mobile: { contains: searchTerm } }
            ]
          },
          select: { id: true }
        });
        const userIds = matchingUsers.map(u => u.id);
        if (userIds.length > 0) {
          where.user_id = { in: userIds };
        } else {
          return res.json({
            data: [],
            pagination: {
              total: 0,
              totalPages: 0,
              currentPage: pageNum,
              pageSize: pageSizeNum
            }
          });
        }
      }

    const [deposits, total] = await Promise.all([
      prisma.securityDeposit.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              shipment_status: true,
              total_amount: true,
              shipping_charge: true,
              tracking_number: true,
              courier_name: true,
              shiprocket_order_id: true,
              shiprocket_shipment_id: true,
              order_type: true,
              payment_mode: true,
              created_at: true,
              delivered_at: true
            }
          },
          user: {
            select: {
              name: true,
              email: true,
              mobile: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: pageSizeNum
      }),
      prisma.securityDeposit.count({ where })
    ]);

    res.json({
      data: deposits,
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

// Get security deposits by order ID
const getSecurityDepositByOrder = async (req, res) => {
  const prisma = req.app.locals.prisma;
  try {
    const { orderId } = req.params;
    const deposit = await prisma.securityDeposit.findFirst({
      where: { order_id: BigInt(orderId) },
      include: {
        order: {
          select: {
            id: true,
            shipment_status: true,
            total_amount: true,
            shipping_charge: true
          }
        },
        user: {
          select: {
            name: true,
            email: true,
            mobile: true
          }
        }
      }
    });
    res.json(deposit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getAllTransactions = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const prisma = req.app.locals.prisma;
  const { page = 1, pageSize = 10, type, category, search, userId, fromDate, toDate } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const pageSizeNum = parseInt(pageSize, 10);
  const offset = (pageNum - 1) * pageSizeNum;

  const where = {};

  if (type && type !== 'ALL') {
    where.type = type;
  }

  if (category && category !== 'ALL') {
    where.category = category;
  }

  if (userId) {
    where.user_id = userId;
  }

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
    const searchTerm = search.trim();
    const matchingUsers = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { mobile: { contains: searchTerm } }
        ]
      },
      select: { id: true }
    });
    
    if (matchingUsers.length > 0) {
      const userIds = matchingUsers.map(u => u.id);
      where.user_id = { in: userIds };
    } else {
      return res.json({
        data: [],
        pagination: {
          total: 0,
          totalPages: 0,
          currentPage: pageNum,
          pageSize: pageSizeNum
        }
      });
    }
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

const getAllCODOrders = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { page = 1, pageSize = 10, remittance_status, search, order_source } = req.query;
  const adminId = req.user.id;

  const pageNum = Math.max(1, parseInt(page, 10));
  const pageSizeNum = parseInt(pageSize, 10);
  const offset = (pageNum - 1) * pageSizeNum;

  const baseWhere = {
    payment_mode: 'COD',
    shipment_status: {
      notIn: ['CANCELLED', 'DRAFT']
    }
  };

  if (order_source === 'MY_ORDERS') {
    baseWhere.user_id = adminId;
  } else if (order_source === 'USER_ORDERS') {
    baseWhere.user_id = { not: adminId };
  }

  if (search) {
    const searchTerm = search.trim();
    const searchNum = parseInt(searchTerm, 10);

    const matchingUsers = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { mobile: { contains: searchTerm } }
        ]
      },
      select: { id: true }
    });
    
    const userIds = matchingUsers.map(u => u.id);
    if (userIds.length > 0) {
      baseWhere.user_id = { in: userIds };
    }

    if (!isNaN(searchNum)) {
      const orderById = await prisma.order.findMany({
        where: { id: BigInt(searchNum), ...baseWhere },
        select: { user_id: true }
      });
      if (orderById.length > 0) {
        const userIdFromOrder = orderById[0].user_id;
        baseWhere.user_id = userIdFromOrder;
      }
    }
  }

  const statusWhere = remittance_status && remittance_status !== 'ALL' 
    ? { remittance_status } 
    : {};

  try {
    const userGroups = await prisma.user.findMany({
      where: {
        id: {
          in: await prisma.order.findMany({
            where: baseWhere,
            select: { user_id: true },
            distinct: ['user_id']
          }).then(results => results.map(r => r.user_id))
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        upi_id: true,
        mobile: true,
        _count: {
          select: {
            orders: {
              where: {
                ...baseWhere,
                ...statusWhere,
                payment_mode: 'COD',
                shipment_status: { notIn: ['CANCELLED', 'DRAFT'] }
              }
            }
          }
        }
      },
      skip: offset,
      take: pageSizeNum,
      orderBy: { created_at: 'desc' }
    });

    const userIds = userGroups.map(u => u.id);
    
    const aggregatedData = await prisma.order.groupBy({
      by: ['user_id', 'remittance_status'],
      where: {
        ...baseWhere,
        user_id: { in: userIds }
      },
      _sum: {
        cod_amount: true,
        remitted_amount: true
      },
      _count: true
    });

    const totalUsers = await prisma.user.count({
      where: {
        id: {
          in: await prisma.order.findMany({
            where: baseWhere,
            select: { user_id: true },
            distinct: ['user_id']
          }).then(results => results.map(r => r.user_id))
        }
      }
    });

    const latestOrders = await prisma.order.findMany({
      where: {
        user_id: { in: userIds }
      },
      orderBy: { created_at: 'desc' },
      distinct: ['user_id'],
      select: {
        user_id: true,
        order_pickup_address: true,
        order_receiver_address: true,
        pickup_location: true
      }
    });

    const allUserOrders = await prisma.order.findMany({
      where: {
        user_id: { in: userIds },
        ...baseWhere
      },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        user_id: true,
        cod_amount: true,
        shipment_status: true,
        created_at: true,
        tracking_number: true
      },
      take: 50
    });

    const ordersByUser = allUserOrders.reduce((acc, order) => {
      if (!acc[order.user_id]) acc[order.user_id] = [];
      acc[order.user_id].push({
        id: order.id.toString(),
        cod_amount: order.cod_amount,
        shipment_status: order.shipment_status,
        created_at: order.created_at.toISOString(),
        tracking_number: order.tracking_number
      });
      return acc;
    }, {});

    const ordersMap = latestOrders.reduce((acc, order) => {
      acc[order.user_id] = order;
      return acc;
    }, {});

    const groupedOrders = userGroups.map(user => {
      const userData = aggregatedData.filter(d => d.user_id === user.id);
      
      const pendingOrders = userData.find(d => d.remittance_status === 'PENDING');
      const processingOrders = userData.find(d => d.remittance_status === 'PROCESSING');
      const remittedOrders = userData.find(d => d.remittance_status === 'REMITTED');
      const failedOrders = userData.find(d => d.remittance_status === 'FAILED');

      const totalCOD = userData.reduce((sum, d) => sum + (d._sum.cod_amount || 0), 0);
      const totalRemitted = userData.reduce((sum, d) => sum + (d._sum.remitted_amount || 0), 0);

      const overallStatus = pendingOrders || processingOrders 
        ? (processingOrders ? 'PROCESSING' : 'PENDING')
        : (failedOrders ? 'FAILED' : (remittedOrders ? 'REMITTED' : 'PENDING'));

      const latestOrder = ordersMap[user.id];

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          upi_id: user.upi_id,
          mobile: user.mobile
        },
        order_count: user._count.orders,
        total_cod_amount: totalCOD,
        total_remitted_amount: totalRemitted,
        pending_amount: pendingOrders?._sum.cod_amount || 0,
        remittance_status: overallStatus,
        order_pickup_address: latestOrder?.order_pickup_address,
        order_receiver_address: latestOrder?.order_receiver_address,
        pickup_location: latestOrder?.pickup_location,
        orders: ordersByUser[user.id] || []
      };
    });

    const summaryResult = await prisma.order.aggregate({
      where: {
        ...baseWhere,
        remittance_status: { in: ['PENDING', 'PROCESSING'] }
      },
      _sum: { cod_amount: true }
    });

    const totalRemittedResult = await prisma.order.aggregate({
      where: {
        ...baseWhere,
        remittance_status: 'REMITTED'
      },
      _sum: { remitted_amount: true }
    });

    res.json({
      data: groupedOrders,
      pagination: {
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / pageSizeNum),
        currentPage: pageNum,
        pageSize: pageSizeNum
      },
      summary: {
        totalPendingCOD: summaryResult._sum.cod_amount || 0,
        totalRemitted: totalRemittedResult._sum.remitted_amount || 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const updateOrderRemittance = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { id } = req.params;
  const { remittance_status, remitted_amount, remittance_ref_id, payout_status } = req.body;

  try {
    const order = await prisma.order.findUnique({
      where: { id: BigInt(id) }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.payment_mode !== 'COD') {
      return res.status(400).json({ message: 'Only COD orders can have status updated' });
    }

    const updateData = {};

    if (remittance_status && ['NOT_APPLICABLE', 'PENDING', 'PROCESSING', 'REMITTED', 'FAILED'].includes(remittance_status)) {
      updateData.remittance_status = remittance_status;
      if (remittance_status === 'REMITTED') {
        updateData.remitted_amount = remitted_amount || order.cod_amount;
        updateData.remitted_at = new Date();
        if (remittance_ref_id) {
          updateData.remittance_ref_id = remittance_ref_id;
        }
      }
    } else if (remittance_status) {
      return res.status(400).json({ message: 'Invalid remittance status' });
    }

    if (payout_status && ['PENDING', 'COMPLETED'].includes(payout_status)) {
      updateData.payout_status = payout_status;
    } else if (payout_status) {
      return res.status(400).json({ message: 'Invalid payout status' });
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No valid status provided to update' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: BigInt(id) },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true, upi_id: true }
        }
      }
    });

    res.json({ message: 'Remittance status updated', order: updatedOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const updateUserCODRemittance = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { userId } = req.params;
  const { remittance_status, remitted_amount, remittance_ref_id, payout_status } = req.body;

  const adminId = req.user.id;

  try {
    const orders = await prisma.order.findMany({
      where: {
        user_id: userId,
        payment_mode: 'COD',
        shipment_status: {
          notIn: ['CANCELLED', 'DRAFT']
        },
        remittance_status: { in: ['PENDING', 'PROCESSING', 'FAILED'] }
      }
    });

    if (orders.length === 0) {
      return res.status(404).json({ message: 'No eligible COD orders found for this user' });
    }

    const totalCODAmount = orders.reduce((sum, order) => sum + Number(order.cod_amount), 0);
    const amountToRemit = remitted_amount !== undefined ? remitted_amount : totalCODAmount;

    const updateData = {};
    
    if (remittance_status && ['NOT_APPLICABLE', 'PENDING', 'PROCESSING', 'REMITTED', 'FAILED'].includes(remittance_status)) {
      if (remittance_status === 'REMITTED') {
        updateData.remittance_status = remittance_status;
        updateData.remitted_amount = amountToRemit;
        updateData.remitted_at = new Date();
        if (remittance_ref_id) {
          updateData.remittance_ref_id = remittance_ref_id;
        }
      } else {
        updateData.remittance_status = remittance_status;
      }
    }

    if (payout_status && ['PENDING', 'COMPLETED'].includes(payout_status)) {
      updateData.payout_status = payout_status;
    }

    const updatedOrders = await prisma.order.updateMany({
      where: {
        user_id: userId,
        payment_mode: 'COD',
        shipment_status: {
          notIn: ['CANCELLED', 'DRAFT']
        },
        remittance_status: { in: ['PENDING', 'PROCESSING', 'FAILED'] }
      },
      data: updateData
    });

    res.json({ 
      message: `Remittance status updated for ${updatedOrders.count} orders`,
      updated_count: updatedOrders.count,
      total_cod_amount: totalCODAmount,
      remitted_amount: amountToRemit
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getOrderById = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { id } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id: BigInt(id) },
      include: {
        user: {
          select: { id: true, name: true, email: true, mobile: true }
        },
        order_pickup_address: true,
        order_receiver_address: true
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const productValue = Array.isArray(order.products) 
      ? order.products.reduce((sum, p) => sum + (Number(p.price) * Number(p.quantity || 1)), 0) 
      : 0;

    res.json({
      ...order,
      productValue,
      price_breakdown: {
        base_shipping_charge: order.base_shipping_charge,
        global_commission_rate: order.global_commission_rate,
        global_commission_amount: order.global_commission_amount,
        franchise_commission_rate: order.franchise_commission_rate,
        franchise_commission_amount: order.franchise_commission_amount,
        final_shipping_charge: order.shipping_charge
      }
    });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2023') {
      return res.status(404).json({ message: 'Invalid order ID format' });
    }
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getKycUsers = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { page = 1, pageSize = 10, status, search } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const pageSizeNum = parseInt(pageSize, 10);
  const offset = (pageNum - 1) * pageSizeNum;

  const where = {

  };

  if (status && status !== 'ALL') {
    where.kyc_status = status;
  } else {
    // By default, maybe show everything except PENDING if not specified? 
    // Or just show everything. Let's show everything but provide filter.
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { mobile: { contains: search, mode: 'insensitive' } },
      { pan_number: { contains: search, mode: 'insensitive' } },
      { aadhaar_number: { contains: search, mode: 'insensitive' } },
      { gst_number: { contains: search, mode: 'insensitive' } }
    ];
  }

  try {
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip: offset,
        take: pageSizeNum,
        orderBy: { updated_at: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          kyc_status: true,
          pan_number: true,
          pan_verified: true,
          aadhaar_number: true,
          aadhaar_verified: true,
          gst_number: true,
          gst_verified: true,
          created_at: true,
          updated_at: true
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
    console.error('Get KYC users error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const updateKycStatus = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { userId } = req.params;
  const { kyc_status, pan_verified, aadhaar_verified, gst_verified } = req.body;

  if (!['PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED'].includes(kyc_status)) {
    return res.status(400).json({ message: 'Invalid KYC status' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData = { kyc_status };
    if (pan_verified !== undefined) updateData.pan_verified = pan_verified;
    if (aadhaar_verified !== undefined) updateData.aadhaar_verified = aadhaar_verified;
    if (gst_verified !== undefined) updateData.gst_verified = gst_verified;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        kyc_status: true,
        pan_verified: true,
        aadhaar_verified: true,
        gst_verified: true
      }
    });

    res.json({ message: 'KYC status updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Update KYC status error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const setUserCustomRates = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { id } = req.params;
  const { min_commission_rate, max_commission_rate } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(id) }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: BigInt(id) },
      data: {
        min_commission_rate: min_commission_rate,
        max_commission_rate: max_commission_rate
      }
    });

    res.json({ message: 'User custom rates updated', user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
const refundSecurityDeposit = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { userId } = req.params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, security_deposit: true, wallet_balance: true }
      });

      if (!user) throw new Error('User not found');

      const depositAmount = Number(user.security_deposit);
      if (depositAmount <= 0) throw new Error('No security deposit to refund');

      await tx.user.update({
        where: { id: userId },
        data: {
          security_deposit: 0,
          wallet_balance: { increment: depositAmount }
        }
      });

      const updatedUser = await tx.user.findUnique({
        where: { id: userId },
        select: { wallet_balance: true, security_deposit: true }
      });

      await tx.transaction.create({
        data: {
          user_id: userId,
          amount: depositAmount,
          closing_balance: Number(updatedUser.security_deposit),
          type: 'DEBIT',
          category: 'SECURITY_DEPOSIT',
          status: 'SUCCESS',
          description: 'Security Deposit Refunded to Wallet',
        }
      });

      await tx.transaction.create({
        data: {
          user_id: userId,
          amount: depositAmount,
          closing_balance: Number(updatedUser.wallet_balance),
          type: 'CREDIT',
          category: 'REFUND',
          status: 'SUCCESS',
          description: 'Security Deposit Refund',
        }
      });

      return { userId, refundedAmount: depositAmount };
    });

    res.json({ message: 'Security deposit refunded to wallet successfully', data: result });
  } catch (error) {
    console.error('Refund security deposit error:', error);
    res.status(400).json({ message: error.message || 'Internal Server Error' });
  }
};

const getWalletPlans = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { status } = req.query;

  try {
    const where = {};
    if (status === 'active') {
      where.is_active = true;
    } else if (status === 'inactive') {
      where.is_active = false;
    }

    const plans = await prisma.walletPlan.findMany({
      where,
      orderBy: { recharge_amount: 'asc' }
    });

    const plansData = plans.map(plan => ({
      ...plan,
      recharge_amount: Number(plan.recharge_amount),
      discount_percentage: Number(plan.discount_percentage)
    }));

    res.json({ data: plansData });
  } catch (error) {
    console.error('Get wallet plans error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const createWalletPlan = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { name, recharge_amount, discount_percentage } = req.body;

  if (!name || recharge_amount === undefined || discount_percentage === undefined) {
    return res.status(400).json({ message: 'Name, recharge_amount, and discount_percentage are required' });
  }

  const rechargeAmount = parseFloat(recharge_amount);
  const discountPercent = parseFloat(discount_percentage);

  if (isNaN(rechargeAmount) || rechargeAmount <= 0) {
    return res.status(400).json({ message: 'Invalid recharge amount' });
  }

  if (isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    return res.status(400).json({ message: 'Discount percentage must be between 0 and 100' });
  }

  try {
    const existingPlan = await prisma.walletPlan.findFirst({
      where: { recharge_amount: rechargeAmount }
    });

    if (existingPlan) {
      return res.status(400).json({ message: 'A plan with this recharge amount already exists' });
    }

    const plan = await prisma.walletPlan.create({
      data: {
        name: name.trim(),
        recharge_amount: rechargeAmount,
        discount_percentage: discountPercent
      }
    });

    res.status(201).json({
      message: 'Wallet plan created successfully',
      plan: {
        ...plan,
        recharge_amount: Number(plan.recharge_amount),
        discount_percentage: Number(plan.discount_percentage)
      }
    });
  } catch (error) {
    console.error('Create wallet plan error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const updateWalletPlan = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { id } = req.params;
  const { name, recharge_amount, discount_percentage, is_active } = req.body;

  try {
    const existingPlan = await prisma.walletPlan.findUnique({
      where: { id }
    });

    if (!existingPlan) {
      return res.status(404).json({ message: 'Wallet plan not found' });
    }

    const updateData = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: 'Name cannot be empty' });
      }
      updateData.name = name.trim();
    }

    if (recharge_amount !== undefined) {
      const rechargeAmount = parseFloat(recharge_amount);
      if (isNaN(rechargeAmount) || rechargeAmount <= 0) {
        return res.status(400).json({ message: 'Invalid recharge amount' });
      }

      const duplicatePlan = await prisma.walletPlan.findFirst({
        where: {
          recharge_amount: rechargeAmount,
          id: { not: id }
        }
      });

      if (duplicatePlan) {
        return res.status(400).json({ message: 'Another plan with this recharge amount already exists' });
      }

      updateData.recharge_amount = rechargeAmount;
    }

    if (discount_percentage !== undefined) {
      const discountPercent = parseFloat(discount_percentage);
      if (isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100) {
        return res.status(400).json({ message: 'Discount percentage must be between 0 and 100' });
      }
      updateData.discount_percentage = discountPercent;
    }

    if (is_active !== undefined) {
      updateData.is_active = Boolean(is_active);
    }

    const updatedPlan = await prisma.walletPlan.update({
      where: { id },
      data: updateData
    });

    res.json({
      message: 'Wallet plan updated successfully',
      plan: {
        ...updatedPlan,
        recharge_amount: Number(updatedPlan.recharge_amount),
        discount_percentage: Number(updatedPlan.discount_percentage)
      }
    });
  } catch (error) {
    console.error('Update wallet plan error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const deleteWalletPlan = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const { id } = req.params;
  const { permanent } = req.query;

  try {
    const existingPlan = await prisma.walletPlan.findUnique({
      where: { id }
    });

    if (!existingPlan) {
      return res.status(404).json({ message: 'Wallet plan not found' });
    }

    // If permanent=true, actually delete from database
    if (permanent === 'true') {
      await prisma.walletPlan.delete({
        where: { id }
      });
      res.json({ message: 'Wallet plan deleted permanently' });
    } else {
      // Default: soft delete (deactivate)
      await prisma.walletPlan.update({
        where: { id },
        data: { is_active: false }
      });
      res.json({ message: 'Wallet plan deactivated successfully' });
    }
  } catch (error) {
    console.error('Delete wallet plan error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getActiveWalletPlans = async (req, res) => {
  const prisma = req.app.locals.prisma;

  try {
    const plans = await prisma.walletPlan.findMany({
      where: { is_active: true },
      orderBy: { recharge_amount: 'asc' }
    });

    const plansData = plans.map(plan => ({
      ...plan,
      recharge_amount: Number(plan.recharge_amount),
      discount_percentage: Number(plan.discount_percentage)
    }));

    res.json({ data: plansData });
  } catch (error) {
    console.error('Get active wallet plans error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  sendAdminForgotPasswordOtp,
  resetAdminPassword,
  getDashboardStats,
  getUsers,
  toggleUserStatus,
  changeUserPassword,
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
  getUserCommissionBounds,
  setUserCustomRates,
  getAllCODOrders,
  updateOrderRemittance,
  updateUserCODRemittance,
  getOrderById,
  getKycUsers,
  updateKycStatus,
  refundSecurityDeposit,
  getWalletPlans,
  createWalletPlan,
  updateWalletPlan,
  deleteWalletPlan,
  getActiveWalletPlans,
  getSecurityRefundSchedule,
  setSecurityRefundSchedule,
  getSecurityRefundDays,
  updateSecurityRefundDays,
  getAllSecurityDeposits,
  getSecurityDepositByOrder,
  changeUserEmail,
  getWithdrawals,
  processWithdrawal,
  processUserWithdrawals
};
