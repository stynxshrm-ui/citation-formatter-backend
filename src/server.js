const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes and middleware
const healthRoutes = require('./routes/healthRoutes');
const lookupRoutes = require('./routes/lookupRoutes');
const formatRoutes = require('./routes/formatRoutes');
const { performanceMiddleware, getMetrics } = require('./middleware/performance');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { logger } = require('./utils/logger');

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3001', // Development
    'https://citation-formatter-frontend.vercel.app', // Production
    process.env.CORS_ORIGIN // Additional domains from environment
  ].filter(Boolean), // Remove any undefined values
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Performance monitoring
app.use(performanceMiddleware);

// Routes
app.use('/', healthRoutes);
app.use('/api', lookupRoutes);
app.use('/api', formatRoutes);

// Performance metrics endpoint
app.get('/metrics', (req, res) => {
  res.json(getMetrics());
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Export both app and server for testing
module.exports = { app, server };
