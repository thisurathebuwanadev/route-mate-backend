const routeRepository = require('../repositories/routeRepository');
const rideRepository = require('../repositories/rideRepository');
const carbonService = require('../services/carbonService');
const redis = require('../config/redis');
const { NotFoundError } = require('../errors/AppErrors');

class TripController {
  async startTrip(req, res, next) {
    try {
      const route = await routeRepository.findById(req.body.routeId);
      if (!route) throw new NotFoundError('Route not found');
      if (route.driver_id !== req.user.userId) {
        throw new NotFoundError('You are not the driver of this route');
      }

      res.json({ success: true, data: { message: 'Trip started', routeId: req.body.routeId } });
    } catch (error) {
      next(error);
    }
  }

  async endTrip(req, res, next) {
    try {
      const route = await routeRepository.findById(req.body.routeId);
      if (!route) throw new NotFoundError('Route not found');
      if (route.driver_id !== req.user.userId) {
        throw new NotFoundError('You are not the driver of this route');
      }

      await routeRepository.updateStatus(req.body.routeId, 'completed');
      await redis.del(`gps:${req.body.routeId}`);

      res.json({ success: true, data: { message: 'Trip completed' } });
    } catch (error) {
      next(error);
    }
  }

  async updateGPS(req, res, next) {
    try {
      const route = await routeRepository.findById(req.body.routeId);
      if (!route) throw new NotFoundError('Route not found');
      if (route.driver_id !== req.user.userId) {
        throw new NotFoundError('You are not the driver of this route');
      }

      const gpsData = {
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        timestamp: new Date().toISOString()
      };

      await redis.setex(`gps:${req.body.routeId}`, 300, JSON.stringify(gpsData));
      res.json({ success: true, data: { message: 'GPS updated' } });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TripController();
