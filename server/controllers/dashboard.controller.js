const getDashboardStats = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  try {
    const totalOrders = await prisma.order.count({ where: { user_id: userId } });
    const deliveredOrders = await prisma.order.count({ where: { user_id: userId, shipment_status: 'DELIVERED' } });
    const inTransitOrders = await prisma.order.count({ where: { user_id: userId, shipment_status: 'IN_TRANSIT' } });
    const dispatchedOrders = await prisma.order.count({ where: { user_id: userId, shipment_status: 'DISPATCHED' } });
    const manifestedOrders = await prisma.order.count({ where: { user_id: userId, shipment_status: 'MANIFESTED' } });
    const rtoOrders = await prisma.order.count({ where: { user_id: userId, shipment_status: 'RTO' } });
    const cancelledOrders = await prisma.order.count({ where: { user_id: userId, shipment_status: 'CANCELLED' } });

    // Assuming 'RTO In Transit' is a subset of RTO or a specific status not directly mapped to RTO in enum
    // For now, we'll assume it's a specific status or requires more complex query
    const rtoInTransitOrders = 0; // Placeholder

    const lastMonthOrders = await prisma.order.count({
      where: {
        user_id: userId,
        created_at: {
          gte: lastMonth
        }
      }
    });

    // Total Weight Shipped (requires 'weight' field on Order model)
    // For now, returning a placeholder. If weight is stored as Decimal, sum it up.
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

    const totalWeightShipped = deliveredOrdersWithWeight.reduce((sum, order) => sum + (order.weight || 0), 0).toFixed(2);


    // Avg Delivery Time (requires 'delivered_at' field)
    // For now, returning a placeholder. Needs more complex calculation.
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
          return sum + (order.delivered_at.getTime() - order.created_at.getTime());
        }
        return sum;
      }, 0);
      const avgDeliveryTimeMs = totalDeliveryTimeMs / deliveredOrdersWithTimestamps.length;
      avgDeliveryTimeDays = (avgDeliveryTimeMs / (1000 * 60 * 60 * 24)).toFixed(0); // Convert milliseconds to days
    }

    const deliverySuccessRate = totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(0) : 0;
    const returnRate = totalOrders > 0 ? ((rtoOrders / totalOrders) * 100).toFixed(0) : 0;

    const monthlyGrowth = 0; // Placeholder, requires more historical data and complex logic
    const actionRequired = 0; // Placeholder, requires specific logic defined by application
    const weightDisputedOrders = 0; // Placeholder, requires specific status or flag

    res.json({
      deliveredOrders,
      inTransitOrders,
      dispatchedOrders,
      manifestedOrders,
      rtoInTransitOrders,
      rtoOrders,
      totalOrders,
      lastMonthOrders,
      totalWeightShipped: `${totalWeightShipped} kg`,
      avgDeliveryTime: `${avgDeliveryTimeDays} days`,
      deliverySuccessRate: `${deliverySuccessRate} %`,
      returnRate: `${returnRate} %`,
      cancelledOrder: cancelledOrders,
      weightDisputedOrders,
      monthlyGrowth: `${monthlyGrowth} %`,
      actionRequired,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  getDashboardStats
};
