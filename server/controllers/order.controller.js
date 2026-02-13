const { validationResult } = require('express-validator');

const createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    order_type,
    shipment_type,
    payment_mode,
    total_amount,
    pickup_address,
    receiver_address
  } = req.body;
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    const newOrder = await prisma.$transaction(async (prisma) => {
      const order = await prisma.order.create({
        data: {
          user_id: userId,
          order_type,
          shipment_type,
          payment_mode,
          total_amount
        }
      });

      await prisma.orderPickupAddress.create({
        data: {
          order_id: order.id,
          ...pickup_address
        }
      });

      await prisma.orderReceiverAddress.create({
        data: {
          order_id: order.id,
          ...receiver_address
        }
      });

      return order;
    });

    res.status(201).json(newOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getOrders = async (req, res) => {
  const { page = 1, pageSize = 10, shipment_status, order_type, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  const pageNum = parseInt(page, 10);
  const pageSizeNum = parseInt(pageSize, 10);
  const offset = (pageNum - 1) * pageSizeNum;

  const where = {
    user_id: userId
  };

  if (shipment_status) {
    where.shipment_status = shipment_status;
  }

  if (order_type) {
    where.order_type = order_type;
  }

  try {
    const orders = await prisma.order.findMany({
      where,
      skip: offset,
      take: pageSizeNum,
      orderBy: {
        [sortBy]: sortOrder
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

const getOrderById = async (req, res) => {
  const { id } = req.params;
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    const order = await prisma.order.findUnique({
      where: {
        id: BigInt(id)
      },
      include: {
        order_pickup_address: true,
        order_receiver_address: true,
      }
    });

    if (!order || order.user_id !== userId) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2023') {
        return res.status(404).json({ message: 'Invalid order ID format' });
    }
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById
};
