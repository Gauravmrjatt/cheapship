const cron = require('node-cron');
const vyom = require('../utils/vyom');

const TERMINAL_STATUSES = ['DELIVERED', 'CANCELLED', 'RTO', 'RTO_DELIVERED'];

function log(message) { console.log(message); }
function logWarn(message) { console.warn(message); }
function logError(message) { console.error(message); }

function getLatestStatus(vData) {
  const details = vData?.tracking_details;
  if (details) {
    const items = Array.isArray(details) ? details : [details];
    const last = items[items.length - 1];
    if (last?.status) return last.status;
  }
  return vData?.remarks || vData?.tracking_status || vData?.unified_status || '';
}

function parseTrackingDetails(trackingDetails) {
  if (!trackingDetails) return [];
  const items = Array.isArray(trackingDetails) ? trackingDetails : [trackingDetails];
  return items.map((scan) => {
    const scanDate = scan.date || scan.timestamp || scan.created_at || scan.scanned_at || scan.status_date_time || scan.status_date || new Date().toISOString();
    const scanActivity = scan.instructions || scan.activity || scan.remarks || scan.status || scan.scan || '';
    const scanLocation = scan.status_location || scan.location || scan.scanned_location || scan.city || '';
    return {
      date: new Date(scanDate),
      activity: scanActivity,
      location: scanLocation,
    };
  }).filter((s) => s.activity);
}

async function processVyomOrder(tx, order, vData) {
  if (!vData) return;

  const rawStatus = getLatestStatus(vData);
  const newStatus = vyom.mapVyomStatus(rawStatus);

  if (newStatus === order.shipment_status) return;

  const updateData = { shipment_status: newStatus };

  if (newStatus === 'DELIVERED') {
    updateData.delivered_at = new Date();
    if (order.payment_mode === 'COD') {
      updateData.remittance_status = 'PENDING';
    }
  }

  await tx.order.update({
    where: { id: order.id },
    data: updateData,
  });

  await tx.shipmentHistory.create({
    data: {
      order_id: order.id,
      status: rawStatus || 'UPDATED',
      status_date: new Date(),
      location: '',
      shipment_status: newStatus,
      activity: rawStatus,
    },
  });

  if (newStatus === 'CANCELLED') {
    if (Number(order.shipping_charge || 0) > 0) {
      const refundAmount = Number(order.shipping_charge);
      await tx.user.update({
        where: { id: order.user_id },
        data: { wallet_balance: { increment: refundAmount } },
      });
      const updatedUser = await tx.user.findUnique({
        where: { id: order.user_id },
        select: { wallet_balance: true },
      });
      await tx.transaction.create({
        data: {
          user_id: order.user_id,
          amount: refundAmount,
          closing_balance: Number(updatedUser.wallet_balance),
          type: 'CREDIT',
          category: 'REFUND',
          status: 'SUCCESS',
          description: `Shipping charge refunded for cancelled Order #${order.id}`,
          reference_id: String(order.id),
        },
      });
    }
  }

  const scans = parseTrackingDetails(vData.tracking_details);
  if (scans.length > 0) {
    const existingHistory = await tx.shipmentHistory.findMany({
      where: { order_id: order.id },
      select: { activity: true, status_date: true },
    });

    const newEntries = [];
    for (const scan of scans) {
      if (!scan.date) continue;
      const exists = existingHistory.some((h) =>
        h.activity === scan.activity &&
        Math.abs(new Date(h.status_date).getTime() - scan.date.getTime()) < 60000
      );
      if (!exists) {
        newEntries.push({
          order_id: order.id,
          status: scan.activity || 'UPDATED',
          status_date: scan.date,
          location: scan.location || '',
          shipment_status: vyom.mapVyomStatus(scan.activity),
          activity: scan.activity || '',
        });
      }
    }

    if (newEntries.length > 0) {
      await tx.shipmentHistory.createMany({ data: newEntries, skipDuplicates: true });
    }
  }

  log(`[VyomCron] Order #${order.id}: ${order.shipment_status} → ${newStatus} (${rawStatus})`);
}

async function pollVyomOrders(prisma) {
  if (!vyom.isConfigured()) {
    log('[VyomCron] Vyom not configured — skipping');
    return;
  }

  log('[VyomCron] Poll started');

  try {
    const orders = await prisma.order.findMany({
      where: {
        is_vyom: true,
        tracking_number: { not: null },
        shipment_status: { notIn: TERMINAL_STATUSES },
      },
      select: {
        id: true,
        user_id: true,
        shipment_status: true,
        tracking_number: true,
        shipping_charge: true,
        payment_mode: true,
      },
    });

    if (orders.length === 0) {
      log('[VyomCron] No active Vyom orders to poll');
      return;
    }

    log(`[VyomCron] Polling ${orders.length} active Vyom orders...`);

    for (const order of orders) {
      try {
        const trackingResult = await vyom.getOrderByTracking(order.tracking_number);
        if (!trackingResult || trackingResult.error) {
          logWarn(`[VyomCron] Tracking failed for order #${order.id}: ${trackingResult?.message || 'Unknown error'}`);
          continue;
        }

        const vData = trackingResult?.data || trackingResult;
        const rawStatus = getLatestStatus(vData);
        const newStatus = vyom.mapVyomStatus(rawStatus);

        if (newStatus !== order.shipment_status) {
          await prisma.$transaction(async (tx) => {
            await processVyomOrder(tx, { ...order, shipment_status: order.shipment_status }, vData);
          });
        } else if (vData.tracking_details) {
          const scans = parseTrackingDetails(vData.tracking_details);
          if (scans.length > 0) {
            const existingHistory = await prisma.shipmentHistory.findMany({
              where: { order_id: order.id },
              select: { activity: true, status_date: true },
            });
            const newEntries = [];
            for (const scan of scans) {
              if (!scan.date) continue;
              const exists = existingHistory.some((h) =>
                h.activity === scan.activity &&
                Math.abs(new Date(h.status_date).getTime() - scan.date.getTime()) < 60000
              );
              if (!exists) {
                newEntries.push({
                  order_id: order.id,
                  status: scan.activity || 'UPDATED',
                  status_date: scan.date,
                  location: scan.location || '',
                  shipment_status: vyom.mapVyomStatus(scan.activity),
                  activity: scan.activity || '',
                });
              }
            }
            if (newEntries.length > 0) {
              await prisma.shipmentHistory.createMany({ data: newEntries, skipDuplicates: true });
              log(`[VyomCron] Order #${order.id}: added ${newEntries.length} new scan(s)`);
            }
          }
        }

        const rawDetails = vData.tracking_details;
        if (rawDetails) {
          const detailCount = Array.isArray(rawDetails) ? rawDetails.length : 1;
          const sample = Array.isArray(rawDetails) ? rawDetails[0] : rawDetails;
          log(`[VyomCron] Order #${order.id} status=${rawStatus} scans=${detailCount} first=${JSON.stringify(sample)}`);
        } else {
          log(`[VyomCron] Order #${order.id} status=${rawStatus} scans=0`);
        }
      } catch (orderError) {
        logError(`[VyomCron] Error processing order #${order.id}: ${orderError.message}`);
      }

      await new Promise((r) => setTimeout(r, 200));
    }

    log(`[VyomCron] Poll completed — ${orders.length} orders processed`);
  } catch (error) {
    logError(`[VyomCron] Poll error: ${error.message}`);
  }
}

function initializeVyomTrackingCron(prisma) {
  if (!vyom.isConfigured()) {
    log('[VyomCron] Vyom API not configured — cron not started');
    return;
  }

  log('[VyomCron] Initializing (runs every 5 minutes)...');
  cron.schedule('*/5 * * * *', () => {
    pollVyomOrders(prisma);
  });
}

module.exports = { initializeVyomTrackingCron };
