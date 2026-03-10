const routeRepository = require('../repositories/routeRepository');
const redis = require('../config/redis');
const crypto = require('crypto');

class RouteMatchingService {
  async searchRoutes({ startLatitude, startLongitude, endLatitude, endLongitude, departureTime, passengerCount }) {
    const cacheKey = this.generateCacheKey({ startLatitude, startLongitude, endLatitude, endLongitude, departureTime, passengerCount });
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const candidates = await routeRepository.searchActiveRoutes(departureTime, passengerCount);
    const matches = [];

    for (const route of candidates) {
      const startDist = this.haversineDistance(startLatitude, startLongitude, route.start_latitude, route.start_longitude);
      const endDist = this.haversineDistance(endLatitude, endLongitude, route.end_latitude, route.end_longitude);
      
      const MAX_KM = 5;
      const startScore = Math.max(0, 1 - startDist / MAX_KM);
      const endScore = Math.max(0, 1 - endDist / MAX_KM);
      const compatibilityScore = (startScore + endScore) / 2;

      if (compatibilityScore < 0.3) continue;

      const pickupDist = this.haversineDistance(startLatitude, startLongitude, route.start_latitude, route.start_longitude);
      const proximityScore = Math.max(0, 1 - pickupDist / 5);
      const trustScore = route.trust_score || 0;

      const compositeScore = (compatibilityScore * 0.4) + (trustScore / 5 * 0.3) + (proximityScore * 0.3);

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
        compatibilityScore: parseFloat(compatibilityScore.toFixed(2)),
        compositeScore: parseFloat(compositeScore.toFixed(2)),
        distanceFromPickup: parseFloat(pickupDist.toFixed(2))
      });
    }

    matches.sort((a, b) => b.compositeScore - a.compositeScore);
    const results = matches.slice(0, 10);

    await redis.setex(cacheKey, 120, JSON.stringify(results));
    return results;
  }

  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  generateCacheKey(params) {
    const str = JSON.stringify(params);
    return `search:${crypto.createHash('md5').update(str).digest('hex')}`;
  }
}

module.exports = new RouteMatchingService();
