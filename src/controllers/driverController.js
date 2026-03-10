const routeRepository = require('../repositories/routeRepository');
const rideRepository = require('../repositories/rideRepository');
const costCalculatorService = require('../services/costCalculatorService');
const routeMatchingService = require('../services/routeMatchingService');
const { NotFoundError } = require('../errors/AppErrors');

class DriverController {
  async goOnline(req, res, next) {
    try {
      const vehicle = await rideRepository.findVehicleByUser(req.user.userId);
      if (!vehicle) throw new NotFoundError('No active vehicle found');

      const { startLatitude, startLongitude, endLatitude, endLongitude } = req.body;
      const distance = routeMatchingService.haversineDistance(
        startLatitude, startLongitude, endLatitude, endLongitude
      );

      const fare = costCalculatorService.calculateFare({
        vehicleType: vehicle.vehicle_type,
        distanceKm: distance,
        passengerCount: req.body.availableSeats,
        fuelEfficiency: vehicle.fuel_efficiency
      });

      const routeId = await routeRepository.create({
        driverId: req.user.userId,
        vehicleId: req.body.vehicleId,
        startLatitude: req.body.startLatitude,
        startLongitude: req.body.startLongitude,
        endLatitude: req.body.endLatitude,
        endLongitude: req.body.endLongitude,
        startAddress: req.body.startAddress,
        endAddress: req.body.endAddress,
        estimatedDistance: distance,
        estimatedDuration: Math.round(distance * 2),
        departureTime: req.body.departureTime,
        availableSeats: req.body.availableSeats,
        costPerPassenger: fare.costPerPassenger
      });

      res.status(201).json({
        success: true,
        data: {
          routeId,
          estimatedDistance: parseFloat(distance.toFixed(2)),
          costPerPassenger: fare.costPerPassenger,
          totalCost: fare.totalCost
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getRoutes(req, res, next) {
    try {
      const routes = await routeRepository.findActiveByDriver(req.user.userId);
      res.json({ success: true, data: routes });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DriverController();
