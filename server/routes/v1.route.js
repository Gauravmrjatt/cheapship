const express = require("express")
const route = express.Router();
const userRoute = require("./users.route");
const authRoute = require("./auth.route");
const addressRoute = require("./address.route");
const franchiseRoute = require("./franchise.route");
const orderRoute = require("./order.route");
const dashboardRoute = require("./dashboard.route");
const transactionRoute = require("./transaction.route");
const adminRoute = require("./admin.route");

route.use('/users', userRoute);
route.use('/auth', authRoute);
route.use('/addresses', addressRoute);
route.use('/orders', orderRoute);
route.use('/franchise', franchiseRoute);
route.use('/dashboard', dashboardRoute);
route.use('/transactions', transactionRoute);
route.use('/admin', adminRoute);

route.get('/test-db', async (req, res) => {
  try {
    const prisma = req.app.locals.prisma;
    const result = await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      message: "Database connection successful!",
      result: result
    });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({
      success: false,
      message: "Database connection failed.",
      error: error.message
    });
  }
});

module.exports = route;