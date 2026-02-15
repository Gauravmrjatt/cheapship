const express = require("express")
const route = express.Router();
const userRoute = require("./users.route");
const authRoute = require("./auth.route");
const addressRoute = require("./address.route");

route.use('/users/', userRoute);
const orderRoute = require("./order.route");

route.use('/auth', authRoute);
route.use('/addresses', addressRoute);
route.use('/orders', orderRoute);
const dashboardRoute = require("./dashboard.route");
route.use('/dashboard', dashboardRoute);
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