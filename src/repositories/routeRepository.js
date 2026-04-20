const db = require('../config/database');

class RouteRepository {
  async create(routeData) {
    const [result] = await db.execute(
      `INSERT INTO routes (driver_id, vehicle_id, start_latitude, start_longitude, end_latitude, end_longitude, 
       start_address, end_address, estimated_distance, estimated_duration, departure_time, days, available_seats, cost_per_passenger) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        routeData.driverId, routeData.vehicleId, routeData.startLatitude, routeData.startLongitude,
        routeData.endLatitude, routeData.endLongitude, routeData.startAddress, routeData.endAddress,
        routeData.estimatedDistance, routeData.estimatedDuration, routeData.departureTime,
        routeData.days, routeData.availableSeats, routeData.costPerPassenger
      ]
    );
    return result.insertId;
  }

  async findById(routeId) {
    const [rows] = await db.execute(
      `SELECT r.*, v.vehicle_type, v.fuel_efficiency, v.capacity, u.first_name, u.last_name, u.trust_score 
       FROM routes r 
       JOIN vehicles v ON r.vehicle_id = v.vehicle_id 
       JOIN users u ON r.driver_id = u.user_id 
       WHERE r.route_id = ?`,
      [routeId]
    );
    return rows[0];
  }

  async findActiveByDriver(driverId) {
    const [rows] = await db.execute(
      `SELECT r.*, v.vehicle_type FROM routes r 
       JOIN vehicles v ON r.vehicle_id = v.vehicle_id 
       WHERE r.driver_id = ? AND r.route_status = 'active' 
       ORDER BY r.created_at DESC`,
      [driverId]
    );
    return rows;
  }

  async searchActiveRoutes(departureTime, passengerCount, days) {
    const timeStart = new Date(`1970-01-01 ${departureTime}`);
    timeStart.setMinutes(timeStart.getMinutes() - 30);
    const timeEnd = new Date(`1970-01-01 ${departureTime}`);
    timeEnd.setMinutes(timeEnd.getMinutes() + 30);
    console.log("departureTime: " + departureTime);
    console.log("timeStart111: " + timeStart.toString());
    console.log("timeEnd111: " + timeEnd.toString());
    console.log("timeStart: " + timeStart.toTimeString().slice(0, 8));
    console.log("timeEnd: " + timeEnd.toTimeString().slice(0, 8));

    const dayConditions = days.map(() => 'r.days LIKE ?');
    const dayValues = days.map(day => `%${day}%`);
    console.log(dayConditions.join(' OR '));
    console.log ("dayValues: " + dayValues);
    const [rows] = await db.execute(
      `SELECT r.*, v.vehicle_type, v.fuel_efficiency, u.first_name, u.last_name, u.trust_score 
       FROM routes r 
       JOIN vehicles v ON r.vehicle_id = v.vehicle_id 
       JOIN users u ON r.driver_id = u.user_id 
       WHERE r.route_status = 'active' 
       AND r.available_seats >= ? 
       AND r.departure_time BETWEEN ? AND ?
       AND (${dayConditions.join(' OR ')})`,
      [passengerCount, timeStart.toTimeString().slice(0, 8), timeEnd.toTimeString().slice(0, 8), ...dayValues]
    );
    return rows;
  }

  async updateAvailableSeats(routeId, seats) {
    await db.execute('UPDATE routes SET available_seats = ? WHERE route_id = ?', [seats, routeId]);
  }

  async updateStatus(routeId, status) {
    await db.execute('UPDATE routes SET route_status = ? WHERE route_id = ?', [status, routeId]);
  }
}

module.exports = new RouteRepository();
