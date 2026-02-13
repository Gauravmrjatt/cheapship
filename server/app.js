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

// Secure HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors());

// Logging
app.use(logger('dev'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/api/v1', require("./routes/v1.route"));

/* ==============================
   Health Check Route
============================== */

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: Date.now()
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
