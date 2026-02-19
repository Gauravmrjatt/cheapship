const { validationResult } = require('express-validator');
const { getServiceability, getLocalityDetails, createShipment, cancelShipment, generateLabel, generateManifest, getShipmentTracking, getShipmentDetails, generateRTOLabel } = require('../utils/shiprocket');
const { createReferralCommissions } = require('../utils/referral.commissions');

// Helper to calculate final rates with commissions
const calculateFinalRates = async (prisma, userId, availableCouriers, recommendedId = null) => {
  // Get user's commission settings and Global Settings
  const [user, globalSetting] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { commission_rate: true, assigned_rates: true, referred_by: true }
    }),
    prisma.systemSetting.findUnique({
      where: { key: 'global_commission_rate' }
    })
  ]);

  const globalCommissionRate = globalSetting ? parseFloat(globalSetting.value) : 0;
  const franchiseCommissionRate = user?.commission_rate ? parseFloat(user.commission_rate.toString()) : (user?.referred_by ? 5 : 0);
  const assignedRates = user?.assigned_rates || {};

  return availableCouriers.map(courier => {
    // Find commission for this courier
    const courierConfig = assignedRates[courier.courier_company_id] || assignedRates[courier.courier_name] || {};
    const markupPercent = courierConfig.rate !== undefined ? parseFloat(courierConfig.rate) : franchiseCommissionRate;

    const baseRate = parseFloat(courier.rate);

    // Formula: base_shipment_price + frenchies % on base_shipment price + global % on base_shipment price
    const globalCommissionAmount = (baseRate * globalCommissionRate) / 100;
    const franchiseCommissionAmount = (baseRate * markupPercent) / 100;

    const finalRate = baseRate + globalCommissionAmount + franchiseCommissionAmount;

    return {
      courier_name: courier.courier_name,
      courier_company_id: courier.courier_company_id,
      rating: courier.rating,
      estimated_delivery: courier.etd,
      delivery_in_days: courier.estimated_delivery_days,
      chargeable_weight: courier.charge_weight,
      rate: finalRate,
      base_rate: baseRate,
      global_commission_rate: globalCommissionRate,
      global_commission_amount: globalCommissionAmount,
      franchise_commission_rate: markupPercent,
      franchise_commission_amount: franchiseCommissionAmount,
      is_surface: courier.is_surface,
      mode: courier.mode === 1 ? 'Air' : 'Surface',
      is_recommended: courier.courier_company_id === recommendedId
    };
  });
};

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

    const serviceableCouriers = await calculateFinalRates(
      prisma,
      req.user.id,
      availableCouriers,
      serviceabilityData.data.recommended_courier_company_id
    );

    // Format the response and sanitize sensitive fields (exclude internal base rates and commission breakdowns)
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
      serviceable_couriers: serviceableCouriers.map(({
        base_rate,
        global_commission_rate,
        global_commission_amount,
        franchise_commission_rate,
        franchise_commission_amount,
        ...publicData
      }) => publicData)
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
    weight,
    length,
    width,
    height,
    pickup_location
  } = req.body;
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    // Get max referral levels from settings (outside transaction)
    let maxLevels = 0;
    try {
      const levelSetting = await prisma.systemSetting.findFirst({
        where: { key: 'max_referral_levels' }
      });
      maxLevels = levelSetting ? parseInt(levelSetting.value) : 0;
    } catch (err) {
      console.error('Error fetching referral level settings:', err);
      maxLevels = 0;
    }

    // SECURITY: Recalculate price on server. Do not trust client's shipping_charge.
    const serviceabilityData = await getServiceability({
      pickup_postcode: pickup_address.pincode,
      delivery_postcode: receiver_address.pincode,
      weight,
      cod: payment_mode === 'COD' ? 1 : 0,
      declared_value: total_amount,
      length,
      breadth: width,
      height,
      mode: order_type === 'SURFACE' ? 'Surface' : 'Air'
    });

    if (!serviceabilityData || serviceabilityData.status !== 200) {
      return res.status(400).json({
        message: 'Could not verify shipping rates on server',
        details: serviceabilityData?.message
      });
    }

    const availableCouriers = serviceabilityData.data.available_courier_companies || [];
    const serviceableCouriers = await calculateFinalRates(prisma, userId, availableCouriers);

    // Find the chosen courier and its calculated rate
    const chosenCourier = serviceableCouriers.find(c => c.courier_company_id === parseInt(courier_id));

    if (!chosenCourier) {
      return res.status(400).json({ message: 'Selected courier is not available for this route/weight' });
    }

    const serverShippingCharge = chosenCourier.rate;
    const serverBaseCharge = chosenCourier.base_rate;

    const newOrder = await prisma.$transaction(async (tx) => {
      // 1. Check wallet balance
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { wallet_balance: true }
      });

      const orderAmount = Number(serverShippingCharge || 0);

      if (Number(user.wallet_balance) < orderAmount) {
        throw new Error(`Insufficient wallet balance. Required: ₹${orderAmount}, Available: ₹${user.wallet_balance}`);
      }

      // 2. Debit the wallet
      await tx.user.update({
        where: { id: userId },
        data: {
          wallet_balance: { decrement: orderAmount }
        }
      });

      // 3. Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          user_id: userId,
          amount: orderAmount,
          type: 'DEBIT',
          status: 'SUCCESS',
          description: `Shipping charge for Order ${order_type}`,
        }
      });

      // Save addresses if requested
      if (save_pickup_address) {
        await tx.address.create({
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
        await tx.address.create({
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

      const order = await tx.order.create({
        data: {
          user_id: userId,
          order_type,
          shipment_status: 'PENDING',
          shipment_type,
          payment_mode,
          total_amount: serverShippingCharge,
          product_amount: total_amount,
          weight,
          length,
          width,
          height,
          courier_id: chosenCourier.courier_company_id,
          courier_name: chosenCourier.courier_name,
          shipping_charge: serverShippingCharge,
          base_shipping_charge: serverBaseCharge,
          global_commission_rate: chosenCourier.global_commission_rate,
          global_commission_amount: chosenCourier.global_commission_amount,
          franchise_commission_rate: chosenCourier.franchise_commission_rate,
          franchise_commission_amount: chosenCourier.franchise_commission_amount
        }
      });
      // Create multi-level referral commissions with cascading percentages
      const baseCommissionAmount = parseFloat(order.franchise_commission_amount || 0);
      if (baseCommissionAmount > 0) {
        await createReferralCommissions(tx, order.id, userId, baseCommissionAmount, maxLevels);
      }

      let shiprocketOrderId = null;
      let shiprocketShipmentId = null;
      let labelUrl = null;
      let trackUrl = null;

      try {
        const shipmentData = {
          order_id: order.id.toString(),
          order_date: new Date().toISOString().split('T')[0],
          pickup_location: pickup_location,
          billing_customer_name: pickup_address.name,
          billing_last_name: '',
          billing_address: pickup_address.address,
          billing_city: pickup_address.city,
          billing_pincode: pickup_address.pincode,
          billing_state: pickup_address.state,
          billing_country: pickup_address.country || 'India',
          billing_email: pickup_address.email,
          billing_phone: pickup_address.phone,
          shipping_is_billing: false,
          shipping_customer_name: receiver_address.name,
          shipping_last_name: '',
          shipping_address: receiver_address.address,
          shipping_city: receiver_address.city,
          shipping_pincode: receiver_address.pincode,
          shipping_state: receiver_address.state,
          shipping_country: receiver_address.country || 'India',
          shipping_email: receiver_address.email,
          shipping_phone: receiver_address.phone,
          order_items: [
            {
              name: `Order #${order.id}`,
              sku: `SKU-${order.id}`,
              units: 1,
              selling_price: parseFloat(total_amount),
              discount: 0,
              tax: 0,
              hsn: ''
            }
          ],
          payment_method: payment_mode,
          shipping_charges: parseFloat(serverShippingCharge),
          sub_total: parseFloat(total_amount) + parseFloat(serverShippingCharge),
          length: parseFloat(length) || 10,
          breadth: parseFloat(width) || 10,
          height: parseFloat(height) || 10,
          weight: parseFloat(weight) || 0.5
        };

        const shipmentResult = await createShipment(shipmentData);
        
        // Validate the Shiprocket response contains required fields
        if (!shipmentResult || !shipmentResult.order_id || !shipmentResult.shipment_id) {
          throw new Error('Failed to create shipment with Shiprocket. Invalid response received from shipping provider.');
        }

        shiprocketOrderId = shipmentResult.order_id?.toString();
        shiprocketShipmentId = shipmentResult.shipment_id?.toString();

        if (shipmentResult.label_url) {
          labelUrl = shipmentResult.label_url;
        }

        if (shipmentResult.track_url) {
          trackUrl = shipmentResult.track_url;
        }

        await tx.order.update({
          where: { id: order.id },
          data: {
            shiprocket_order_id: shiprocketOrderId,
            shiprocket_shipment_id: shiprocketShipmentId,
            label_url: labelUrl,
            track_url: trackUrl
          }
        });
      } catch (shipmentError) {
        console.error('Error creating Shiprocket shipment:', shipmentError);
        // Re-throw the error to rollback the transaction
        throw new Error(shipmentError.message || 'Failed to create shipment with Shiprocket');
      }

      // 4. Update transaction with order ID
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          description: `Shipping charge for Order #${order.id}`,
          reference_id: order.id.toString()
        }
      });

      await tx.orderPickupAddress.create({
        data: {
          order_id: order.id,
          ...pickup_address
        }
      });

      await tx.orderReceiverAddress.create({
        data: {
          order_id: order.id,
          ...receiver_address
        }
      });

      const updatedOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: {
          order_pickup_address: true,
          order_receiver_address: true
        }
      });

      const {
        base_shipping_charge,
        global_commission_rate,
        global_commission_amount,
        franchise_commission_rate,
        franchise_commission_amount,
        ...sanitizedOrder
      } = updatedOrder;

      res.status(201).json(sanitizedOrder);
    });
  } catch (error) {
    console.error(error);
    if (error.message.includes('Insufficient wallet balance')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('Shiprocket') || error.message.includes('shipping provider')) {
      return res.status(400).json({ message: error.message });
    }
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

    const sanitizedOrders = orders.map(({
      base_shipping_charge,
      global_commission_rate,
      global_commission_amount,
      franchise_commission_rate,
      franchise_commission_amount,
      ...sanitizedOrder
    }) => sanitizedOrder);

    res.json({
      data: sanitizedOrders,
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

    const {
      base_shipping_charge,
      global_commission_rate,
      global_commission_amount,
      franchise_commission_rate,
      franchise_commission_amount,
      ...sanitizedOrder
    } = order;

    res.json(sanitizedOrder);
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

    // Update the order status to CANCELLED and refund within a transaction
    const result = await prisma.$transaction(async (tx) => {
      let cancellationAttempted = false;
      let shiprocketCancelResult = null;

      if (order.shiprocket_shipment_id) {
        try {
          cancellationAttempted = true;
          shiprocketCancelResult = await cancelShipment(order.shiprocket_order_id);
        } catch (cancelError) {
          console.error('Error cancelling Shiprocket shipment:', cancelError);
        }
      }

      const updatedOrder = await tx.order.update({
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

      const refundAmount = Number(order.shipping_charge || 0);

      if (refundAmount > 0) {
        // Refund the wallet
        await tx.user.update({
          where: { id: userId },
          data: {
            wallet_balance: { increment: refundAmount }
          }
        });

        // Create transaction record
        await tx.transaction.create({
          data: {
            user_id: userId,
            amount: refundAmount,
            type: 'CREDIT',
            status: 'SUCCESS',
            description: `Refund for cancelled order #${id}`,
            reference_id: id.toString()
          }
        });
      }

      return { order: updatedOrder, shiprocketCancelResult, cancellationAttempted };
    });

    const {
      base_shipping_charge,
      global_commission_rate,
      global_commission_amount,
      franchise_commission_rate,
      franchise_commission_amount,
      ...sanitizedOrder
    } = result.order;

    res.json({
      message: 'Order cancelled successfully and amount refunded to wallet',
      order: sanitizedOrder
    });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2023') {
      return res.status(404).json({ message: 'Invalid order ID format' });
    }
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const mapShiprocketStatus = (shiprocketStatus) => {
  const statusMap = {
    'pending': 'PENDING',
    'manifested': 'MANIFESTED',
    'in_transit': 'IN_TRANSIT',
    'out_for_delivery': 'IN_TRANSIT',
    'delivered': 'DELIVERED',
    'cancelled': 'CANCELLED',
    'rto': 'RTO',
    'rto_delivered': 'RTO',
    'lost': 'CANCELLED',
    'damaged': 'CANCELLED',
    'not_picked': 'NOT_PICKED',
  };
  return statusMap[shiprocketStatus?.toLowerCase()] || 'PENDING';
};

const handleWebhook = async (req, res) => {
  const prisma = req.app.locals.prisma;

  try {
    const payload = req.body;

    if (!payload || !payload.shipment_id) {
      return res.status(400).json({ success: false, message: 'Invalid webhook payload' });
    }

    const shipmentId = payload.shipment_id.toString();
    const order = await prisma.order.findFirst({
      where: { shiprocket_shipment_id: shipmentId }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found for shipment' });
    }

    const newStatus = mapShiprocketStatus(payload.status);
    const updateData = {
      shipment_status: newStatus
    };

    if (payload.tracking_number) {
      updateData.tracking_number = payload.tracking_number;
    }

    if (payload.label_url) {
      updateData.label_url = payload.label_url;
    }

    if (newStatus === 'DELIVERED') {
      updateData.delivered_at = new Date();
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: updateData,
      include: {
        order_pickup_address: true,
        order_receiver_address: true
      }
    });

    if (payload.track_url) {
      await prisma.order.update({
        where: { id: order.id },
        data: { track_url: payload.track_url }
      });
    }

    if (payload.status_history && Array.isArray(payload.status_history)) {
      for (const history of payload.status_history) {
        await prisma.shipmentHistory.create({
          data: {
            order_id: order.id,
            status: history.status || payload.status,
            status_date: new Date(history.status_date || history.date || Date.now()),
            location: history.location || history.current_location,
            shipment_status: history.status,
            activity: history.status
          }
        });
      }
    }

    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getOrderTracking = async (req, res) => {
  const { id } = req.params;
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    const order = await prisma.order.findUnique({
      where: { id: BigInt(id) },
      include: {
        order_pickup_address: true,
        order_receiver_address: true
      }
    });

    if (!order || order.user_id !== userId) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.shiprocket_shipment_id) {
      return res.status(400).json({ message: 'No shipment found for this order' });
    }

    const trackingData = await getShipmentTracking(order.shiprocket_shipment_id);

    const shipmentHistory = await prisma.shipmentHistory.findMany({
      where: { order_id: order.id },
      orderBy: { status_date: 'desc' }
    });

    res.json({
      order: {
        id: order.id,
        shipment_status: order.shipment_status,
        tracking_number: order.tracking_number,
        courier_name: order.courier_name
      },
      tracking: trackingData,
      history: shipmentHistory
    });
  } catch (error) {
    console.error('Error fetching tracking:', error);
    res.status(500).json({ message: 'Error fetching tracking information' });
  }
};

const getLiveOrderStatus = async (req, res) => {
  const { id } = req.params;
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    const order = await prisma.order.findUnique({
      where: { id: BigInt(id) },
      include: {
        order_pickup_address: true,
        order_receiver_address: true
      }
    });

    if (!order || order.user_id !== userId) {
      return res.status(404).json({ message: 'Order not found' });
    }

    let liveStatus = null;
    let trackingData = null;

    if (order.shiprocket_shipment_id) {
      try {
        trackingData = await getShipmentTracking(order.shiprocket_shipment_id);

        if (trackingData && trackingData.tracking_status) {
          liveStatus = {
            current_status: mapShiprocketStatus(trackingData.tracking_status),
            status: trackingData.tracking_status,
            track_url: trackingData.track_url,
            estimated_delivery: trackingData.est_delivery,
            courier: trackingData.courier_name,
            tracking_number: trackingData.tracking_number,
            activities: trackingData.shipment_track_activities || []
          };
        }
      } catch (trackingError) {
        console.error('Error fetching live tracking:', trackingError);
      }
    }

    const shipmentHistory = await prisma.shipmentHistory.findMany({
      where: { order_id: order.id },
      orderBy: { status_date: 'desc' }
    });

    res.json({
      order: {
        id: order.id,
        shipment_status: order.shipment_status,
        shiprocket_order_id: order.shiprocket_order_id,
        shiprocket_shipment_id: order.shiprocket_shipment_id,
        tracking_number: order.tracking_number,
        courier_name: order.courier_name,
        label_url: order.label_url,
        track_url: order.track_url,
        created_at: order.created_at,
        delivered_at: order.delivered_at
      },
      live_status: liveStatus,
      history: shipmentHistory
    });
  } catch (error) {
    console.error('Error fetching live status:', error);
    res.status(500).json({ message: 'Error fetching live status' });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  calculateRates,
  getPincodeDetails,
  cancelOrder,
  handleWebhook,
  getOrderTracking,
  getLiveOrderStatus
};
