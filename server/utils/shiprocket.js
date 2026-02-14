const map =  new Map();
const getShiprocketToken = async () => {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

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

    if (!response.ok) {
      throw new Error(data.message || 'Failed to login to Shiprocket');
    }
    map.set('token', data.token);
    return data.token;

  } catch (error) {
    console.error('Shiprocket login error:', error);
    throw error;
  }
};

const getServiceability = async (params) => {
  const token = map.get('token') || await getShiprocketToken(); 
  const queryParams = new URLSearchParams(params).toString();
  
  try {
    const response = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/serviceability/?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
        // Some errors might be 404 if not serviceable, but we want to return the data
        return data;
    }

    return data;
  } catch (error) {
    console.error('Shiprocket serviceability error:', error);
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

module.exports = {
  getShiprocketToken,
  getServiceability,
  getPostcodeDetails,
};
