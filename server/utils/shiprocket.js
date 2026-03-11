const map = new Map();

const userToken = process.env.SHIP_ROCKET_USER_TOKEN ||  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vYXBpdjIuc2hpcHJvY2tldC5jby92MS9hdXRoL3JlZ2lzdGVyL21vYmlsZS92YWxpZGF0ZS1vdHAiLCJpYXQiOjE3NzIxOTY1MTUsImV4cCI6MTc3MzA2MDUxNSwibmJmIjoxNzcyMTk2NTE1LCJqdGkiOiJoUkF3Z3hSV3RkV3h6Y2ViIiwic3ViIjo5NTIxODcwLCJwcnYiOiIwNWJiNjYwZjY3Y2FjNzQ1ZjdiM2RhMWVlZjE5NzE5NWEyMTFlNmQ5IiwiY2lkIjo5MjU3ODQ4fQ.RuxSbxAqWZuEdafyh7odP7xbOxJvqvn_Xogn5l8cYUU";

const getShiprocketToken = async () => {
  if (map.has('token') ) {
    return map.get('token').value;
  }
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  const NINE_DAYS = 9 * 24 * 60 * 60 * 1000; // ms


  if (!email || !password) {
    throw new Error('Shiprocket credentials not found in environment variables');
  }

  try {
    const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    console.log("token generated ", data);
    if (!response.ok) {
      throw new Error(data.message || 'Failed to login to Shiprocket');
    }
    map.set('token', {
      value: data.token,
      expiresAt: Date.now() + NINE_DAYS
    });
    return data.token;

  } catch (error) {
    console.error('Shiprocket login error:', error);
    throw error;
  }
};

const getServiceability = async (params) => {
  const token = await getShiprocketToken();

  const { mode, ...restParams } = params;
  const queryParams = new URLSearchParams(restParams).toString();

  if (process.env.NODE_ENV === 'development') {
    console.log('[Shiprocket] Serviceability API params:', restParams);
  }
  console.log('[Shiprocket] Serviceability API params:', queryParams);
  try {
    const response = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/serviceability/?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
  
    if (process.env.NODE_ENV !== 'production') {
      // console.log('[Shiprocket] Serviceability API response:', JSON.stringify(data, null, 2));
      // console.log('[Shiprocket] Couriers returned:', data?.data?.available_courier_companies?.length || 0);
    }

    if (!response.ok) {
      return data;
    }

    return data;
  } catch (error) {
    console.error('Shiprocket serviceability error:', error);
    throw error;
  }
};

const createQuickOrder = async (orderData) => {
  const token = await getShiprocketToken();

  const payload = {
    order_id: orderData.order_id,
    order_date: orderData.order_date || new Date().toISOString().split('T')[0],
    pickup_location: orderData.pickup_location,
    billing_customer_name: orderData.billing_customer_name,
    billing_last_name: orderData.billing_last_name || '',
    billing_address: orderData.billing_address,
    billing_city: orderData.billing_city,
    billing_pincode: parseInt(orderData.billing_pincode),
    billing_state: orderData.billing_state,
    billing_country: orderData.billing_country || 'India',
    billing_email: orderData.billing_email,
    billing_phone: orderData.billing_phone,
    shipping_is_billing: orderData.shipping_is_billing !== undefined ? orderData.shipping_is_billing : true,
    order_items: orderData.order_items.map(item => ({
      name: item.name,
      sku: item.sku,
      units: parseInt(item.units),
      selling_price: parseFloat(item.selling_price),
      discount: parseFloat(item.discount || 0),
      tax: parseFloat(item.tax || 0),
      hsn: item.hsn || ''
    })),
    payment_method: orderData.payment_method || 'Prepaid',
    shipping_charges: parseFloat(orderData.shipping_charges) || 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: 0,
    sub_total: parseFloat(orderData.sub_total),
    length: parseFloat(orderData.length),
    breadth: parseFloat(orderData.breadth || orderData.width),
    height: parseFloat(orderData.height),
    weight: parseFloat(orderData.weight) / 1000,
  };

  if (payload.shipping_is_billing === false || payload.shipping_is_billing === 'false') {
    payload.shipping_customer_name = orderData.shipping_customer_name;
    payload.shipping_last_name = orderData.shipping_last_name || '';
    payload.shipping_address = orderData.shipping_address;
    payload.shipping_city = orderData.shipping_city;
    payload.shipping_pincode = parseInt(orderData.shipping_pincode);
    payload.shipping_state = orderData.shipping_state;
    payload.shipping_country = orderData.shipping_country || 'India';
    payload.shipping_email = orderData.shipping_email || orderData.billing_email;
    payload.shipping_phone = orderData.shipping_phone;
  }

  try {
    const response = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("api data ", JSON.stringify(data))
    console.log("api data ", token);
    if (!response.ok) {
      console.error('Shiprocket create quick order error:', data);
      throw new Error(data.message || 'Failed to create quick order');
    }

    return data;
  } catch (error) {
    console.error('Shiprocket create quick order error:', error);
    throw error;
  }
};

const createShipment = async (orderData) => {
  return createQuickOrder(orderData);
};

const cancelShipment = async (shipmentId) => {
  const token = await getShiprocketToken();

  try {
    const response = await fetch(`https://apiv2.shiprocket.in/v1/external/orders/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ ids: [parseInt(shipmentId)] }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Shiprocket cancel shipment error:', data);
      throw new Error(data.message || 'Failed to cancel shipment');
    }

    return data;
  } catch (error) {
    console.error('Shiprocket cancel shipment error:', error);
    throw error;
  }
};

const generateLabel = async (shipmentIds) => {
  const token = await getShiprocketToken();

  // Ensure shipmentIds is an array
  const ids = Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds];

  try {
    const response = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/generate/label`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ shipment_id: ids.map(id => parseInt(id)) }),
    });

    const data = await response.json();
    console.log("Shiprocket generate label response:", data);
    if (!response.ok) {
      console.error('Shiprocket generate label error:', data);
      throw new Error(data.message || 'Failed to generate label');
    }

    return data;
  } catch (error) {
    console.error('Shiprocket generate label error:', error);
    throw error;
  }
};

const assignAWB = async ({ shipment_id, courier_id, status }) => {
  const token = await getShiprocketToken();

  const payload = {
    shipment_id: parseInt(shipment_id)
  };

  if (courier_id) {
    payload.courier_id = parseInt(courier_id);
  }

  if (status) {
    payload.status = status;
  }

  try {
    const response = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/assign/awb`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("Shiprocket assign AWB response:", data);
    if (!response.ok) {
      console.error('Shiprocket assign AWB error:', data);
      throw new Error(data.message || 'Failed to assign AWB');
    }

    return data;
  } catch (error) {
    console.error('Shiprocket assign AWB error:', error);
    throw error;
  }
};

const generateInvoice = async (orderIds) => {
  const token = await getShiprocketToken();

  // Ensure orderIds is an array
  const ids = Array.isArray(orderIds) ? orderIds : [orderIds];

  try {
    const response = await fetch(`https://apiv2.shiprocket.in/v1/external/orders/print/invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ ids: ids.map(id => id.toString()) }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Shiprocket generate invoice error:', data);
      throw new Error(data.message || 'Failed to generate invoice');
    }

    return data;
  } catch (error) {
    console.error('Shiprocket generate invoice error:', error);
    throw error;
  }
};

const generateManifest = async (shipmentIds) => {
  const token = await getShiprocketToken();

  try {
    const response = await fetch(`https://apiv2.shiprocket.in/v1/external/manifests/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ shipment_id: shipmentIds.map(id => parseInt(id)) }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Shiprocket generate manifest error:', data);
      throw new Error(data.message || 'Failed to generate manifest');
    }

    return data;
  } catch (error) {
    console.error('Shiprocket generate manifest error:', error);
    throw error;
  }
};

const printManifest = async (orderIds) => {
  const token = await getShiprocketToken();

  try {
    const response = await fetch(`https://apiv2.shiprocket.in/v1/external/manifests/print`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ order_ids: orderIds.map(id => parseInt(id)) }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Shiprocket print manifest error:', data);
      throw new Error(data.message || 'Failed to print manifest');
    }

    return data;
  } catch (error) {
    console.error('Shiprocket print manifest error:', error);
    throw error;
  }
};

const getShipmentTracking = async (shipmentId) => {
  const token = await getShiprocketToken();
  console.log("shipmentId", shipmentId)
  try {
    const response = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/shipment/${shipmentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    console.log("tracking data ", data)
    if (!response.ok) {
      console.error('Shiprocket tracking error:', data);
      throw new Error(data.message || 'Failed to get tracking');
    }

    return data;
  } catch (error) {
    console.error('Shiprocket tracking error:', error);
    throw error;
  }
};

const getShipmentDetails = async (shipmentId) => {
  const token = await getShiprocketToken();

  try {
    const response = await fetch(`https://apiv2.shiprocket.in/v1/external/shipments/${shipmentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Shiprocket shipment details error:', data);
      throw new Error(data.message || 'Failed to get shipment details');
    }

    return data;
  } catch (error) {
    console.error('Shiprocket shipment details error:', error);
    throw error;
  }
};

const schedulePickup = async (shipmentIds, pickupDate = null) => {
  const token = await getShiprocketToken();

  const ids = Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds];

  const payload = { shipment_id: ids.map(id => parseInt(id)) };
  
  if (pickupDate) {
    payload.pickup_date = pickupDate;
  }

  try {
    const response = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/generate/pickup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Shiprocket schedule pickup error:', data);
      throw new Error(data.message || 'Failed to schedule pickup');
    }

    return data;
  } catch (error) {
    console.error('Shiprocket schedule pickup error:', error);
    throw error;
  }
};

const generateRTOLabel = async (shipmentId) => {
  const token = await getShiprocketToken();

  try {
    const response = await fetch(`https://apiv2.shiprocket.in/v1/external/orders/rto/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ shipment_id: parseInt(shipmentId) }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Shiprocket RTO label error:', data);
      throw new Error(data.message || 'Failed to generate RTO label');
    }

    return data;
  } catch (error) {
    console.error('Shiprocket RTO label error:', error);
    throw error;
  }
};

const getPostcodeDetails = async (postcode) => {
  const token = await getShiprocketToken();

  try {
    const response = await fetch(`https://apiv2.shiprocket.in/v1/external/countries/postcode/details?postcode=${postcode}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Shiprocket postcode lookup error:', error);
    return null;
  }
};

const getLocalityDetails = async (postcode) => {
  const token = await getShiprocketToken();

  try {
    const response = await fetch(`https://apiv2.shiprocket.in/v1/external/open/postcode/details?postcode=${postcode}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        postcode_details: {
          postcode: postcode,
          city: '',
          state: ''
        }
      };
    }

    return data;
  } catch (error) {
    console.error('Shiprocket locality details error:', error);
    return {
      success: false,
      postcode_details: {
        postcode: postcode,
        city: '',
        state: ''
      }
    };
  }
};

const addPickupLocation = async (params) => {
  const token = await getShiprocketToken();

  try {
    const response = await fetch('https://apiv2.shiprocket.in/v1/external/settings/company/addpickup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Shiprocket add pickup location error:', error);
    throw error;
  }
};

const getPickupLocations = async () => {
  const token = await getShiprocketToken();

  try {
    const response = await fetch('https://apiv2.shiprocket.in/v1/external/settings/company/pickup', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Shiprocket get pickup locations error:', error);
    throw error;
  }
};

const userVerifyAddress = async (number) => {
  try {
    const response = await fetch('https://apiv2.shiprocket.co/v1/settings/update/shipping-phone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify(
        {
          phone: number,
          module: "1",
          is_web: 1
        }
      ),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Shiprocket user verify address error:', data);
      throw new Error(data.message || 'Failed to verify address');
    }

    return data;
  } catch (error) {
    console.error('Shiprocket user verify address error:', error);
    throw error;
  }
}

const verifyOtp = async (otp, number) => {
  try {
    const response = await fetch('https://apiv2.shiprocket.co/v1/settings/confirm/otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        otp: otp,
        address_id: "",
        module: 1
      }),
    });

    const data = await response.json();
    await afterVerifyOtp(number);
    if (!response.ok) {
      console.error('Shiprocket verify OTP error:', data);
      throw new Error(data.message || 'Failed to verify OTP');
    }

    return data;
  } catch (error) {
    console.error('Shiprocket verify OTP error:', error);
    throw error;
  }
}
const afterVerifyOtp = async (number) => {
  try {
    const response = await fetch('https://apiv2.shiprocket.co/v1/settings/update/shipping-phone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        phone: number,
        module: 1,
        is_web: 1
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Shiprocket verify OTP error:', data);
      throw new Error(data.message || 'Failed to verify OTP');
    }

    return data;
  } catch (error) {
    console.error('Shiprocket verify OTP error:', error);
    throw error;
  }
}
const isNumberVerified = async (number) => {
  const token = await getShiprocketToken();
  try {
    const response = await fetch(
      'https://apiv2.shiprocket.in/v1/external/settings/company/pickup',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    const address = data?.data?.shipping_address?.find(
      (dt) => dt.phone.toString() === number.toString()
    );

    return address?.phone_verified === 1;

  } catch (error) {
    console.error('Shiprocket get pickup locations error:', error);
    throw error;
  }
};

const ensureNumberVerified = async (phoneNumber, otp = null) => {
  const isVerified = await isNumberVerified(phoneNumber);

  if (isVerified) {
    return { verified: true, needsOtp: false };
  }

  if (!otp) {
    await userVerifyAddress(phoneNumber);
    return { verified: false, needsOtp: true, message: 'OTP sent to phone number' };
  }

  await verifyOtp(otp);
  const nowVerified = await isNumberVerified(phoneNumber);

  if (nowVerified) {
    return { verified: true, needsOtp: false, message: 'Phone number verified successfully' };
  }

  throw new Error('Phone number verification failed. Please try again.');
};

const createOrderWithVerification = async (orderData, otp = null) => {
  const phoneNumber = orderData.billing_phone;

  const verificationResult = await ensureNumberVerified(phoneNumber, otp);

  if (!verificationResult.verified) {
    return {
      success: false,
      needsVerification: true,
      needsOtp: verificationResult.needsOtp,
      message: verificationResult.message
    };
  }

  const order = await createQuickOrder(orderData);
  return {
    success: true,
    needsVerification: false,
    order
  };
};

module.exports = {
  getShiprocketToken,
  getServiceability,
  getPostcodeDetails,
  getLocalityDetails,
  addPickupLocation,
  getPickupLocations,
  createShipment,
  createQuickOrder,
  cancelShipment,
  assignAWB,
  generateLabel,
  generateInvoice,
  generateManifest,
  printManifest,
  getShipmentTracking,
  getShipmentDetails,
  schedulePickup,
  generateRTOLabel,
  userVerifyAddress,
  verifyOtp,
  isNumberVerified,
  ensureNumberVerified,
  createOrderWithVerification
};
