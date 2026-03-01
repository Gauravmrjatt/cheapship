
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('Testing FULL dashboard transaction...');
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
    console.log('Success! Full transaction completed.');
    console.log('totalRevenue:', totalRevenue);
  } catch (error) {
    console.error('Error in findMany:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
