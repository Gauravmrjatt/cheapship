const cron = require('node-cron');
const moment = require('moment-timezone');

function initializeCronJobs(prisma) {
  console.log('Initializing cron jobs...');

  // Cron job: runs every minute to check if security refund should be triggered
  cron.schedule('* * * * *', async () => {
    try {
      if (!prisma || !prisma.securityRefundSchedule) {
        console.log('Prisma not initialized yet, skipping security refund cron...');
        return;
      }

      // Get active schedule (latest one)
      const schedule = await prisma.securityRefundSchedule.findFirst({
        where: { is_active: true },
        orderBy: { created_at: 'desc' }
      });

      if (!schedule) {
        return;
      }

      const nowIST = moment().tz('Asia/Kolkata');

      // Check if already triggered today (using IST date)
      if (schedule.last_triggered_at) {
        const lastTriggeredIST = moment(schedule.last_triggered_at).tz('Asia/Kolkata');
        if (lastTriggeredIST.isSame(nowIST, 'day')) {
          console.log('Security refund already triggered today, skipping...');
          return;
        }
      }

      // Parse the scheduled date/time as IST
      const scheduledIST = moment.tz(schedule.scheduled_date, 'Asia/Kolkata');

      if (nowIST.isBefore(scheduledIST)) {
        console.log(`Security refund scheduled time not yet reached. Now IST: ${nowIST.format('YYYY-MM-DD HH:mm:ss')}, Scheduled IST: ${scheduledIST.format('YYYY-MM-DD HH:mm:ss')}`);
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
                description: `Security deposit refund triggered on ${moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss')} IST. Refunded ${data.deposits.length} orders.`,
                reference_id: `BATCH_${Date.now()}`
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

  console.log('Cron jobs initialized successfully');
}

module.exports = { initializeCronJobs };
