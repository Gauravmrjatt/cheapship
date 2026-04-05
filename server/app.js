require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const app = express();
const prisma = require('./utils/prisma');
// this is a text file
// Make Prisma client available throughout the application
app.locals.prisma = prisma;

// Database Connection Check
async function checkDbConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    // process.exit(1); // Optional: Exit if DB connection fails
  }
}

checkDbConnection();

// Cron job for security deposit refund - runs every minute
const cron = require('node-cron');

// Helper function to check if date is today
function isSameDay(date1, date2) {
  if (!date1 || !date2) return false;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

// Cron job: runs every minute to check if security refund should be triggered
cron.schedule('* * * * *', async () => {
  try {
    const prisma = app.locals.prisma;
    
    if (!prisma || !prisma.securityRefundSchedule) {
      console.log('Prisma not initialized yet, skipping security refund cron...');
      return;
    }
    
    // Get active schedule
    const schedule = await prisma.securityRefundSchedule.findFirst({
      where: { is_active: true }
    });

    if (!schedule) {
      return; // No active schedule
    }

    // Check if already triggered today
    if (schedule.last_triggered_at && isSameDay(schedule.last_triggered_at, new Date())) {
      console.log('Security refund already triggered today, skipping...');
      return;
    }

    // Check if scheduled time has passed
    if (new Date() < new Date(schedule.scheduled_date)) {
      console.log('Security refund scheduled time not yet reached');
      return;
    }

    console.log('Starting security deposit refund process...');

    // Get all security deposits with remaining amount > 0 for delivered orders
    const securityDeposits = await prisma.securityDeposit.findMany({
      where: {
        remaining: { gt: 0 },
        status: { in: ['ACTIVE', 'PARTIAL'] }
      },
      include: {
        order: {
          select: { shipment_status: true }
        }
      }
    });

    // Filter to only delivered orders
    const eligibleDeposits = securityDeposits.filter(sd => sd.order && sd.order.shipment_status === 'DELIVERED');

    console.log(`Found ${eligibleDeposits.length} eligible security deposits to refund`);

    // Group by user for batch processing
    const userRefundMap = new Map();
    for (const deposit of eligibleDeposits) {
      const current = userRefundMap.get(deposit.user_id) || { totalRefund: 0, deposits: [] };
      current.totalRefund += Number(deposit.remaining);
      current.deposits.push(deposit);
      userRefundMap.set(deposit.user_id, current);
    }

    // Process refund for each user
    for (const [userId, data] of userRefundMap) {
      try {
        await prisma.$transaction(async (tx) => {
          // Get current user wallet info
          const user = await tx.user.findUnique({
            where: { id: userId },
            select: { security_deposit: true, wallet_balance: true }
          });

          if (!user || user.security_deposit <= 0) {
            return;
          }

          const refundAmount = Math.min(data.totalRefund, Number(user.security_deposit));

          if (refundAmount <= 0) {
            return;
          }

          // Deduct from security, add to wallet
          await tx.user.update({
            where: { id: userId },
            data: {
              security_deposit: { decrement: refundAmount },
              wallet_balance: { increment: refundAmount }
            }
          });

          // Update all security deposit records for this user to REFUNDED
          for (const deposit of data.deposits) {
            await tx.securityDeposit.update({
              where: { id: deposit.id },
              data: {
                remaining: 0,
                status: 'REFUNDED',
                updated_at: new Date()
              }
            });
          }

          // Create transaction record
          await tx.transaction.create({
            data: {
              user_id: userId,
              amount: refundAmount,
              closing_balance: Number(user.wallet_balance) + refundAmount,
              type: 'CREDIT',
              category: 'REFUND',
              status: 'SUCCESS',
              description: `Security deposit refund triggered on ${new Date().toISOString()}. Refunded ${data.deposits.length} orders.`,
              reference_id: `BATCH_${new Date().getTime()}`
            }
          });

          console.log(`Refund of ₹${refundAmount} processed for user ${userId} (${data.deposits.length} orders)`);
        });
      } catch (userError) {
        console.error(`Error processing refund for user ${userId}:`, userError);
      }
    }

    // Update schedule: set is_active to false and update last_triggered_at
    await prisma.securityRefundSchedule.update({
      where: { id: schedule.id },
      data: {
        is_active: false,
        last_triggered_at: new Date()
      }
    });

    console.log('Security deposit refund process completed');

  } catch (error) {
    console.error('Error in security refund cron job:', error);
  }
});

// Secure HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors());

// Logging
app.use(logger('dev'));
console.log("CHEAPSHIP SERVER INITIALIZING WITH FRANCHISE ROUTES");

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

app.use('/api/v1', require("./routes/v1.route"));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/* ==============================
   Health Check Route
============================== */

app.get('/health', async (req, res) => {
  let dbStatus = 'UP';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    dbStatus = 'DOWN';
  }

  res.status(dbStatus === 'UP' ? 200 : 503).json({
    status: dbStatus === 'UP' ? 'OK' : 'DEGRADED',
    database: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

/* ==============================
   404 Handler
============================== */

app.use((req, res, next) => {
  next(createError(404, "Route Not Found"));
});

/* ==============================
   Global Error Handler
============================== */

app.use((err, req, res, next) => {
  const isDev = req.app.get('env') === 'development';

  console.error(err.stack);

  res.status(err.status || 500);

  // If API request → return JSON
  if (req.originalUrl.startsWith('/api')) {
    return res.json({
      success: false,
      message: err.message,
      ...(isDev && { stack: err.stack })
    });
  }

  // Otherwise render error page
  res.render('error', {
    message: err.message,
    error: isDev ? err : {}
  });
});

module.exports = app;
