const db = require('../config/database');

class RoutePointRepository {
  async create(data) {
    const [result] = await db.execute(
      'INSERT INTO route_points (driver_id, route_id, session_id, latitude, longitude, recorded_at) VALUES (?, ?, ?, ?, ?, ?)',
      [data.driverId, data.routeId, data.sessionId, data.lat, data.lng, data.datetime]
    );
    return result.insertId;
  }
}

module.exports = new RoutePointRepository();
