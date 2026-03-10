const db = require('../config/database');

class RideRepository {
  async create(rideData) {
    const [result] = await db.execute(
      `INSERT INTO ride_requests (route_id, passenger_id, pickup_latitude, pickup_longitude, 
       pickup_address, passenger_count, estimated_cost) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        rideData.routeId, rideData.passengerId, rideData.pickupLatitude, rideData.pickupLongitude,
        rideData.pickupAddress, rideData.passengerCount, rideData.estimatedCost
      ]
    );
    return result.insertId;
  }

  async findById(requestId) {
    const [rows] = await db.execute(
      `SELECT rr.*, r.driver_id, r.vehicle_id, u.first_name, u.last_name 
       FROM ride_requests rr 
       JOIN routes r ON rr.route_id = r.route_id 
       JOIN users u ON rr.passenger_id = u.user_id 
       WHERE rr.request_id = ?`,
      [requestId]
    );
    return rows[0];
  }

  async findByRouteAndPassenger(routeId, passengerId) {
    const [rows] = await db.execute(
      'SELECT * FROM ride_requests WHERE route_id = ? AND passenger_id = ? AND request_status IN (?, ?)',
      [routeId, passengerId, 'pending', 'accepted']
    );
    return rows[0];
  }

  async updateStatus(requestId, status) {
    await db.execute(
      'UPDATE ride_requests SET request_status = ?, responded_at = CURRENT_TIMESTAMP WHERE request_id = ?',
      [status, requestId]
    );
  }

  async findHistoryByUser(userId, limit, offset) {
    const [rows] = await db.execute(
      `SELECT rr.*, r.start_address, r.end_address, r.departure_time, 
       u.first_name AS driver_first_name, u.last_name AS driver_last_name 
       FROM ride_requests rr 
       JOIN routes r ON rr.route_id = r.route_id 
       JOIN users u ON r.driver_id = u.user_id 
       WHERE rr.passenger_id = ? 
       ORDER BY rr.requested_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    return rows;
  }

  async createVehicle(vehicleData) {
    const [result] = await db.execute(
      'INSERT INTO vehicles (user_id, vehicle_type, make, model, license_plate, capacity, fuel_efficiency) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [vehicleData.userId, vehicleData.vehicleType, vehicleData.make, vehicleData.model, vehicleData.licensePlate, vehicleData.capacity, vehicleData.fuelEfficiency]
    );
    return result.insertId;
  }

  async findVehicleByUser(userId) {
    const [rows] = await db.execute('SELECT * FROM vehicles WHERE user_id = ? AND is_active = true', [userId]);
    return rows[0];
  }
}

module.exports = new RideRepository();
