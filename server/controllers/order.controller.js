const { validationResult } = require('express-validator');
const { generateOrderId } = require('../utils/generateOrderId');
const { getServiceability, getLocalityDetails, createShipment, cancelShipment, assignAWB: shiprocketAssignAWB, generateLabel, generateManifest, printManifest, getShipmentTracking, getShipmentDetails, schedulePickup, generateRTOLabel, addPickupLocation, getPickupLocations, isNumberVerified } = require('../utils/shiprocket');
const { createReferralCommissions } = require('../utils/referral.commissions');
const labelCustomizer = require('../utils/label-customizer');
const vyom = require('../utils/vyom');
const { getReferralChain } = require('../utils/referral.commissions');
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

const generateLabelAsync = async (orderId, shipmentId) => {
  const prisma = require('../utils/prisma'); // Get prisma instance
  const { generateLabel } = require('../utils/shiprocket');
  const labelCustomizer = require('../utils/label-customizer');

  console.log(`[Async Label] Starting label generation for order ${orderId}, shipment ${shipmentId}`);

  const labelResult = await generateLabel([shipmentId]);

  let labelUrl = null;
  if (labelResult && labelResult.label_url) {
    labelUrl = labelResult.label_url;
  } else if (labelResult && labelResult.data && labelResult.data.label_url) {
    labelUrl = labelResult.data.label_url;
  }

  if (labelUrl) {
    labelUrl = await labelCustomizer.customize(labelUrl, orderId.toString());

    await prisma.order.update({
      where: { id: orderId },
      data: { label_url: labelUrl }
    });

    console.log(`[Async Label] Label generated successfully for order ${orderId}`);
  } else {
    console.warn(`[Async Label] No label URL returned for order ${orderId}`);
  }
};

// Helper to calculate final rates with commissions
const calculateFinalRates = async (prisma, userId, availableCouriers, recommendedId = null) => {
  // console.log(`[Price Calc] Calculating final rates for user ${userId} with ${availableCouriers.length} couriers`);

  const [user, globalSetting, courierConfigs, levelSetting] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { commission_rate: true, assigned_rates: true, referred_by: true }
    }),
    prisma.systemSetting.findUnique({
      where: { key: 'global_commission_rate' }
    }),
    prisma.courierConfiguration.findMany(),
    prisma.systemSetting.findUnique({
      where: { key: 'max_referral_levels' }
    })
  ]);
  // console.log(levelSetting, " : Level settings");
  const courierConfigMap = courierConfigs.reduce((acc, config) => {
    acc[config.courier_company_id] = config;
    return acc;
  }, {});

  const globalCommissionRate = globalSetting ? parseFloat(globalSetting.value) : 0;

  // console.group(`[Global Commission] Fetching setting for user ${userId}`);
  // console.log('globalSetting:', globalSetting);
  // console.log('globalCommissionRate:', globalCommissionRate);
  // console.groupEnd();

  const franchiseCommissionRate = user?.commission_rate ? parseFloat(user.commission_rate.toString()) : (user?.referred_by ? 5 : 0);
  const assignedRates = user?.assigned_rates || {};
  const maxReferralLevels = levelSetting ? parseInt(levelSetting.value) : 0;


  const referralChain = maxReferralLevels > 0 ? await getReferralChain(prisma, userId, maxReferralLevels) : [];

  // console.log(`[Commission Calc] User ${userId}: ${referralChain.length} levels in chain`);

  return availableCouriers.map(courier => {
    const courierConfig = assignedRates[courier.courier_company_id] || assignedRates[courier.courier_name] || {};
    const markupPercent = courierConfig.rate !== undefined ? parseFloat(courierConfig.rate) : franchiseCommissionRate;

    const baseRate = parseFloat(courier.rate);

    const globalCommissionAmount = (baseRate * globalCommissionRate) / 100;
    const franchiseCommissionAmount = (baseRate * markupPercent) / 100;

    let referralCommissionAmount = 0;

    for (let i = 0; i < referralChain.length; i++) {
      const receiverNode = referralChain[i];
      const giverRate = receiverNode.commission_rate;

      if (giverRate > 0) {
        const commission = (baseRate * giverRate) / 100;
        if (commission > 0.01) {
          referralCommissionAmount += commission;
          // console.log(`[Commission Calc] Level ${i + 1}: rate=${giverRate}%, amount=${commission.toFixed(2)}`);
        }
      }
    }

    // console.log(`[Commission Calc] Total referral commission: ${referralCommissionAmount.toFixed(2)}`);

    const finalRate = Math.ceil(baseRate + globalCommissionAmount + referralCommissionAmount);

    // console.group(`[Global Commission] ${courier.courier_name}`);
    // console.log('baseRate:', baseRate);
    // console.log('globalCommissionRate %:', globalCommissionRate);
    // console.log('globalCommissionAmount:', globalCommissionAmount.toFixed(2));
    // console.log('franchiseCommissionAmount:', franchiseCommissionAmount.toFixed(2));
    // console.log('referralCommissionAmount:', referralCommissionAmount.toFixed(2));
    // console.log('finalRate:', finalRate);
    // console.groupEnd();

    const dbConfig = courierConfigMap[courier.courier_company_id] || {};

    let others = {};
    try {
      others = courier.others ? JSON.parse(courier.others) : {};
    } catch (e) { }

    const defaultLogos = {
      10: 'https://s3-ap-south-1.amazonaws.com/kr-shipmultichannel-mum/courier_logo/10.png',
      29: 'https://s3-ap-south-1.amazonaws.com/kr-shipmultichannel-mum/courier_logo/142.png',
      32: 'https://s3-ap-south-1.amazonaws.com/kr-shipmultichannel-mum/courier_logo/142.png',
      43: 'https://s3-ap-south-1.amazonaws.com/kr-shipmultichannel-mum/courier_logo/43.png',
      142: 'https://s3-ap-south-1.amazonaws.com/kr-shipmultichannel-mum/courier_logo/142.png',
      217: 'https://s3-ap-south-1.amazonaws.com/kr-shipmultichannel-mum/courier_logo/217.png',
    };

    const courierLogoUrl = others.courier_logo_url || defaultLogos[courier.courier_company_id] || '';

    return {
      courier_name: courier.courier_name,
      courier_company_id: courier.courier_company_id,
      rating: courier.rating,
      estimated_delivery: courier.etd,
      delivery_in_days: courier.estimated_delivery_days,
      chargeable_weight: courier.charge_weight,
      rate: finalRate,
      base_rate: baseRate,
      courier_logo_url: courierLogoUrl,
      global_commission_rate: globalCommissionRate,
      global_commission_amount: globalCommissionAmount,
      franchise_commission_rate: markupPercent,
      franchise_commission_amount: franchiseCommissionAmount,
      referral_commission_amount: referralCommissionAmount,
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
        weight: weight,
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

    const filteredCourierIds = [217];
    availableCouriers = availableCouriers.filter(courier => !filteredCourierIds.includes(courier.courier_company_id));

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
        referral_commission_amount,
        ...publicData
      }) => {
        const { referral_commission_amount: _, ...rest } = publicData;
        return rest;
      }).sort((a, b) => a.rate - b.rate)
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
    is_draft,
    draft_id
  } = req.body;
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  // COD amount validation
  if (payment_mode === 'COD') {
    const codAmount = parseFloat(cod_amount) || parseFloat(total_amount);
    if (codAmount > 100000) {
      return res.status(400).json({ error: 'COD amount cannot exceed 1 lakh (₹100,000)' });
    }
  }

  // Product value validation - max ₹4,75,000 per product
  if (products && products.length > 0) {
    for (const product of products) {
      const productPrice = parseFloat(product.price) || 0;
      if (productPrice > 475000) {
        return res.status(400).json({ error: 'Product value cannot exceed ₹4,75,000' });
      }
    }
  }

  // Total amount validation - max ₹4,75,000
  if (total_amount && parseFloat(total_amount) > 475000) {
    return res.status(400).json({ error: 'Total amount cannot exceed ₹4,75,000' });
  }

  try {
    // KYC Check for ALL orders (not just first order)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { kyc_status: true, wallet_balance: true, security_deposit: true }
    });

    // Enforce KYC for all non-draft orders
    if (!is_draft) {
      if (user.kyc_status !== 'VERIFIED') {
        return res.status(403).json({
          message: 'KYC verification (Aadhaar/PAN) is required to create an order.',
          code: 'KYC_REQUIRED'
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
      let draftedOrder;

      // If draft_id is provided, update existing draft; otherwise create new
      if (draft_id) {
        // Update existing draft
        draftedOrder = await prisma.order.update({
          where: { id: BigInt(draft_id), user_id: userId, is_draft: true },
          data: {
            order_type: order_type || 'SURFACE',
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
            order_pickup_address: {
              update: {
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
              update: {
                name: receiver_address.name,
                phone: receiver_address.phone,
                email: receiver_address.email,
                address: receiver_address.address,
                city: receiver_address.city,
                state: receiver_address.state,
                pincode: receiver_address.pincode
              }
            }
          },
          include: {
            order_pickup_address: true,
            order_receiver_address: true
          }
        });
      } else {
        // Create new draft
        draftedOrder = await prisma.order.create({
          data: {
            id: generateOrderId(),
            user_id: userId,
            order_type: order_type || 'SURFACE',
            is_draft: true,
            shipment_status: 'DRAFT',
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
          },
          include: {
            order_pickup_address: true,
            order_receiver_address: true
          }
        });
      }

      return res.status(201).json({
        message: draft_id ? 'Draft updated successfully' : 'Order saved as draft successfully',
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
      weight: weight,
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
    const orderId = generateOrderId();
    const newOrder = await prisma.$transaction(async (tx) => {
      // 1. Check wallet balance with new formula
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { wallet_balance: true, security_deposit: true }
      });

      const orderAmount = Number(serverShippingCharge || 0);
      const securityDepositAmount = orderAmount; // Same as order amount
      const totalDeduction = orderAmount * 2; // 2x order amount for wallet deduction

      // New validation: Get undelivered orders (not including cancelled, delivered, RTO)
      // const undeliveredOrders = await tx.order.findMany({
      //   where: {
      //     user_id: userId,
      //     shipment_status: {
      //       in: ['PENDING', 'MANIFESTED', 'IN_TRANSIT', 'DISPATCHED', 'NOT_PICKED']
      //     },
      //     is_draft: false
      //   },
      //   select: { shipping_charge: true }
      // });

      // const undeliveredTotal = undeliveredOrders.reduce((sum, order) => sum + Number(order.shipping_charge || 0), 0);

      // New formula: wallet_balance > (undeliveredTotal) + (2 × newOrderAmount)
      // const requiredBalance = (orderAmount * 2);

      if (Number(user.wallet_balance) < totalDeduction) {
        throw new Error(`Insufficient wallet balance. Required: ₹${totalDeduction.toFixed(2)}, Available Wallet Balance: ₹${Number(user.wallet_balance).toFixed(2)}`);
      }

      // 2. Debit wallet (2x order amount - 1x for shipping, 1x as security hold) & transfer to security deposit (atomic)
      await tx.user.update({
        where: { id: userId },
        data: {
          wallet_balance: { decrement: totalDeduction },
          security_deposit: { increment: securityDepositAmount }
        }
      });

      // Calculate closing balances programmatically (transaction ensures atomicity)
      const closingWalletBalance = Number(user.wallet_balance) - orderAmount;
      const closingSecurityDeposit = Number(user.wallet_balance) - totalDeduction;

      // 4. Create transaction record for order payment (DEBIT)
      // 5. Create transaction record for security deposit (CREDIT to security)
      const [orderPaymentTransaction, securityDepositTransaction] = await Promise.all([
        tx.transaction.create({
          data: {
            user_id: userId,
            amount: orderAmount,
            closing_balance: closingWalletBalance,
            type: 'DEBIT',
            category: 'ORDER_PAYMENT',
            status: 'SUCCESS',
            description: `Shipping charge for Order ${order_type}`,
          }
        }),
        tx.transaction.create({
          data: {
            user_id: userId,
            amount: securityDepositAmount,
            closing_balance: closingSecurityDeposit,
            type: 'DEBIT',
            category: 'SECURITY_DEPOSIT',
            status: 'SUCCESS',
            description: `Security deposit held for Order ${order_type}`,
          }
        })
      ]);
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
          id: orderId,
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
          cod_amount: payment_mode === 'COD' ? Math.round(parseFloat(cod_amount) * 100) / 100 : null,
          remittance_status: payment_mode === 'COD' ? 'PENDING' : 'NOT_APPLICABLE',
          pickup_location: pickup_location || null
        }
      });

      // 3.1 Create SecurityDeposit record for tracking (after Order exists)
      await tx.securityDeposit.create({
        data: {
          user_id: userId,
          order_id: orderId,
          amount: securityDepositAmount,
          used_amount: 0,
          remaining: securityDepositAmount,
          status: 'ACTIVE'
        }
      });

      // console.log(`[Order Create] Commission fields - global_rate: ${chosenCourier.global_commission_rate}, global_amt: ${chosenCourier.global_commission_amount}, franchise_rate: ${chosenCourier.franchise_commission_rate}, franchise_amt: ${chosenCourier.franchise_commission_amount}`);

      // Create multi-level referral commissions (flat from base shipping)
      const baseCommissionAmount = parseFloat(order.base_shipping_charge || 0);
      // console.log(`[Order Commission] Order ${order.id}: baseAmount=${baseCommissionAmount}, maxLevels=${maxLevels}`);
      if (baseCommissionAmount > 0) {
        const commissions = await createReferralCommissions(tx, order.id, userId, baseCommissionAmount, maxLevels);
        // console.log(`[Order Commission] Created ${commissions.length} referral commissions for order ${order.id}`);
        // commissions.forEach(c => {
        //   console.log(`[Order Commission] Level ${c.level}: ${c.amount} to user ${c.referrer_id}`);
        // });
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
          shipping_charges: 0,
          // shipping_charges: parseFloat(serverShippingCharge),
          sub_total: payment_mode !== 'COD' ? parseFloat(total_amount) : parseFloat(cod_amount),
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

              generateLabelAsync(order.id, awbData.shipment_id || order.shiprocket_shipment_id).catch(err => {
                console.warn(`Async label generation failed for order ${order.id}:`, err.message);
              });
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

        // Auto-cancel the order if shipment creation failed
        try {
          await tx.order.update({
            where: { id: order.id },
            data: { shipment_status: 'CANCELLED' }
          });
          console.log(`Order ${order.id} auto-cancelled due to shipment creation failure`);
        } catch (cancelError) {
          console.error('Failed to auto-cancel order:', cancelError);
        }

        // Re-throw the error to rollback the transaction
        throw new Error(shipmentError.message || 'Failed to create shipment');
      }

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
  const {
    page = 1,
    pageSize = 10,
    shipment_status,
    order_type,
    shipment_type,
    payment_mode,
    from,
    to,
    search,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = req.query;
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
  } else if (shipment_status && shipment_status !== 'ALL') {
    where.is_draft = false;
    where.shipment_status = shipment_status;
  }
  // When shipment_status is 'ALL', don't filter by is_draft - show all orders including drafts

  if (order_type && order_type !== 'ALL') {
    where.order_type = order_type;
  }

  if (shipment_type && shipment_type !== 'ALL') {
    where.shipment_type = shipment_type;
  }

  if (payment_mode && payment_mode !== 'ALL') {
    where.payment_mode = payment_mode;
  }

  if (search) {
    const searchTerm = search.trim();
    const searchNum = parseInt(searchTerm, 10);

    where.OR = [
      { id: isNaN(searchNum) ? undefined : BigInt(searchNum) },
      { shiprocket_order_id: { contains: searchTerm, mode: 'insensitive' } },
      { shiprocket_shipment_id: { contains: searchTerm, mode: 'insensitive' } },
      { tracking_number: { contains: searchTerm, mode: 'insensitive' } },
      { label_url: { contains: searchTerm, mode: 'insensitive' } },
      { manifest_url: { contains: searchTerm, mode: 'insensitive' } },
      { vyom_order_id: { contains: searchTerm, mode: 'insensitive' } },
      { vyom_shipment_id: { contains: searchTerm, mode: 'insensitive' } },
      { courier_name: { contains: searchTerm, mode: 'insensitive' } },
    ].filter(condition => {
      const keys = Object.keys(condition);
      return keys.length > 0 && condition[keys[0]] !== undefined;
    });
  }

  if (from || to) {
    where.created_at = {};
    if (from) {
      where.created_at.gte = new Date(from);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.created_at.lte = toDate;
    }
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

    // Allow cancellation if status is PENDING, PROCESSING, MANIFESTED or if it's a draft
    const isCancellable = (order.shipment_status === 'PENDING' || order.shipment_status === 'PROCESSING' || order.shipment_status === 'MANIFESTED' || order.is_draft);

    if (!isCancellable) {
      return res.status(400).json({
        message: 'Order can only be cancelled if status is PENDING, PROCESSING, or MANIFESTED',
        current_status: order.shipment_status
      });
    }

    // For drafts, simply delete the order without any refund
    if (order.is_draft) {
      await prisma.order.delete({
        where: { id: BigInt(id) }
      });
      return res.status(200).json({ message: 'Draft order deleted successfully' });
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
      const securityAmount = Number(order.shipping_charge || 0); // Security deposit equals shipping charge

      // Refund shipping charge to wallet
      if (refundAmount > 0) {
        await tx.user.update({
          where: { id: userId },
          data: {
            wallet_balance: { increment: refundAmount }
          }
        });

        // Get updated wallet balance
        const updatedUser = await tx.user.findUnique({
          where: { id: userId },
          select: { wallet_balance: true, security_deposit: true }
        });

        await tx.transaction.create({
          data: {
            user_id: userId,
            amount: refundAmount,
            closing_balance: Number(updatedUser.wallet_balance),
            type: 'CREDIT',
            category: 'REFUND',
            status: 'SUCCESS',
            description: `Shipping charge refund for cancelled order #${id}`,
            reference_id: id.toString()
          }
        });
      }

      // Refund security deposit
      if (securityAmount > 0) {
        // Deduct from security deposit
        await tx.user.update({
          where: { id: userId },
          data: {
            security_deposit: { decrement: securityAmount }
          }
        });

        // Add back to wallet
        await tx.user.update({
          where: { id: userId },
          data: {
            wallet_balance: { increment: securityAmount }
          }
        });

        // Get updated balances
        const updatedUser = await tx.user.findUnique({
          where: { id: userId },
          select: { wallet_balance: true, security_deposit: true }
        });

        // Create transaction record for security refund to wallet
        await tx.transaction.create({
          data: {
            user_id: userId,
            amount: securityAmount,
            closing_balance: Number(updatedUser.wallet_balance),
            type: 'CREDIT',
            category: 'REFUND',
            status: 'SUCCESS',
            description: `Security deposit refund for cancelled order #${id}`,
            reference_id: id.toString()
          }
        });

        // Update SecurityDeposit record to REFUNDED
        await tx.securityDeposit.updateMany({
          where: { order_id: BigInt(id), user_id: userId },
          data: {
            remaining: 0,
            status: 'REFUNDED',
            updated_at: new Date()
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

const mapShiprocketStatus = (shiprocketStatus, srStatusId = null) => {
  if (!shiprocketStatus) return 'PENDING';

  const status = shiprocketStatus.toString().toLowerCase().trim();

  // Map by status ID if provided
  if (srStatusId !== null) {
    const idStatusMap = {
      19: 'OUT_FOR_PICKUP',
      42: 'PICKED_UP',
      6: 'IN_TRANSIT',
      17: 'OUT_FOR_DELIVERY',
      7: 'DELIVERED',
      51: 'PICKED_UP',
      34: 'OUT_FOR_PICKUP'
    };
    if (idStatusMap[srStatusId]) {
      return idStatusMap[srStatusId];
    }
  }

  const statusMap = {
    'pending': 'PENDING',
    'processing': 'PROCESSING',
    'manifested': 'MANIFESTED',
    'manifested - pickup scheduled': 'MANIFESTED',
    'manifested - out for pickup': 'OUT_FOR_PICKUP',
    'in transit': 'IN_TRANSIT',
    'shipped': 'IN_TRANSIT',
    'in transit - shipment picked up': 'PICKED_UP',
    'pending - shipment received at origin center': 'IN_TRANSIT',
    'out for delivery': 'OUT_FOR_DELIVERY',
    'dispatched - out for delivery': 'OUT_FOR_DELIVERY',
    'dispatched': 'DISPATCHED',
    'delivered': 'DELIVERED',
    'delivered - delivered to consignee': 'DELIVERED',
    'cancelled': 'CANCELLED',
    'canceled': 'CANCELLED',
    'rto': 'RTO',
    'rto_delivered': 'RTO_DELIVERED',
    'lost': 'CANCELLED',
    'damaged': 'CANCELLED',
    'not_picked': 'NOT_PICKED',
    'pickup_exception': 'PENDING',
    'pickup_error': 'PENDING',
    'out for pickup': 'OUT_FOR_PICKUP',
    'picked up': 'PICKED_UP'
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
    if (orderId === 1234) {
      return res.status(200).json({ success: true, message: 'Webhook processed successfully' });
    }
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
  // Use shipment_status_id if provided for more accurate mapping
  const srStatusId = payload.shipment_status_id || payload.current_status_id;
  const newStatus = mapShiprocketStatus(payload.shipment_status || payload.status || payload.current_status, srStatusId);

  const updateData = {
    shipment_status: newStatus
  };

  if (payload.awb || payload.tracking_number) {
    updateData.tracking_number = payload.awb || payload.tracking_number;
  }

  if (payload.pickup_scheduled_date) {
    updateData.pickup_scheduled_date = new Date(payload.pickup_scheduled_date);
  }

  if (payload.etd) {
    updateData.etd = payload.etd;
  }

  // Handle security deposit release on delivery
  if (newStatus === 'DELIVERED') {
    updateData.delivered_at = new Date();
    // Security deposit remains with user - no auto release on delivery
  }

  // Handle CANCELLED status - release security deposit and refund to wallet
  if (newStatus === 'CANCELLED' && order.shipment_status !== 'CANCELLED') {
    const securityAmount = Number(order.shipping_charge || 0);

    if (securityAmount > 0) {
      await prisma.$transaction(async (tx) => {
        // Release security deposit
        await tx.user.update({
          where: { id: order.user_id },
          data: {
            security_deposit: { decrement: securityAmount }
          }
        });

        // Get updated security deposit
        const updatedUser = await tx.user.findUnique({
          where: { id: order.user_id },
          select: { wallet_balance: true, security_deposit: true }
        });

        // Create transaction record for security release
        await tx.transaction.create({
          data: {
            user_id: order.user_id,
            amount: securityAmount,
            closing_balance: Number(updatedUser.wallet_balance),
            type: 'CREDIT',
            category: 'REFUND',
            status: 'SUCCESS',
            description: `Security deposit released for cancelled Order #${order.id}`,
            reference_id: String(order.id)
          }
        });

        // Refund shipping charge to wallet
        await tx.user.update({
          where: { id: order.user_id },
          data: {
            wallet_balance: { increment: securityAmount }
          }
        });

        const finalUser = await tx.user.findUnique({
          where: { id: order.user_id },
          select: { wallet_balance: true }
        });

        // Create transaction record for shipping refund
        await tx.transaction.create({
          data: {
            user_id: order.user_id,
            amount: securityAmount,
            closing_balance: Number(finalUser.wallet_balance),
            type: 'CREDIT',
            category: 'REFUND',
            status: 'SUCCESS',
            description: `Shipping charge refunded for cancelled Order #${order.id}`,
            reference_id: String(order.id)
          }
        });

        // Update SecurityDeposit record to REFUNDED
        await tx.securityDeposit.updateMany({
          where: { order_id: order.id, user_id: order.user_id },
          data: {
            remaining: 0,
            status: 'REFUNDED',
            updated_at: new Date()
          }
        });
      });
    }
  }

  // Handle RTO status - release security deposit (no refund since it's RTO)
  if ((newStatus === 'RTO' || newStatus === 'RTO_DELIVERED') &&
    order.shipment_status !== 'RTO' && order.shipment_status !== 'RTO_DELIVERED') {
    const securityAmount = Number(order.shipping_charge || 0);

    if (securityAmount > 0) {
      await prisma.$transaction(async (tx) => {
        // Release security deposit (but don't refund - RTO charges may apply)
        await tx.user.update({
          where: { id: order.user_id },
          data: {
            security_deposit: { decrement: securityAmount }
          }
        });

        const updatedUser = await tx.user.findUnique({
          where: { id: order.user_id },
          select: { wallet_balance: true, security_deposit: true }
        });

        // Create transaction record for security release (RTO)
        await tx.transaction.create({
          data: {
            user_id: order.user_id,
            amount: securityAmount,
            closing_balance: Number(updatedUser.wallet_balance),
            type: 'DEBIT',
            category: 'RTO_CHARGE',
            status: 'SUCCESS',
            description: `Security deposit adjusted for RTO Order #${order.id}`,
            reference_id: String(order.id)
          }
        });
      });
    }
  }

  // Handle NOT_PICKED status - security deposit remains with user
  if (newStatus === 'NOT_PICKED' && order.shipment_status !== 'NOT_PICKED') {
    // Security deposit remains with user - no auto release on NOT_PICKED
  }

  // Handle COD remittance status for delivered orders
  if (newStatus === 'DELIVERED' && order.payment_mode === 'COD') {
    updateData.remittance_status = 'PENDING';
  }

  // Handle COD remittance failure - return COD amount to user if remittance fails
  if (payload.remittance_failed || payload.cod_refund) {
    const codAmount = Number(order.cod_amount || 0);
    if (codAmount > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: order.user_id },
          data: {
            wallet_balance: { increment: codAmount }
          }
        });

        const updatedUser = await tx.user.findUnique({
          where: { id: order.user_id },
          select: { wallet_balance: true }
        });

        await tx.transaction.create({
          data: {
            user_id: order.user_id,
            amount: codAmount,
            closing_balance: Number(updatedUser.wallet_balance),
            type: 'CREDIT',
            category: 'COD_REFUND',
            status: 'SUCCESS',
            description: `COD refund for Order #${order.id} (Remittance Failed)`,
            reference_id: String(order.id)
          }
        });
      });
    }
  }

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: updateData
  });

  // Log main history entry
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

  // Process scans array for detailed history if provided
  if (payload.scans && Array.isArray(payload.scans) && payload.scans.length > 0) {
    // Get existing history count to avoid duplicates
    const existingHistoryCount = await prisma.shipmentHistory.count({
      where: { order_id: order.id }
    });

    // Only add new scan entries if this is not a replay of old data
    // Check if scans are new by comparing with existing history
    const existingHistory = await prisma.shipmentHistory.findMany({
      where: { order_id: order.id },
      orderBy: { status_date: 'asc' },
      take: payload.scans.length
    });

    // Create history entries for each scan
    const scanHistoryEntries = [];
    for (const scan of payload.scans) {
      // Check if this scan already exists in history
      const scanDate = new Date(scan.date);
      const exists = existingHistory.some(h =>
        h.activity === scan.activity &&
        Math.abs(new Date(h.status_date).getTime() - scanDate.getTime()) < 60000 // within 1 minute
      );

      if (!exists) {
        scanHistoryEntries.push({
          order_id: order.id,
          status: scan.status || scan['sr-status'] || 'UPDATED',
          status_date: scanDate,
          location: scan.location || '',
          shipment_status: mapShiprocketStatus(scan['sr-status-label'] || scan.activity, scan['sr-status'] ? parseInt(scan['sr-status']) : null),
          activity: scan.activity || scan['sr-status-label'] || ''
        });
      }
    }

    // Bulk create new scan history entries
    if (scanHistoryEntries.length > 0) {
      await prisma.shipmentHistory.createMany({
        data: scanHistoryEntries,
        skipDuplicates: true
      });
    }
  }

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
  // const userId = req.user.id;

  try {
    const order = await prisma.order.findUnique({
      where: { id: BigInt(id) },
      include: {
        order_pickup_address: true,
        order_receiver_address: true
      }
    });

    if (!order) {
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
        where: { ...where, payout_status: 'PENDING' },
        _sum: { cod_amount: true }
      }),
      prisma.order.findFirst({
        where: { user_id: userId, payout_status: 'COMPLETED' },
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
      payout_status: 'PENDING'
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
      payout_status: 'COMPLETED'
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
      courier_id: order.courier_id,
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
  const { pickup_date } = req.body;
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

    const pickupDateStr = pickup_date ? pickup_date : null;
    const pickupResult = await schedulePickup([order.shiprocket_shipment_id], pickupDateStr);

    if (pickupResult.Status === false) {
      return res.status(400).json({ message: pickupResult.message || 'Failed to schedule pickup' });
    }

    res.json({
      message: 'Pickup scheduled successfully',
      pickup_result: pickupResult
    });
  } catch (error) {
    console.error('Error scheduling pickup:', error);
    res.status(500).json({ message: error.message || 'Error scheduling pickup' });
  }
};

const getUndeliveredSummary = async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = req.user.id;

  try {
    // Get all undelivered orders (not including cancelled, delivered, RTO)
    const undeliveredOrders = await prisma.order.findMany({
      where: {
        user_id: userId,
        shipment_status: {
          in: ['PENDING', 'MANIFESTED', 'IN_TRANSIT', 'DISPATCHED', 'NOT_PICKED']
        },
        is_draft: false
      },
      select: {
        id: true,
        shipping_charge: true,
        shipment_status: true,
        created_at: true
      }
    });

    const undeliveredCount = undeliveredOrders.length;
    const undeliveredTotal = undeliveredOrders.reduce(
      (sum, order) => sum + Number(order.shipping_charge || 0),
      0
    );

    // Get user wallet and security deposit info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        wallet_balance: true,
        security_deposit: true
      }
    });

    res.json({
      success: true,
      undelivered_count: undeliveredCount,
      undelivered_amount: undeliveredTotal,
      wallet_balance: Number(user.wallet_balance || 0),
      security_deposit: Number(user.security_deposit || 0)
    });
  } catch (error) {
    console.error('Error fetching undelivered summary:', error);
    res.status(500).json({ message: 'Error fetching summary' });
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
  scheduleOrderPickup,
  getUndeliveredSummary
};
