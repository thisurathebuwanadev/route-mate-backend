const jwt = require('jsonwebtoken');
const config = require('../config/env');
const redis = require('../config/redis');

const initializeSocket = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.substring(7);
      if (!token) return next(new Error('Authentication error'));
      
      const decoded = jwt.verify(token, config.jwt.secret);
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);

    socket.on('trip:join', async ({ routeId }) => {
      socket.join(`route:${routeId}`);
      const gpsData = await redis.get(`gps:${routeId}`);
      if (gpsData) {
        socket.emit('driver:location', JSON.parse(gpsData));
      }
    });

    socket.on('driver:location', async ({ routeId, latitude, longitude }) => {
      const locationData = {
        latitude,
        longitude,
        timestamp: new Date().toISOString()
      };
      
      await redis.setex(`gps:${routeId}`, 300, JSON.stringify(locationData));
      io.to(`route:${routeId}`).emit('driver:location', locationData);
    });

    socket.on('ride:accepted', ({ routeId, requestId, estimatedPickupTime }) => {
      io.to(`route:${routeId}`).emit('ride:accepted', {
        requestId,
        estimatedPickupTime
      });
    });

    socket.on('ride:rejected', ({ routeId, requestId, reason }) => {
      io.to(`route:${routeId}`).emit('ride:rejected', {
        requestId,
        reason
      });
    });

    socket.on('trip:started', ({ routeId }) => {
      io.to(`route:${routeId}`).emit('trip:started', { routeId });
    });

    socket.on('trip:ended', ({ routeId, carbonSaved }) => {
      io.to(`route:${routeId}`).emit('trip:ended', { routeId, carbonSaved });
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });
};

module.exports = initializeSocket;
