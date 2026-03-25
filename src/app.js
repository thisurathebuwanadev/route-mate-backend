const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config/env');
const { logger, morganMiddleware, requestLogger, errorLogger } = require('./middleware/loggingMiddleware');
const { rateLimitMiddleware, authRateLimitMiddleware, adminRateLimitMiddleware } = require('./middleware/rateLimitMiddleware');
const { networkSecurityMiddleware, suspiciousActivityMiddleware, connectionMonitoringMiddleware } = require('./middleware/networkSecurityMiddleware');
const { RouteMateError } = require('./errors/AppErrors');
const initializeSocket = require('./socket/socketHandler');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const driverRoutes = require('./routes/driver.routes');
const rideRoutes = require('./routes/ride.routes');
const routeRoutes = require('./routes/route.routes');
const tripRoutes = require('./routes/trip.routes');
const verificationRoutes = require('./routes/verification.routes');
const carbonRoutes = require('./routes/carbon.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.security.allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  allowEIO3: true
});

// Security middleware (order matters!)
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({ 
  origin: config.security.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Network security layers
app.use(networkSecurityMiddleware);
app.use(suspiciousActivityMiddleware);
app.use(connectionMonitoringMiddleware);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morganMiddleware);
app.use(requestLogger);
app.use(rateLimitMiddleware);

// Apply auth rate limiting to auth routes
app.use('/auth', authRateLimitMiddleware, authRoutes);
app.use('/users', userRoutes);
app.use('/drivers', driverRoutes);
app.use('/rides', rideRoutes);
app.use('/routes', routeRoutes);
app.use('/trips', tripRoutes);
app.use('/verification', verificationRoutes);
app.use('/carbon', carbonRoutes);
// Apply admin rate limiting to admin routes
app.use('/admin', adminRateLimitMiddleware, adminRoutes);

app.get('/health', (req, res) => {
  const clientIp = req.clientIp || req.ip;
  res.json({ 
    success: true, 
    data: { 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      server: {
        host: config.host,
        port: config.port,
        environment: config.nodeEnv
      },
      client: {
        ip: clientIp,
        isPrivateNetwork: require('./middleware/networkSecurityMiddleware').isPrivateNetwork(clientIp)
      },
      security: {
        networkRestriction: config.security.enableNetworkRestriction,
        ipWhitelist: config.security.enableIpWhitelist,
        rateLimiting: true
      }
    } 
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: 'Route not found', code: 'NOT_FOUND' }
  });
});

app.use(errorLogger);

app.use((err, req, res, next) => {
  logger.error(err);

  if (err instanceof RouteMateError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.errorCode
      }
    });
  }

  const statusCode = err.statusCode || 500;
  const message = config.nodeEnv === 'production' ? 'Internal server error' : err.message;

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: 'INTERNAL_ERROR'
    }
  });
});

initializeSocket(io);

// Start server with network configuration
server.listen(config.port, config.host, () => {
  logger.info(`RouteMate server started successfully`, {
    port: config.port,
    host: config.host,
    environment: config.nodeEnv,
    networkSecurity: {
      enableNetworkRestriction: config.security.enableNetworkRestriction,
      enableIpWhitelist: config.security.enableIpWhitelist,
      trustedNetworks: config.security.trustedNetworks,
      maxRequestsPerMinute: config.security.maxRequestsPerMinute
    },
    timestamp: new Date().toISOString()
  });
  
  // Log network interface information
  const networkInterfaces = require('os').networkInterfaces();
  const addresses = [];
  
  Object.keys(networkInterfaces).forEach(interfaceName => {
    networkInterfaces[interfaceName].forEach(interface => {
      if (interface.family === 'IPv4' && !interface.internal) {
        addresses.push(`${interfaceName}: ${interface.address}`);
      }
    });
  });
  
  logger.info('Server network interfaces', {
    interfaces: addresses,
    bindAddress: config.host,
    port: config.port
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

module.exports = app;
