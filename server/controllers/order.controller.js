const { validationResult } = require('express-validator');
const { getServiceability, getLocalityDetails } = require('../utils/shiprocket');

const getPincodeDetails = async (req, res) => {
  const { postcode } = req.query;

  if (!postcode) {
    return res.status(400).json({ success: false, message: 'Postcode is required' });
  }

  try {
    const data = await getLocalityDetails(postcode);
    res.json(data);
  } catch (error) {
    console.error('Error fetching pincode details:', error);
    res.status(500).json({ success: false, message: 'Error fetching pincode details' });
  }
};

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

  const prisma = req.app.locals.prisma;

  try {
    // First fetch both destination and origin locality details to validate
    const [pickupLocality, deliveryLocality] = await Promise.all([
      getLocalityDetails(pickup_postcode),
      getLocalityDetails(delivery_postcode)
    ]);

    if (!pickupLocality?.success && !pickupLocality?.postcode_details) {
      return res.status(400).json({
        success: false,
        message: `Invalid pickup postcode: ${pickup_postcode}`,
        error: pickupLocality
      });
    }

    if (!deliveryLocality?.success && !deliveryLocality?.postcode_details) {
      return res.status(400).json({
        success: false,
        message: `Invalid delivery postcode: ${delivery_postcode}`,
        error: deliveryLocality
      });
    }

    // If both are valid, then get prices
    const serviceabilityData = await getServiceability({
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
    });

    if (!serviceabilityData || serviceabilityData.status !== 200) {
      return res.status(serviceabilityData?.status || 400).json({
        success: false,
        message: serviceabilityData?.message || 'Could not fetch rates',
        data: serviceabilityData
      });
    }

    const availableCouriers = serviceabilityData.data.available_courier_companies || [];
    
    // Get user's commission settings
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { commission_rate: true, assigned_rates: true, referred_by: true }
    });

    const defaultRate = user?.commission_rate ? parseFloat(user.commission_rate.toString()) : (user?.referred_by ? 5 : 0);
    const assignedRates = user?.assigned_rates || {};

    // Format the response to match the user's requested structure
    const formattedResponse = {
      pickup_location: {
        city: pickupLocality?.data?.postcode_details?.city || pickupLocality?.data?.city || '',
        state: pickupLocality?.data?.postcode_details?.state || pickupLocality?.data?.state || '',
        postcode: pickup_postcode
      },
      delivery_location: {
        city: deliveryLocality?.data?.postcode_details?.city || deliveryLocality?.data?.city || '',
        state: deliveryLocality?.data?.postcode_details?.state || deliveryLocality?.data?.state || '',
        postcode: delivery_postcode
      },
      shipment_info: {
        value: declared_value,
        payment_mode: parseInt(cod) === 1 ? 'COD' : 'PREPAID',
        applicable_weight: weight,
        dangerous_goods: serviceabilityData.dg_courier === 1 ? 'Yes' : 'No'
      },
      serviceable_couriers: availableCouriers.map(courier => {
        // Find commission for this courier
        // assignedRates might look like { "Delhivery": { rate: 20, slab: 500 }, "123": { rate: 15 } }
        const courierConfig = assignedRates[courier.courier_company_id] || assignedRates[courier.courier_name] || {};
        const markupPercent = courierConfig.rate !== undefined ? parseFloat(courierConfig.rate) : defaultRate;
        
        const baseRate = parseFloat(courier.rate);
        const markupAmount = (baseRate * markupPercent) / 100;
        const finalRate = baseRate + markupAmount;

        return {
          courier_name: courier.courier_name,
          courier_company_id: courier.courier_company_id,
          rating: courier.rating,
          estimated_delivery: courier.etd,
          delivery_in_days: courier.estimated_delivery_days,
          chargeable_weight: courier.charge_weight,
          rate: finalRate,
          base_rate: baseRate, // Keeping base_rate for internal use if needed
          markup_amount: markupAmount,
          is_surface: courier.is_surface,
          mode: courier.mode === 1 ? 'Air' : 'Surface',
          is_recommended: courier.courier_company_id === serviceabilityData.data.recommended_courier_company_id
        };
      })
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
    receiver_address,
    save_pickup_address,
    save_receiver_address,
    courier_id,
    courier_name,
    shipping_charge,
    base_shipping_charge
  } = req.body;
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    const newOrder = await prisma.$transaction(async (prisma) => {
      // Save addresses if requested
      if (save_pickup_address) {
        await prisma.address.create({
          data: {
            user_id: userId,
            name: pickup_address.name,
            phone: pickup_address.phone,
            email: pickup_address.email,
            complete_address: pickup_address.address,
            city: pickup_address.city,
            state: pickup_address.state,
            pincode: pickup_address.pincode,
            address_label: 'Pickup',
          }
        });
      }

      if (save_receiver_address) {
        await prisma.address.create({
          data: {
            user_id: userId,
            name: receiver_address.name,
            phone: receiver_address.phone,
            email: receiver_address.email,
            complete_address: receiver_address.address,
            city: receiver_address.city,
            state: receiver_address.state,
            pincode: receiver_address.pincode,
            address_label: 'Receiver',
          }
        });
      }

      const order = await prisma.order.create({
        data: {
          user_id: userId,
          order_type,
          shipment_type,
          payment_mode,
          total_amount,
          courier_id,
          courier_name,
          shipping_charge,
          base_shipping_charge
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

// Cancel an order (only if status is PENDING)
const cancelOrder = async (req, res) => {
  const { id } = req.params;
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    const order = await prisma.order.findUnique({
      where: {
        id: BigInt(id)
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if the order belongs to the user
    if (order.user_id !== userId) {
      return res.status(403).json({ message: 'You are not authorized to cancel this order' });
    }

    // Only allow cancellation if status is PENDING
    if (order.shipment_status !== 'PENDING') {
      return res.status(400).json({ 
        message: 'Order can only be cancelled if status is PENDING',
        current_status: order.shipment_status
      });
    }

    // Update the order status to CANCELLED
    const updatedOrder = await prisma.order.update({
      where: {
        id: BigInt(id)
      },
      data: {
        shipment_status: 'CANCELLED'
      },
      include: {
        order_pickup_address: true,
        order_receiver_address: true,
      }
    });

    res.json({
      message: 'Order cancelled successfully',
      order: updatedOrder
    });
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
  calculateRates,
  getPincodeDetails,
  cancelOrder
};
