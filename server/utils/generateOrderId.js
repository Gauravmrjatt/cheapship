const crypto = require("crypto");

module.exports.generateOrderId = function generateOrderId() {
  const prefix = "777";

  // last 6 digits of timestamp
  const timestamp = Date.now().toString().slice(-6);

  // random 3 digits
  const random = crypto.randomInt(100, 999).toString();

  const idStr = timestamp + random;

  return BigInt(idStr);
};