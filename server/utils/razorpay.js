const Razorpay = require('razorpay');

console.log('Initializing Razorpay with Key ID:', process.env.RAZORPAY_KEY_ID ? 'LOADED' : 'MISSING');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_key_secret',
});

module.exports = razorpay;
