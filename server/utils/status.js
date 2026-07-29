const DISPLAY_MAP = {
  'DELIVERED': 'Delivered',
  'CANCELLED': 'Cancelled',
  'IN_TRANSIT': 'In Transit',
  'MANIFESTED': 'Manifested',
  'OUT_FOR_DELIVERY': 'Out For Delivery',
  'OUT_FOR_PICKUP': 'Out For Pickup',
  'PICKED_UP': 'Picked Up',
  'DISPATCHED': 'Dispatched',
  'PROCESSING': 'Pending',
  'PENDING': 'Pending',
  'RTO': 'RTO In Transit',
  'RTO_DELIVERED': 'RTO Delivered',
  'NOT_PICKED': 'Not Picked',
};

function toDisplay(status) {
  if (!status) return 'Pending';
  return DISPLAY_MAP[status] || status;
}

module.exports = { toDisplay };
