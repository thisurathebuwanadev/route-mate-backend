const routeRepository = require('../repositories/routeRepository');
const routePointRepository = require('../repositories/routePointRepository');
const redis = require('../config/redis');
const crypto = require('crypto');
const { haversineDistance, scoreRoute } = require('../utils/routeScoring');

class RouteMatchingService {
  async searchRoutes({ startLatitude, startLongitude, endLatitude, endLongitude, departureTime, passengerCount }) {
    const cacheKey = this.generateCacheKey({ startLatitude, startLongitude, endLatitude, endLongitude, departureTime, passengerCount });
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const candidates = await routeRepository.searchActiveRoutes(departureTime, passengerCount);
    const matches = [];
    const passenger = { startLat: startLatitude, startLng: startLongitude, endLat: endLatitude, endLng: endLongitude };

    for (const route of candidates) {
      const routePoints = await routePointRepository.findByRouteId(route.route_id);
      const score = scoreRoute(passenger, route, routePoints);
      if (!score) continue;

      matches.push({
        routeId: route.route_id,
        driverId: route.driver_id,
        driverName: `${route.first_name} ${route.last_name}`,
        vehicleType: route.vehicle_type,
        startAddress: route.start_address,
        endAddress: route.end_address,
        departureTime: route.departure_time,
        availableSeats: route.available_seats,
        costPerPassenger: route.cost_per_passenger,
        trustScore: route.trust_score,
        ...score
      });
    }

    matches.sort((a, b) => b.compositeScore - a.compositeScore);
    const results = matches.slice(0, 10);

    await redis.setex(cacheKey, 120, JSON.stringify(results));
    return results;
  }

  haversineDistance(lat1, lon1, lat2, lon2) {
    return haversineDistance(lat1, lon1, lat2, lon2);
  }

  generateCacheKey(params) {
    const str = JSON.stringify(params);
    return `search:${crypto.createHash('md5').update(str).digest('hex')}`;
  }
}

module.exports = new RouteMatchingService();
