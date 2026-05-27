require('dotenv').config();

const Sentry = require('@sentry/node');
const sentryDsn = process.env.SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'development',
  });
  Sentry.addIntegration(Sentry.expressIntegration());
  console.log('✅ Sentry initialized with DSN:', sentryDsn.substring(0, 30) + '...');
} else {
  console.warn('⚠️ SENTRY_DSN not set - Sentry disabled');
}

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const app = express();
const prisma = require('./utils/prisma');
// this is a text file
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

// Initialize cron jobs
const { initializeCronJobs } = require('./cron/security-refund.cron');
initializeCronJobs(prisma);

// Secure HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors());

// Logging
app.use(logger('dev'));

// Body parsing
app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf.toString(); }
}));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
app.all('/', (req, res) => {
  res.send("hi")
});
app.use('/api/v1', require("./routes/v1.route"));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/error', (req, res) => {
  throw new Error('Test Error');
});
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
   Sentry Error Handler
 ============================== */

app.use(Sentry.expressErrorHandler());

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
  res.json({
    message: err.message,
    error: isDev ? err : {}
  });
});

module.exports = app;
