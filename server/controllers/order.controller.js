const { validationResult } = require('express-validator');
const { getServiceability, getPostcodeDetails } = require('../utils/shiprocket');

const calculateRates = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    pickup_postcode,
    delivery_postcode,
    weight,
    cod = 0,
    declared_value = 0,
    is_return = 0,
    length,
    breadth,
    height,
    mode = 'Surface'
  } = req.query;

  try {
    // Fetch serviceability and postcode details in parallel
    const [serviceabilityData, pickupDetails, deliveryDetails] = await Promise.all([
      getServiceability({
        pickup_postcode,
        delivery_postcode,
        weight,
        cod,
        declared_value,
        is_return,
        length,
        breadth,
        height,
        mode
      }),
      getPostcodeDetails(pickup_postcode),
      getPostcodeDetails(delivery_postcode)
    ]);

    if (!serviceabilityData || serviceabilityData.status !== 200) {
      return res.status(serviceabilityData?.status || 400).json({
        success: false,
        message: serviceabilityData?.message || 'Could not fetch rates',
        data: serviceabilityData
      });
    }

    const availableCouriers = serviceabilityData.data.available_courier_companies || [];
    
    // Format the response to match the user's requested structure
    const formattedResponse = {
      pickup_location: {
        city: pickupDetails?.data?.city || '',
        state: pickupDetails?.data?.state || '',
        postcode: pickup_postcode
      },
      delivery_location: {
        city: deliveryDetails?.data?.city || '',
        state: deliveryDetails?.data?.state || '',
        postcode: delivery_postcode
      },
      shipment_info: {
        value: declared_value,
        payment_mode: parseInt(cod) === 1 ? 'COD' : 'PREPAID',
        applicable_weight: weight,
        dangerous_goods: serviceabilityData.dg_courier === 1 ? 'Yes' : 'No'
      },
      serviceable_couriers: availableCouriers.map(courier => ({
        courier_name: courier.courier_name,
        courier_company_id: courier.courier_company_id,
        rating: courier.rating,
        estimated_delivery: courier.etd,
        delivery_in_days: courier.estimated_delivery_days,
        chargeable_weight: courier.charge_weight,
        rate: courier.rate,
        is_surface: courier.is_surface,
        mode: courier.mode === 1 ? 'Air' : 'Surface',
        is_recommended: courier.courier_company_id === serviceabilityData.data.recommended_courier_company_id
      }))
    };

    res.json(formattedResponse);
  } catch (error) {
    console.error('Error calculating rates:', error);
    res.status(500).json({ message: 'Error calculating rates from Shiprocket' });
  }
};

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
  getOrderById,
  calculateRates
};
