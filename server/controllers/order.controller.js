const { validationResult } = require('express-validator');
const { generateOrderId } = require('../utils/generateOrderId');
const { getServiceability, getLocalityDetails, createShipment, cancelShipment, assignAWB: shiprocketAssignAWB, generateLabel, generateManifest, printManifest, getShipmentTracking, getShipmentDetails, schedulePickup, generateRTOLabel, addPickupLocation, getPickupLocations, isNumberVerified } = require('../utils/shiprocket');
const { createReferralCommissions } = require('../utils/referral.commissions');
const labelCustomizer = require('../utils/label-customizer');
const vyom = require('../utils/vyom');

// Helper to sanitize error messages from shipping providers
const sanitizeErrorMessage = (message) => {
  if (!message) return 'An unexpected error occurred';
  
  const msg = message.toLowerCase();
  // Check if it contains provider name and financial keywords
  if (msg.includes('shiprocket') || msg.includes('recharge') || msg.includes('wallet') || msg.includes('balance') || msg.includes('amount')) {
    return 'Courier service is temporarily unavailable. Please try again later or contact support.';
  }
  return message;
};

// Helper to calculate final rates with commissions
const calculateFinalRates = async (prisma, userId, availableCouriers, recommendedId = null) => {
  // Get user's commission settings, Global Settings, and Courier configs
  const [user, globalSetting, courierConfigs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { commission_rate: true, assigned_rates: true, referred_by: true, active_discount: true }
    }),
    prisma.systemSetting.findUnique({
      where: { key: 'global_commission_rate' }
    }),
    prisma.courierConfiguration.findMany()
  ]);

  const courierConfigMap = courierConfigs.reduce((acc, config) => {
    acc[config.courier_company_id] = config;
    return acc;
  }, {});

  const globalCommissionRate = globalSetting ? parseFloat(globalSetting.value) : 0;
  const franchiseCommissionRate = user?.commission_rate ? parseFloat(user.commission_rate.toString()) : (user?.referred_by ? 5 : 0);
  const activeDiscountRate = user?.active_discount ? parseFloat(user.active_discount.toString()) : 0;
  const assignedRates = user?.assigned_rates || {};

  return availableCouriers.map(courier => {
    // Find commission for this courier
    const courierConfig = assignedRates[courier.courier_company_id] || assignedRates[courier.courier_name] || {};
    const markupPercent = courierConfig.rate !== undefined ? parseFloat(courierConfig.rate) : franchiseCommissionRate;

    const baseRate = parseFloat(courier.rate);

    // Formula: base_shipment_price + franchise % on base_shipment price + global % on base_shipment price
    let finalGlobalCommRate = globalCommissionRate;
    let finalFranchiseCommRate = markupPercent;

    if (activeDiscountRate > 0) {
      if (activeDiscountRate >= (finalGlobalCommRate + finalFranchiseCommRate)) {
        finalGlobalCommRate = 0;
        finalFranchiseCommRate = 0;
      } else {
        if (activeDiscountRate <= finalGlobalCommRate) {
          finalGlobalCommRate -= activeDiscountRate;
        } else {
          const remainder = activeDiscountRate - finalGlobalCommRate;
          finalGlobalCommRate = 0;
          finalFranchiseCommRate -= remainder;
        }
      }
    }

    const globalCommissionAmount = (baseRate * finalGlobalCommRate) / 100;
    const franchiseCommissionAmount = (baseRate * finalFranchiseCommRate) / 100;

    const finalRate = parseFloat((baseRate + globalCommissionAmount + franchiseCommissionAmount).toFixed(2));

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Price Calc] ${courier.courier_name}:`);
      console.log(`  Shiprocket Base Rate: ₹${baseRate}`);
      console.log(`  Global Commission (${globalCommissionRate}%): ₹${globalCommissionAmount}`);
      console.log(`  Franchise Commission (${markupPercent}%): ₹${franchiseCommissionAmount}`);
      console.log(`  Final Rate: ₹${finalRate}`);
    }

    const dbConfig = courierConfigMap[courier.courier_company_id] || {};

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
      is_recommended: courier.courier_company_id === recommendedId,
      custom_tag: dbConfig.custom_tag || null,
      is_vyom: dbConfig.is_vyom || false
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
    mode
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

    // If both are valid, then get prices from both Shiprocket and Vyom
    const [serviceabilityData] = await Promise.all([
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
        mode: mode !== 'undefined' ? mode : undefined
      }),
    ]);

    if (!serviceabilityData || serviceabilityData.status !== 200) {
      return res.status(serviceabilityData?.status || 400).json({
        success: false,
        message: serviceabilityData?.message || 'Could not fetch rates',
        data: serviceabilityData
      });
    }

    let availableCouriers = serviceabilityData.data.available_courier_companies || [];



    let serviceableCouriers = await calculateFinalRates(
      prisma,
      req.user.id,
      availableCouriers,
      serviceabilityData.data.recommended_courier_company_id
    );

    // Format the response and sanitize sensitive fields (exclude internal base rates and commission breakdowns)
    const formattedResponse = {
      pickup_location: {
        city: pickupLocality?.postcode_details?.city || pickupLocality?.data?.city || '',
        state: pickupLocality?.postcode_details?.state || pickupLocality?.data?.state || '',
        postcode: pickup_postcode
      },
      delivery_location: {
        city: deliveryLocality?.postcode_details?.city || deliveryLocality?.data?.city || '',
        state: deliveryLocality?.postcode_details?.state || deliveryLocality?.data?.state || '',
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
      }) => publicData).sort((a, b) => a.rate - b.rate)
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
    cod_amount,
    pickup_address,
    receiver_address,
    save_pickup_address,
    save_receiver_address,
    courier_id,
    weight,
    length,
    width,
    height,
    pickup_location,
    products,
    is_insured,
    is_draft
  } = req.body;
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    // First shipment KYC & Security Deposit Check
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { kyc_status: true, security_deposit: true }
    });

    const nonDraftOrderCount = await prisma.order.count({
      where: { user_id: userId, is_draft: false }
    });

    // Only enforce for the first non-draft order
    if (nonDraftOrderCount === 0 && !is_draft) {
      if (user.kyc_status !== 'VERIFIED') {
        return res.status(403).json({
          message: 'KYC verification (Aadhaar/PAN) is required for your first shipment.',
          code: 'KYC_REQUIRED'
        });
      }
      if (Number(user.security_deposit || 0) <= 0) {
        return res.status(403).json({
          message: 'Security deposit is required for your first shipment.',
          code: 'SECURITY_DEPOSIT_REQUIRED'
        });
      }
    }

    // In-transit safety rule: User must have Wallet Balance + Security Deposit >= Double the sum of shipping charges for all in-transit orders
    if (!is_draft) {
      const inTransitOrders = await prisma.order.findMany({
        where: {
          user_id: userId,
          shipment_status: 'IN_TRANSIT',
          is_draft: false
        },
        select: { shipping_charge: true }
      });

      const totalInTransitShippingCharge = inTransitOrders.reduce((sum, o) => sum + parseFloat(o.shipping_charge || 0), 0);
      const userBalance = await prisma.user.findUnique({
        where: { id: userId },
        select: { wallet_balance: true, security_deposit: true }
      });

      const totalAvailable = parseFloat(userBalance.wallet_balance || 0) + parseFloat(userBalance.security_deposit || 0);

      if (totalAvailable < (totalInTransitShippingCharge * 2)) {
        return res.status(403).json({
          message: 'Insufficient balance for risk mitigation. Your (Wallet Balance + Security Deposit) must be at least double the shipping charges of all in-transit orders.',
          code: 'INSUFFICIENT_SAFETY_BALANCE',
          required: (totalInTransitShippingCharge * 2),
          available: totalAvailable
        });
      }
    }

    // Verify phone number with Shiprocket if user wants to save pickup address
    if (save_pickup_address && !is_draft) {
      try {
        // First check if the phone is already verified with Shiprocket
        const isVerified = await isNumberVerified(pickup_address.phone);
        
        if (!isVerified) {
          // Check if pickup location already exists (but not verified)
          const pickupLocations = await getPickupLocations();
          const existingPickup = pickupLocations?.data?.shipping_address?.find(
            p => p.phone.toString() === pickup_address.phone.toString()
          );

          if (!existingPickup) {
            // Try to add as pickup location - Shiprocket will verify the phone
            const pickupResult = await addPickupLocation({
              pickup_location: pickup_location || `Pickup_${Date.now()}`,
              name: pickup_address.name,
              phone: parseInt(pickup_address.phone, 10),
              email: pickup_address.email || '',
              address: pickup_address.address,
              city: pickup_address.city,
              state: pickup_address.state,
              pin_code: parseInt(pickup_address.pincode, 10),
              country: 'India'
            });

            if (!pickupResult.success) {
              // Check if it's a phone verification error
              const errorMsg = pickupResult.message || '';
              if (errorMsg.toLowerCase().includes('phone') || errorMsg.toLowerCase().includes('verify') || errorMsg.toLowerCase().includes('otp')) {
                return res.status(400).json({
                  message: 'Phone number verification required. Please verify your phone number with Shiprocket first before saving this address.',
                  code: 'PHONE_VERIFICATION_REQUIRED',
                  details: pickupResult
                });
              }
              // Other error - return but continue with order creation (pickup may already exist)
              console.warn('Pickup location creation warning:', pickupResult);
            }
          } else if (!existingPickup.phone_verified) {
            // Pickup exists but phone is not verified
            return res.status(400).json({
              message: 'Phone number is not verified with Shiprocket. Please verify your phone number first before saving this address.',
              code: 'PHONE_VERIFICATION_REQUIRED'
            });
          }
        }
      } catch (pickupError) {
        console.error('Pickup location verification error:', pickupError);
        // Don't block order creation - just log the error
      }
    }

    if (is_draft) {
      const draftedOrder = await prisma.order.create({
        data: {
          user_id: userId,
          order_type: order_type || 'SURFACE',
          is_draft: true,
          shipment_status: 'PENDING',
          shipment_type: shipment_type || 'DOMESTIC',
          payment_mode: payment_mode || 'PREPAID',
          total_amount: total_amount || 0,
          product_amount: total_amount || 0,
          products: products || null,
          weight: weight || 0,
          length: length || 0,
          width: width || 0,
          height: height || 0,
          courier_id: courier_id ? parseInt(courier_id) : null,
          pickup_location: pickup_location || null,
          is_insured: is_insured || false,
          order_pickup_address: {
            create: {
              name: pickup_address.name,
              phone: pickup_address.phone,
              email: pickup_address.email,
              address: pickup_address.address,
              city: pickup_address.city,
              state: pickup_address.state,
              pincode: pickup_address.pincode
            }
          },
          order_receiver_address: {
            create: {
              name: receiver_address.name,
              phone: receiver_address.phone,
              email: receiver_address.email,
              address: receiver_address.address,
              city: receiver_address.city,
              state: receiver_address.state,
              pincode: receiver_address.pincode
            }
          }
        }
      });

      return res.status(201).json({
        message: 'Order saved as draft successfully',
        data: draftedOrder
      });
    }

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
      mode: order_type === 'CARGO' ? 'Cargo' : order_type === 'SURFACE' ? 'Surface' : 'Air'
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
      // 1. Check wallet balance and in-transit safety rules
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { wallet_balance: true, security_deposit: true }
      });

      const orderAmount = Number(serverShippingCharge || 0);

      // In-Transit Safety logic
      const inTransitOrders = await tx.order.findMany({
        where: {
          user_id: userId,
          shipment_status: {
            in: ['MANIFESTED', 'IN_TRANSIT', 'DISPATCHED', 'PENDING']
          }
        },
        select: { shipping_charge: true }
      });

      const inTransitTotal = inTransitOrders.reduce((sum, order) => sum + Number(order.shipping_charge || 0), 0);
      const newInTransitTotal = inTransitTotal + orderAmount;
      const requiredSecureBalance = newInTransitTotal * 2;
      const currentSecuredAmount = Number(user.wallet_balance) + Number(user.security_deposit || 0);

      if (currentSecuredAmount < requiredSecureBalance) {
        throw new Error(`In-transit safety limit exceeded. Required limits (Wallet + Security): ₹${requiredSecureBalance.toFixed(2)}, Available: ₹${currentSecuredAmount.toFixed(2)} based on your active in-transit shipping charges of ₹${newInTransitTotal.toFixed(2)}.`);
      }

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

      // Save addresses if requested - check if address already exists first
      if (save_pickup_address) {
        // Check if similar address already exists (match on phone, pincode, and address)
        const existingPickupAddress = await tx.address.findFirst({
          where: {
            user_id: userId,
            phone: pickup_address.phone,
            pincode: pickup_address.pincode,
            complete_address: pickup_address.address,
          }
        });

        // Only create if no matching address exists
        if (!existingPickupAddress) {
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
      }

      if (save_receiver_address) {
        // Check if similar address already exists (match on phone, pincode, and address)
        const existingReceiverAddress = await tx.address.findFirst({
          where: {
            user_id: userId,
            phone: receiver_address.phone,
            pincode: receiver_address.pincode,
            complete_address: receiver_address.address,
          }
        });

        // Only create if no matching address exists
        if (!existingReceiverAddress) {
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
      }

      const order = await tx.order.create({
        data: {
          id : generateOrderId(),
          user_id: userId,
          order_type,
          shipment_status: 'PENDING',
          shipment_type,
          payment_mode,
          total_amount: Math.round(parseFloat(serverShippingCharge) * 100) / 100,
          product_amount: Math.round(parseFloat(total_amount) * 100) / 100,
          products: products || null,
          weight,
          length,
          width,
          height,
          courier_id: chosenCourier.courier_company_id,
          courier_name: chosenCourier.courier_name,
          is_vyom: !!chosenCourier.is_vyom,
          shipping_charge: Math.round(parseFloat(serverShippingCharge) * 100) / 100,
          base_shipping_charge: Math.round(parseFloat(serverBaseCharge) * 100) / 100,
          global_commission_rate: chosenCourier.global_commission_rate,
          global_commission_amount: Math.round(parseFloat(chosenCourier.global_commission_amount) * 100) / 100,
          franchise_commission_rate: chosenCourier.franchise_commission_rate,
          franchise_commission_amount: Math.round(parseFloat(chosenCourier.franchise_commission_amount) * 100) / 100,
          cod_amount: payment_mode === 'COD' ? Math.round(parseFloat(cod_amount || total_amount) * 100) / 100 : null,
          remittance_status: payment_mode === 'COD' ? 'PENDING' : 'NOT_APPLICABLE'
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
          order_items: products && products.length > 0
            ? products.map((item, idx) => ({
              name: item.name || `Item ${idx + 1}`,
              sku: `SKU-${order.id}-${idx + 1}`,
              units: parseInt(item.quantity) || 1,
              selling_price: parseFloat(item.price) || 0,
              discount: 0,
              tax: 0,
              hsn: ''
            }))
            : [
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
          weight: parseFloat(weight) || 0.5,
          is_insured: is_insured ? 1 : 0
        };

        if (chosenCourier.is_vyom) {
          const vyomResult = await vyom.createVyomShipment(shipmentData);
          if (!vyomResult || !vyomResult.success) {
            throw new Error('Failed to create shipment with Vyom Express.');
          }
          const vyomOrderId = vyomResult.order_id || vyomResult.shipment_id;
          const vyomShipmentId = vyomResult.shipment_id;
          const vyomAwb = vyomResult.awb_code;

          await tx.order.update({
            where: { id: order.id },
            data: {
              vyom_order_id: vyomOrderId?.toString(),
              vyom_shipment_id: vyomShipmentId?.toString(),
              tracking_number: vyomAwb?.toString(),
              shipment_status: 'PROCESSING'
            }
          });
        } else {
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

          try {
            const awbResult = await shiprocketAssignAWB({
              shipment_id: shiprocketShipmentId,
              courier_id: chosenCourier.courier_company_id
            });

            if (awbResult && awbResult.awb_assign_status === 1 && awbResult.response && awbResult.response.data) {
              const awbData = awbResult.response.data;
              
              await tx.order.update({
                where: { id: order.id },
                data: {
                  tracking_number: awbData.awb_code,
                  shipment_status: 'MANIFESTED',
                  courier_name: awbData.courier_name || chosenCourier.courier_name,
                  courier_id: awbData.courier_company_id ? parseInt(awbData.courier_company_id) : chosenCourier.courier_company_id
                }
              });

              if (awbData.pickup_scheduled_date) {
                await tx.order.update({
                  where: { id: order.id },
                  data: {
                    pickup_scheduled_date: new Date(awbData.pickup_scheduled_date)
                  }
                });
              }

              console.log(`AWB ${awbData.awb_code} assigned automatically for order ${order.id}`);
            } else {
              const awbError = awbResult?.message || awbResult?.response?.data?.awb_assign_error || 'Failed to assign AWB';
              console.warn(`Auto AWB assignment failed for order ${order.id}: ${awbError}`);
            }
          } catch (awbError) {
            console.error(`Auto AWB assignment error for order ${order.id}:`, awbError.message);
          }
        }
      } catch (shipmentError) {
        console.error('Error creating shipment:', shipmentError);
        // Re-throw the error to rollback the transaction
        throw new Error(shipmentError.message || 'Failed to create shipment');
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
    
    return res.status(400).json({ message: sanitizeErrorMessage(error.message) });
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

  if (shipment_status === 'DRAFT') {
    where.is_draft = true;
  } else {
    where.is_draft = false;
    if (shipment_status && shipment_status !== 'ALL') {
      where.shipment_status = shipment_status;
    }
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

    // Only allow cancellation if status is PENDING or PROCESSING
    if (order.shipment_status !== 'PENDING' && order.shipment_status !== 'PROCESSING') {
      return res.status(400).json({
        message: 'Order can only be cancelled if status is PENDING or PROCESSING',
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
  if (!shiprocketStatus) return 'PENDING';
  
  const status = shiprocketStatus.toString().toLowerCase().trim();
  const statusMap = {
    'pending': 'PENDING',
    'processing': 'PROCESSING',
    'manifested': 'MANIFESTED',
    'in_transit': 'IN_TRANSIT',
    'out_for_delivery': 'IN_TRANSIT',
    'delivered': 'DELIVERED',
    'cancelled': 'CANCELLED',
    'canceled': 'CANCELLED',
    'rto': 'RTO',
    'rto_delivered': 'RTO',
    'lost': 'CANCELLED',
    'damaged': 'CANCELLED',
    'not_picked': 'NOT_PICKED',
    'pickup_exception': 'PENDING',
    'pickup_error': 'PENDING'
  };
  return statusMap[status] || 'PENDING';
};

const handleWebhook = async (req, res) => {
  const prisma = req.app.locals.prisma;

  try {
    const payload = req.body;

    if (!payload) {
      return res.status(400).json({ success: false, message: 'Empty webhook payload' });
    }

    // Per user instruction: sr_order_id is the actual ID in our DB
    let orderId = payload.sr_order_id;
    let order = null;

    if (orderId) {
      order = await prisma.order.findUnique({
        where: { id: BigInt(orderId) }
      });
    }

    // If not found by sr_order_id, try order_id as fallback PK
    if (!order && payload.order_id) {
      try {
        order = await prisma.order.findUnique({
          where: { id: BigInt(payload.order_id) }
        });
      } catch (e) {
        // order_id might not be a valid bigint PK in some payloads
      }
    }

    // If still not found, try finding by shiprocket_order_id field
    if (!order && payload.sr_order_id) {
      order = await prisma.order.findFirst({
        where: { shiprocket_order_id: payload.sr_order_id.toString() }
      });
    }

    if (!order) {
      // Fallback: Try to find by shiprocket_shipment_id
      if (payload.shipment_id || payload.awb) {
        const shipmentId = (payload.shipment_id || payload.awb).toString();
        const fallbackOrder = await prisma.order.findFirst({
          where: {
            OR: [
              { shiprocket_shipment_id: shipmentId },
              { tracking_number: shipmentId }
            ]
          }
        });
        if (fallbackOrder) {
          return await processOrderUpdate(prisma, fallbackOrder, payload, res);
        }
      }
      return res.status(404).json({ success: false, message: `Order not found for sr_order_id: ${payload.sr_order_id}` });
    }

    return await processOrderUpdate(prisma, order, payload, res);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Internal helper to process the validated order update
const processOrderUpdate = async (prisma, order, payload, res) => {
  const newStatus = mapShiprocketStatus(payload.shipment_status || payload.status || payload.current_status);
  const updateData = {
    shipment_status: newStatus
  };

  if (payload.awb || payload.tracking_number) {
    updateData.tracking_number = payload.awb || payload.tracking_number;
  }

  if (payload.pickup_scheduled_date) {
    // Shiprocket date format can be "YYYY-MM-DD HH:mm:ss" or similar
    updateData.pickup_scheduled_date = new Date(payload.pickup_scheduled_date);
  }

  if (newStatus === 'DELIVERED') {
    updateData.delivered_at = new Date();
  }

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: updateData
  });

  // Log history
  await prisma.shipmentHistory.create({
    data: {
      order_id: order.id,
      status: payload.shipment_status || payload.current_status || 'UPDATED',
      status_date: new Date(),
      location: payload.location || payload.current_location || '',
      shipment_status: newStatus,
      activity: payload.current_status || payload.shipment_status
    }
  });

  return res.json({ success: true, message: 'Webhook processed successfully' });
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

const generateOrderManifest = async (req, res) => {
  const { id } = req.params;
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    const order = await prisma.order.findUnique({
      where: { id: BigInt(id) }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user_id !== userId) {
      return res.status(403).json({ message: 'You are not authorized to generate manifest for this order' });
    }

    if (!order.shiprocket_shipment_id) {
      return res.status(400).json({ message: 'No shipment found for this order' });
    }

    const manifestResult = await generateManifest([order.shiprocket_shipment_id]);

    let manifestUrl = null;
    if (manifestResult && manifestResult.manifest_url) {
      manifestUrl = manifestResult.manifest_url;
    } else if (manifestResult && manifestResult.data && manifestResult.data.manifest_url) {
      manifestUrl = manifestResult.data.manifest_url;
    }

    if (manifestUrl) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          manifest_url: manifestUrl,
          manifest_generated_at: new Date()
        }
      });
    }

    res.json({
      message: 'Manifest generated successfully',
      manifest_url: manifestUrl,
      manifest_result: manifestResult
    });
  } catch (error) {
    console.error('Error generating manifest:', error);
    res.status(500).json({ message: error.message || 'Error generating manifest' });
  }
};

const printOrderManifest = async (req, res) => {
  const { id } = req.params;
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    const order = await prisma.order.findUnique({
      where: { id: BigInt(id) }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user_id !== userId) {
      return res.status(403).json({ message: 'You are not authorized to print manifest for this order' });
    }

    if (!order.shiprocket_order_id) {
      return res.status(400).json({ message: 'No shipment found for this order' });
    }

    const manifestResult = await printManifest([order.shiprocket_order_id]);

    res.json({
      message: 'Manifest retrieved successfully',
      manifest: manifestResult
    });
  } catch (error) {
    console.error('Error printing manifest:', error);
    res.status(500).json({ message: error.message || 'Error printing manifest' });
  }
};

const generateOrderLabel = async (req, res) => {
  const { id } = req.params;
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    const order = await prisma.order.findUnique({
      where: { id: BigInt(id) }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user_id !== userId) {
      return res.status(403).json({ message: 'You are not authorized to generate label for this order' });
    }

    if (!order.shiprocket_shipment_id) {
      return res.status(400).json({ message: 'No shipment found for this order' });
    }

    const labelResult = await generateLabel([order.shiprocket_shipment_id]);

    let labelUrl = null;
    if (labelResult && labelResult.label_url) {
      labelUrl = labelResult.label_url;
    } else if (labelResult && labelResult.data && labelResult.data.label_url) {
      labelUrl = labelResult.data.label_url;
    }

    if (labelUrl) {
      // Customize the label with CheapShip branding
      labelUrl = await labelCustomizer.customize(labelUrl, order.id.toString());

      await prisma.order.update({
        where: { id: order.id },
        data: { label_url: labelUrl }
      });
    }

    res.json({
      message: 'Label generated successfully',
      label_url: labelUrl,
      label_result: labelResult
    });
  } catch (error) {
    console.error('Error generating label:', error);
    res.status(500).json({ message: error.message || 'Error generating label' });
  }
};

const generateOrderInvoice = async (req, res) => {
  const { id } = req.params;
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    const order = await prisma.order.findUnique({
      where: { id: BigInt(id) }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user_id !== userId) {
      return res.status(403).json({ message: 'You are not authorized to generate invoice for this order' });
    }

    if (!order.shiprocket_order_id) {
      return res.status(400).json({ message: 'No shipment order found for this invoice' });
    }

    const { generateInvoice } = require('../utils/shiprocket');
    const invoiceResult = await generateInvoice([order.shiprocket_order_id]);

    let is_new_invoice = false;
    let invoiceUrl = null;

    if (invoiceResult && invoiceResult.is_invoice_created) {
      invoiceUrl = invoiceResult.invoice_url;
      is_new_invoice = true;
    } else if (invoiceResult && invoiceResult.data && invoiceResult.data.invoice_url) {
      invoiceUrl = invoiceResult.data.invoice_url;
    }

    res.json({
      message: 'Invoice generated successfully',
      invoice_url: invoiceUrl,
      is_new_invoice,
      invoice_result: invoiceResult
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ message: error.message || 'Error generating invoice' });
  }
};

const getRemittanceSummary = async (req, res) => {
  const userId = req.user.id;
  const prisma = req.app.locals.prisma;
  const { fromDate, toDate } = req.query;

  try {
    const where = {
      user_id: userId,
      payment_mode: 'COD',
    };

    if (fromDate || toDate) {
      where.created_at = {};
      if (fromDate) where.created_at.gte = new Date(fromDate);
      if (toDate) {
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.created_at.lte = endOfDay;
      }
    }

    const [totalCollected, pendingRemittance, lastRemitted] = await Promise.all([
      prisma.order.aggregate({
        where,
        _sum: { cod_amount: true }
      }),
      prisma.order.aggregate({
        where: { ...where, remittance_status: 'PENDING' },
        _sum: { cod_amount: true }
      }),
      prisma.order.findFirst({
        where: { user_id: userId, remittance_status: 'REMITTED' },
        orderBy: { remitted_at: 'desc' },
        select: { remitted_amount: true, remitted_at: true }
      })
    ]);

    // Estimated next remittance date (Fixed logic: next Tuesday/Friday or 3 days from now)
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 3);

    res.json({
      totalCODCollected: totalCollected._sum.cod_amount || 0,
      pendingRemittanceAmount: pendingRemittance._sum.cod_amount || 0,
      lastRemittedAmount: lastRemitted?.remitted_amount || 0,
      lastRemittedAt: lastRemitted?.remitted_at || null,
      estimatedNextRemittanceDate: nextDate.toISOString()
    });
  } catch (error) {
    console.error('Error fetching remittance summary:', error);
    res.status(500).json({ message: 'Error fetching remittance summary' });
  }
};

const getPendingRemittances = async (req, res) => {
  const userId = req.user.id;
  const prisma = req.app.locals.prisma;
  const { fromDate, toDate } = req.query;

  try {
    const where = {
      user_id: userId,
      payment_mode: 'COD',
      remittance_status: 'PENDING'
    };

    if (fromDate || toDate) {
      where.created_at = {};
      if (fromDate) where.created_at.gte = new Date(fromDate);
      if (toDate) {
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.created_at.lte = endOfDay;
      }
    }

    const pendingOrders = await prisma.order.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        order_receiver_address: true
      }
    });

    const totalPending = pendingOrders.reduce((sum, order) =>
      sum + (parseFloat(order.cod_amount) || 0), 0
    );

    res.json({ orders: pendingOrders, totalPending });
  } catch (error) {
    console.error('Error fetching pending remittances:', error);
    res.status(500).json({ message: 'Error fetching pending remittances' });
  }
};

const getRemittanceHistory = async (req, res) => {
  const userId = req.user.id;
  const prisma = req.app.locals.prisma;
  const { fromDate, toDate } = req.query;

  try {
    const where = {
      user_id: userId,
      remittance_status: 'REMITTED'
    };

    if (fromDate || toDate) {
      where.remitted_at = {};
      if (fromDate) where.remitted_at.gte = new Date(fromDate);
      if (toDate) {
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.remitted_at.lte = endOfDay;
      }
    }

    const remittedOrders = await prisma.order.findMany({
      where,
      orderBy: { remitted_at: 'desc' },
      include: {
        order_receiver_address: true
      }
    });

    res.json(remittedOrders);
  } catch (error) {
    console.error('Error fetching remittance history:', error);
    res.status(500).json({ message: 'Error fetching remittance history' });
  }
};
const getOrdersCount = async (req, res) => {
  const userId = req.user.id;
  const prisma = req.app.locals.prisma;

  try {
    const ordersCount = await prisma.order.count({
      where: {
        user_id: userId
      }
    });

    res.json({ ordersCount });
  } catch (error) {
    console.error('Error fetching orders count:', error);
    res.status(500).json({ message: 'Error fetching orders count' });
  }
}

const updateRemittanceStatus = async (req, res) => {
  const { id } = req.params;
  const { remittance_status, remitted_amount, remittance_ref_id } = req.body;
  const prisma = req.app.locals.prisma;

  try {
    const order = await prisma.order.findUnique({
      where: { id: BigInt(id) }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const updateData = { remittance_status };

    if (remittance_status === 'REMITTED') {
      updateData.remitted_amount = remitted_amount || order.cod_amount;
      updateData.remitted_at = new Date();
      if (remittance_ref_id) {
        updateData.remittance_ref_id = remittance_ref_id;
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: BigInt(id) },
      data: updateData
    });

    res.json({ message: 'Remittance status updated', order: updatedOrder });
  } catch (error) {
    console.error('Error updating remittance status:', error);
    res.status(500).json({ message: 'Error updating remittance status' });
  }
};

const assignOrderAWB = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    const order = await prisma.order.findUnique({
      where: { id: BigInt(id) }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user_id !== userId) {
      return res.status(403).json({ message: 'You are not authorized to assign AWB for this order' });
    }

    // Server-side status validation
    if (order.shipment_status !== 'PENDING' && status !== 'reassign') {
      return res.status(400).json({ message: `Cannot assign AWB for order in ${order.shipment_status} status` });
    }

    if (!order.shiprocket_shipment_id) {
      return res.status(400).json({ message: 'No shipment ID found for this order' });
    }

    const awbResult = await shiprocketAssignAWB({
      shipment_id: order.shiprocket_shipment_id,
      courier_id:  order.courier_id,
      status
    });

    if (awbResult && awbResult.awb_assign_status === 1 && awbResult.response && awbResult.response.data) {
      const awbData = awbResult.response.data;
      
      const updateData = {
        tracking_number: awbData.awb_code,
        shipment_status: 'MANIFESTED',
        courier_name: awbData.courier_name || order.courier_name,
        courier_id: awbData.courier_company_id ? parseInt(awbData.courier_company_id) : order.courier_id
      };

      if (awbData.pickup_scheduled_date) {
        updateData.pickup_scheduled_date = new Date(awbData.pickup_scheduled_date);
      }

      const updatedOrder = await prisma.order.update({
        where: { id: BigInt(id) },
        data: updateData
      });

      return res.json({
        message: 'AWB assigned successfully',
        awb_code: awbData.awb_code,
        pickup_scheduled_date: awbData.pickup_scheduled_date,
        order: updatedOrder
      });
    }

    const errorMessage = awbResult?.message || 
                        awbResult?.response?.data?.awb_assign_error || 
                        'Failed to assign AWB';

    res.status(400).json({ 
      message: sanitizeErrorMessage(errorMessage)
    });
  } catch (error) {
    console.error('Error assigning AWB:', error);
    res.status(500).json({ message: sanitizeErrorMessage(error.message) });
  }
}

const scheduleOrderPickup = async (req, res) => {
  const { id } = req.params;
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    const order = await prisma.order.findUnique({
      where: { id: BigInt(id) }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user_id !== userId) {
      return res.status(403).json({ message: 'You are not authorized to schedule pickup for this order' });
    }

    // Validate that AWB is assigned before scheduling pickup
    if (!order.tracking_number) {
      return res.status(400).json({ message: 'Cannot schedule pickup without an assigned AWB' });
    }

    if (!order.shiprocket_shipment_id) {
      return res.status(400).json({ message: 'No shipment ID found for this order' });
    }

    const pickupResult = await schedulePickup([order.shiprocket_shipment_id]);

    res.json({
      message: 'Pickup scheduled successfully',
      pickup_result: pickupResult
    });
  } catch (error) {
    console.error('Error scheduling pickup:', error);
    res.status(500).json({ message: error.message || 'Error scheduling pickup' });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  calculateRates,
  getPincodeDetails,
  getOrdersCount,
  cancelOrder,
  handleWebhook,
  getOrderTracking,
  getLiveOrderStatus,
  generateOrderManifest,
  printOrderManifest,
  generateOrderLabel,
  getPendingRemittances,
  getRemittanceHistory,
  getRemittanceSummary,
  updateRemittanceStatus,
  generateOrderInvoice,
  assignOrderAWB,
  scheduleOrderPickup
};
