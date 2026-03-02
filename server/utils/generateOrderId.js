const crypto = require('crypto');

module.exports.generateOrderId = function generateOrderId() {
  // ORD → 3 digit numeric prefix
  const prefix = "777"; // ORD replacement (numeric only)

  // timestamp (13 digits)
  const timestamp = Date.now().toString();

  // uuid fragment → numeric 3 digits
  const random = crypto.randomInt(100, 999).toString();

  // combine
  const idStr = prefix + timestamp + random;

  // convert safely to BigInt
  return BigInt(idStr);
}