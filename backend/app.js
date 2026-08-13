require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const apiRoutes = require('./routes/api');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { configureSocket } = require('./socket/socketHandler');

const buildApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(',').map((origin) => origin.trim())
        : true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: Number(process.env.RATE_LIMIT_MAX || 200),
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Backend is healthy',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api', apiRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

const createServer = () => {
  const app = buildApp();
  const server = http.createServer(app);
  const io = configureSocket(server);
  return { app, server, io };
};

module.exports = {
  buildApp,
  createServer,
};
