const rideRepository = require('../repositories/rideRepository');
const routeRepository = require('../repositories/routeRepository');
const routeMatchingService = require('../services/routeMatchingService');
const notificationService = require('../services/notificationService');
const { NotFoundError, ConflictError } = require('../errors/AppErrors');

class RideController {
  async searchRoutes(req, res, next) {
    try {
      const results = await routeMatchingService.searchRoutes(req.body);
      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }

  async requestRide(req, res, next) {
    try {
      const route = await routeRepository.findById(req.body.routeId);
      if (!route) throw new NotFoundError('Route not found');
      if (route.available_seats < req.body.passengerCount) {
        throw new ConflictError('Not enough available seats');
      }

      const existing = await rideRepository.findByRouteAndPassenger(req.body.routeId, req.user.userId);
      if (existing) throw new ConflictError('You already have a pending or accepted request for this route');

      const estimatedCost = route.cost_per_passenger * req.body.passengerCount;
      const requestId = await rideRepository.create({
        routeId: req.body.routeId,
        passengerId: req.user.userId,
        pickupLatitude: req.body.pickupLatitude,
        pickupLongitude: req.body.pickupLongitude,
        pickupAddress: req.body.pickupAddress,
        passengerCount: req.body.passengerCount,
        estimatedCost
      });

      await notificationService.sendRideRequestNotification(route.driver_id, { requestId });

      res.status(201).json({
        success: true,
        data: { requestId, estimatedCost }
      });
    } catch (error) {
      next(error);
    }
  }

  async acceptRide(req, res, next) {
    try {
      const request = await rideRepository.findById(req.body.requestId);
      if (!request) throw new NotFoundError('Ride request not found');

      const route = await routeRepository.findById(request.route_id);
      if (route.driver_id !== req.user.userId) {
        throw new ConflictError('You are not the driver of this route');
      }

      if (req.body.action === 'accept') {
        if (route.available_seats < request.passenger_count) {
          throw new ConflictError('Not enough available seats');
        }

        await rideRepository.updateStatus(req.body.requestId, 'accepted');
        await routeRepository.updateAvailableSeats(
          request.route_id,
          route.available_seats - request.passenger_count
        );

        await notificationService.sendRideAcceptedNotification(request.passenger_id, {
          requestId: req.body.requestId
        });

        res.json({ success: true, data: { message: 'Ride request accepted' } });
      } else {
        await rideRepository.updateStatus(req.body.requestId, 'rejected');
        await notificationService.sendRideRejectedNotification(
          request.passenger_id,
          req.body.reason || 'No reason provided'
        );

        res.json({ success: true, data: { message: 'Ride request rejected' } });
      }
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;
      const history = await rideRepository.findHistoryByUser(req.user.userId, limit, offset);
      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RideController();
