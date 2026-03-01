const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const prisma = require('./utils/prisma');

async function main() {
  try {
    console.log('Testing transaction as in admin.controller.js...');
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
    console.log('Transaction Success!');
    console.log('totalUsers:', totalUsers);
    console.log('totalRevenue:', totalRevenue._sum.shipping_charge);
    console.log('recentOrders count:', recentOrders.length);
  } catch (error) {
    console.error('Error in transaction:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
