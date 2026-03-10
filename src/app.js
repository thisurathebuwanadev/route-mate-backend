const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config/env');
const { logger, morganMiddleware } = require('./middleware/loggingMiddleware');
const rateLimitMiddleware = require('./middleware/rateLimitMiddleware');
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

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.allowedOrigins,
    methods: ['GET', 'POST']
  }
});

app.use(helmet());
app.use(cors({ origin: config.allowedOrigins }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morganMiddleware);
app.use(rateLimitMiddleware);

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/drivers', driverRoutes);
app.use('/rides', rideRoutes);
app.use('/routes', routeRoutes);
app.use('/trips', tripRoutes);
app.use('/verification', verificationRoutes);
app.use('/carbon', carbonRoutes);

app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'healthy' } });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: 'Route not found', code: 'NOT_FOUND' }
  });
});

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

server.listen(config.port, () => {
  logger.info(`RouteMate server running on port ${config.port}`);
});

module.exports = app;
