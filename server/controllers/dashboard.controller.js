const getDashboardStats = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  try {
    const totalOrders = await prisma.order.count({ where: { user_id: userId } });
    const deliveredOrdersCount = await prisma.order.count({ where: { user_id: userId, shipment_status: 'DELIVERED' } });
    const inTransitOrdersCount = await prisma.order.count({ where: { user_id: userId, shipment_status: 'IN_TRANSIT' } });
    const dispatchedOrdersCount = await prisma.order.count({ where: { user_id: userId, shipment_status: 'DISPATCHED' } });
    const manifestedOrdersCount = await prisma.order.count({ where: { user_id: userId, shipment_status: 'MANIFESTED' } });
    const rtoOrdersCount = await prisma.order.count({ where: { user_id: userId, shipment_status: 'RTO' } });
    const cancelledOrdersCount = await prisma.order.count({ where: { user_id: userId, shipment_status: 'CANCELLED' } });
    const pendingOrdersCount = await prisma.order.count({ where: { user_id: userId, shipment_status: 'PENDING' } });
    const notPickedOrdersCount = await prisma.order.count({ where: { user_id: userId, shipment_status: 'NOT_PICKED' } });

    const lastMonthOrders = await prisma.order.count({
      where: {
        user_id: userId,
        created_at: {
          gte: lastMonth
        }
      }
    });

    // Total Weight Shipped
    const deliveredOrdersWithWeight = await prisma.order.findMany({
      where: {
        user_id: userId,
        shipment_status: 'DELIVERED',
        weight: {
          not: null,
        },
      },
      select: {
        weight: true,
      },
    });

    const totalWeightShipped = deliveredOrdersWithWeight.reduce((sum, order) => sum + parseFloat(order.weight || 0), 0).toFixed(2);

    // Avg Delivery Time
    let avgDeliveryTimeDays = 0;
    const deliveredOrdersWithTimestamps = await prisma.order.findMany({
      where: {
        user_id: userId,
        shipment_status: 'DELIVERED',
        delivered_at: {
          not: null,
        },
      },
      select: {
        created_at: true,
        delivered_at: true,
      },
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

    const deliverySuccessRate = totalOrders > 0 ? ((deliveredOrdersCount / totalOrders) * 100).toFixed(0) : 0;
    const returnRate = totalOrders > 0 ? ((rtoOrdersCount / totalOrders) * 100).toFixed(0) : 0;

    // Fetch data for the graph (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orders = await prisma.order.findMany({
      where: {
        user_id: userId,
        created_at: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        created_at: true,
        shipment_status: true
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    // Group orders by date and status
    const graphDataMap = {};
    
    // Initialize with all dates in the range
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

    orders.forEach(order => {
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
      deliveredOrders: deliveredOrdersCount,
      inTransitOrders: inTransitOrdersCount,
      dispatchedOrders: dispatchedOrdersCount,
      manifestedOrders: manifestedOrdersCount,
      rtoOrders: rtoOrdersCount,
      pendingOrders: pendingOrdersCount,
      notPickedOrders: notPickedOrdersCount,
      totalOrders,
      lastMonthOrders,
      totalWeightShipped: `${totalWeightShipped} kg`,
      avgDeliveryTime: `${avgDeliveryTimeDays} days`,
      deliverySuccessRate: `${deliverySuccessRate} %`,
      returnRate: `${returnRate} %`,
      cancelledOrder: cancelledOrdersCount,
      graphData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  getDashboardStats
};
