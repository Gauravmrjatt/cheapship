require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const app = express();
const prisma = require('./utils/prisma');

// Make Prisma client available throughout the application
app.locals.prisma = prisma;

// Database Connection Check
async function checkDbConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    // process.exit(1); // Optional: Exit if DB connection fails
  }
}

checkDbConnection();

// Secure HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors());

// Logging
app.use(logger('dev'));
console.log("CHEAPSHIP SERVER INITIALIZING WITH FRANCHISE ROUTES");

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

app.use('/api/v1', require("./routes/v1.route"));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/* ==============================
   Health Check Route
============================== */

app.get('/health', async (req, res) => {
  let dbStatus = 'UP';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    dbStatus = 'DOWN';
  }

  res.status(dbStatus === 'UP' ? 200 : 503).json({
    status: dbStatus === 'UP' ? 'OK' : 'DEGRADED',
    database: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

/* ==============================
   404 Handler
============================== */

app.use((req, res, next) => {
  next(createError(404, "Route Not Found"));
});

/* ==============================
   Global Error Handler
============================== */

app.use((err, req, res, next) => {
  const isDev = req.app.get('env') === 'development';

  console.error(err.stack);

  res.status(err.status || 500);

  // If API request → return JSON
  if (req.originalUrl.startsWith('/api')) {
    return res.json({
      success: false,
      message: err.message,
      ...(isDev && { stack: err.stack })
    });
  }

  // Otherwise render error page
  res.render('error', {
    message: err.message,
    error: isDev ? err : {}
  });
});

module.exports = app;
