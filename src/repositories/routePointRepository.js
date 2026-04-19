const db = require('../config/database');

class RoutePointRepository {
  async create(data) {
    const [result] = await db.execute(
      'INSERT INTO route_points (driver_id, route_id, session_id, latitude, longitude, recorded_at) VALUES (?, ?, ?, ?, ?, ?)',
      [data.driverId, data.routeId, data.sessionId, data.lat, data.lng, data.datetime]
    );
    return result.insertId;
  }

  async findByRouteId(routeId) {
    const [rows] = await db.execute(
      'SELECT latitude, longitude FROM route_points WHERE route_id = ? ORDER BY recorded_at ASC',
      [routeId]
    );
    return rows;
  }
}

module.exports = new RoutePointRepository();
