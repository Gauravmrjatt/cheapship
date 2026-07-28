const fetch = require('node-fetch');

const VYOM_API_BASE_URL = (process.env.VYOM_API_URL || 'https://apidev.vyomxpress.com').replace(/\/+$/, '');
const VYOM_API_KEY = process.env.VYOM_API_KEY;

const API_PREFIX = '/v1/vyxv';

const isConfigured = () => !!VYOM_API_KEY;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'x-api-key': VYOM_API_KEY,
});

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  if (contentType.includes('application/pdf')) {
    return response.buffer();
  }
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { data: text };
  }
};

const apiRequest = async (method, path, options = {}) => {
  if (!isConfigured()) {
    console.warn('[Vyom] API key not configured — skipping request');
    return null;
  }

  const { query, body } = options;
  const url = new URL(`${API_PREFIX}${path}`, VYOM_API_BASE_URL);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const fetchOptions = {
    method,
    headers: getHeaders(),
  };

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url.toString(), fetchOptions);
    if (!response.ok) {
      const errorBody = await handleResponse(response);
      const message = errorBody?.message || `Vyom API error: ${response.status}`;
      console.error(`[Vyom] ${method} ${path} failed (${response.status}):`, message);
      return { error: true, status: response.status, message, ...errorBody };
    }
    
    return await handleResponse(response);
  } catch (error) {
    console.error(`[Vyom] Network error ${method} ${path}:`, error.message);
    return { error: true, status: 0, message: error.message };
  }
};

const getFare = async (params) => {
  return apiRequest('GET', '/shipment/fare', { query: params });
};

const createShipment = async (data) => {
  return apiRequest('POST', '/shipment/create', { body: data });
};

const cancelShipment = async (orderId, reason) => {
  const url = `${VYOM_API_BASE_URL}${API_PREFIX}/shipment/cancel/${orderId}`;
  const u = new URL(url);
  const httpModule = u.protocol === 'https:' ? require('https') : require('http');
  const bodyStr = JSON.stringify({ cancellationReason: reason });
  return new Promise((resolve) => {
    const options = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        'x-api-key': VYOM_API_KEY,
      },
    };
    const req = httpModule.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', (error) => {
      console.error(`[Vyom] Cancel network error ${orderId}:`, error.message);
      resolve({ error: true, message: error.message });
    });
    req.write(bodyStr);
    req.end();
  });
};

const getOrderByTracking = async (trackingId) => {
  return apiRequest('GET', '/shipment', { query: { trackingId } });
};

const listOrders = async (filters = {}) => {
  return apiRequest('GET', '/shipment/list', { query: filters });
};

const getPackingSlip = async (orderId) => {
  return apiRequest('GET', `/shipment/slip/${orderId}`);
};

const getBulkPackingSlip = async (orderIds, bulkOrderId) => {
  return apiRequest('GET', '/shipment/slip/Bulk', {
    query: {
      orderIds: Array.isArray(orderIds) ? orderIds.join(',') : orderIds,
      bulkOrderId,
    },
  });
};

const listWarehouses = async () => {
  return apiRequest('GET', '/warehouse');
};

const createWarehouse = async (data) => {
  return apiRequest('POST', '/warehouse', { body: data });
};

const updateWarehouse = async (id, data) => {
  return apiRequest('PATCH', `/warehouse/${id}`, { body: data });
};

const deleteWarehouse = async (id) => {
  return apiRequest('DELETE', `/warehouse/${id}`);
};

const restoreWarehouse = async (id) => {
  return apiRequest('POST', `/warehouse/restore/${id}`);
};

const mapVyomStatus = (statusText) => {
  if (!statusText) return 'PROCESSING';
  const s = statusText.toString().toLowerCase().trim();

  const statusMap = {
    'pending': 'PROCESSING',
    'processing': 'PROCESSING',
    'manifested': 'MANIFESTED',
    'pickup scheduled': 'MANIFESTED',
    'out for pickup': 'OUT_FOR_PICKUP',
    'pickup done': 'PICKED_UP',
    'picked up': 'PICKED_UP',
    'in transit': 'IN_TRANSIT',
    'shipped': 'IN_TRANSIT',
    'received at hub': 'IN_TRANSIT',
    'out for delivery': 'OUT_FOR_DELIVERY',
    'dispatched': 'DISPATCHED',
    'delivered': 'DELIVERED',
    'cancelled': 'CANCELLED',
    'canceled': 'CANCELLED',
    'rto': 'RTO',
    'rto delivered': 'RTO_DELIVERED',
    'rto_delivered': 'RTO_DELIVERED',
    'return to origin': 'RTO',
    'rto dispatched': 'RTO',
    'lost': 'CANCELLED',
    'damaged': 'CANCELLED',
    'not picked': 'NOT_PICKED',
  };

  return statusMap[s] || 'IN_TRANSIT';
};

const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

function getValue(obj, ...keys) {
  for (const key of keys) {
    const val = obj[key];
    if (val !== undefined && val !== null) return val;
  }
  return undefined;
}

const normalizeVyomFares = (vyomFares) => {
  if (!vyomFares || !Array.isArray(vyomFares)) return [];
  return vyomFares.map((fare) => {
    const companyName = getValue(fare, 'company_name', 'companyName') || '';
    const serviceName = getValue(fare, 'name', 'service_name', 'serviceName') || '';
    const rawTotalFare = parseFloat(getValue(fare, 'total_fare', 'totalFare', 'total_fare_with_cod'));
    const rawBaseFare = parseFloat(getValue(fare, 'base_fare', 'baseFare'));
    const gstFare = parseFloat(getValue(fare, 'gst_fare', 'gstFare', 'gst')) || 0;
    const codSurcharge = parseFloat(getValue(fare, 'cod_surcharge', 'cod_charges', 'cod_charge', 'codCharges')) || 0;
    const fuelSurcharge = parseFloat(getValue(fare, 'fuel_surcharge', 'fuelSurcharge')) || 0;
    const handlingFee = parseFloat(getValue(fare, 'handling_fee', 'handlingFee')) || 0;
    const chargedWeight = getValue(fare, 'charged_weight', 'chargedWeight', 'chargedweight');
    const tat = getValue(fare, 'tat', 'estimated_delivery_days', 'estimatedDeliveryDays');
    const serviceId = getValue(fare, 'service_id', 'serviceId');
    const icon = getValue(fare, 'icon', 'logo_url', 'logoUrl');
    const baseFare = rawBaseFare || 0;
    const totalFare = rawTotalFare || (baseFare + gstFare + codSurcharge + fuelSurcharge + handlingFee) || baseFare;

    const isExpress = (serviceName || '').toLowerCase().includes('express');
    const name = companyName && !serviceName.includes(companyName)
      ? `${companyName} ${serviceName}`.trim()
      : serviceName || 'Vyom Express';
    const nameHash = (hashString(serviceName || name || 'vyom') % 999) + 1;
    return {
      courier_name: name,
      courier_company_id: -(serviceId * 1000 + nameHash),
      courier_logo_url: icon || '',
      rate: totalFare,
      base_rate: baseFare,
      gst: gstFare,
      cod_surcharge: codSurcharge,
      fuel_surcharge: fuelSurcharge,
      handling_fee: handlingFee,
      etd: tat ? new Date(Date.now() + tat * 86400000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : null,
      estimated_delivery_days: String(tat || ''),
      charge_weight: chargedWeight ? chargedWeight / 1000 : null,
      rating: 4.0,
      is_surface: !isExpress,
      mode: isExpress ? 1 : 0,
      is_vyom: true,
    };
  });
};

module.exports = {
  isConfigured,
  normalizeVyomFares,
  getFare,
  createShipment,
  cancelShipment,
  getOrderByTracking,
  listOrders,
  getPackingSlip,
  getBulkPackingSlip,
  listWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  restoreWarehouse,
  mapVyomStatus,
};
