const express = require('express');
const router = express.Router();
const { check, query } = require('express-validator');
const { validationResult } = require('express-validator');
const { getLocalityDetails, getServiceability } = require('../utils/shiprocket');

const getPublicRates = async (req, res) => {
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
    length,
    breadth,
    height,
    mode
  } = req.query;

  try {
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

    const [serviceabilityData] = await Promise.all([
      getServiceability({
        pickup_postcode,
        delivery_postcode,
        weight: weight,
        cod,
        declared_value,
        is_return: 0,
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

    const defaultLogos = {
      10: 'https://s3-ap-south-1.amazonaws.com/kr-shipmultichannel-mum/courier_logo/10.png',
      29: 'https://s3-ap-south-1.amazonaws.com/kr-shipmultichannel-mum/courier_logo/142.png',
      32: 'https://s3-ap-south-1.amazonaws.com/kr-shipmultichannel-mum/courier_logo/142.png',
      43: 'https://s3-ap-south-1.amazonaws.com/kr-shipmultichannel-mum/courier_logo/43.png',
      142: 'https://s3-ap-south-1.amazonaws.com/kr-shipmultichannel-mum/courier_logo/142.png',
      217: 'https://s3-ap-south-1.amazonaws.com/kr-shipmultichannel-mum/courier_logo/217.png',
    };

    const serviceableCouriers = availableCouriers.map(courier => {
      let others = {};
      try {
        others = courier.others ? JSON.parse(courier.others) : {};
      } catch (e) { }

      const courierLogoUrl = others.courier_logo_url || defaultLogos[courier.courier_company_id] || '';
      const baseRate = parseFloat(courier.rate);

      return {
        courier_name: courier.courier_name,
        courier_company_id: courier.courier_company_id,
        rating: courier.rating,
        estimated_delivery: courier.etd,
        delivery_in_days: courier.estimated_delivery_days,
        chargeable_weight: courier.charge_weight,
        rate: Math.ceil(baseRate),
        base_rate: baseRate,
        courier_logo_url: courierLogoUrl,
        is_surface: courier.is_surface,
        mode: courier.mode === 1 ? 'Air' : 'Surface',
        is_recommended: courier.courier_company_id === serviceabilityData.data.recommended_courier_company_id,
        custom_tag: null,
        is_vyom: false
      };
    }).sort((a, b) => a.rate - b.rate);

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
      serviceable_couriers: serviceableCouriers
    };

    res.json(formattedResponse);
  } catch (error) {
    console.error('Error calculating public rates:', error);
    res.status(500).json({ message: 'Error calculating rates from Shiprocket' });
  }
};

const getPublicPincodeDetails = async (req, res) => {
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

router.get(
  '/calculate-rates',
  [
    query('pickup_postcode', 'Pickup postcode is required').not().isEmpty(),
    query('delivery_postcode', 'Delivery postcode is required').not().isEmpty(),
    query('weight', 'Weight is required').not().isEmpty(),
  ],
  getPublicRates
);

router.get(
  '/pincode-details',
  [
    query('postcode', 'Postcode is required').not().isEmpty(),
  ],
  getPublicPincodeDetails
);

module.exports = router;