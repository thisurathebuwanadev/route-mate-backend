const routeRepository = require('../repositories/routeRepository');
const rideRepository = require('../repositories/rideRepository');
const routePointRepository = require('../repositories/routePointRepository');
const costCalculatorService = require('../services/costCalculatorService');
const routeMatchingService = require('../services/routeMatchingService');
const { NotFoundError } = require('../errors/AppErrors');

class DriverController {
  async createRoute(req, res, next) {
    try {
      const vehicle = await rideRepository.findVehicleById(req.body.vehicleId);
      if (!vehicle) throw new NotFoundError('Vehicle not found');
      if (vehicle.user_id !== req.user.userId) throw new NotFoundError('Vehicle not owned by user');

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
        vehicleId: vehicle.vehicle_id,
        startLatitude: req.body.startLatitude,
        startLongitude: req.body.startLongitude,
        endLatitude: req.body.endLatitude,
        endLongitude: req.body.endLongitude,
        startAddress: req.body.startAddress || null,
        endAddress: req.body.endAddress || null,
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

  async markLocation(req, res, next) {
    try {
      const id = await routePointRepository.create({
        driverId: req.user.userId,
        routeId: req.body.routeId,
        sessionId: req.body.sessionId,
        lat: req.body.lat,
        lng: req.body.lng,
        datetime: req.body.datetime
      });
      res.status(201).json({ success: true, data: { locationId: id } });
    } catch (error) {
      next(error);
    }
  }

  async getRoutes(req, res, next) {
    try {
      const routes = await routeRepository.findActiveByDriver(req.user.userId);
      // console.log("routes : ", routes)
      res.json({ success: true, data: routes });
    } catch (error) {
      next(error);
    }
  }

  async addVehicle(req, res, next) {
    try {
      const vehicleId = await rideRepository.createVehicle({
        userId: req.user.userId,
        vehicleType: req.body.vehicle_type,
        make: req.body.make,
        model: req.body.model,
        licensePlate: req.body.license_plate,
        capacity: req.body.capacity,
        fuelEfficiency: req.body.fuel_efficiency
      });
      res.status(201).json({ success: true, data: { vehicleId } });
    } catch (error) {
      next(error);
    }
  }

  async getVehicles(req, res, next) {
    try {
      const vehicles = await rideRepository.findVehiclesByUser(req.user.userId);
      res.json({ success: true, data: vehicles });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DriverController();
