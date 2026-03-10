const db = require('../config/database');

class VerificationRepository {
  async create(verificationData) {
    const [result] = await db.execute(
      'INSERT INTO user_verifications (user_id, document_type, document_url, trust_points) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE document_url = ?, verification_status = ?',
      [verificationData.userId, verificationData.documentType, verificationData.documentUrl, verificationData.trustPoints, verificationData.documentUrl, 'pending']
    );
    return result.insertId;
  }

  async findByUser(userId) {
    const [rows] = await db.execute(
      'SELECT * FROM user_verifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  }

  async findById(verificationId) {
    const [rows] = await db.execute('SELECT * FROM user_verifications WHERE verification_id = ?', [verificationId]);
    return rows[0];
  }

  async updateStatus(verificationId, status) {
    await db.execute(
      'UPDATE user_verifications SET verification_status = ?, verified_at = CURRENT_TIMESTAMP WHERE verification_id = ?',
      [status, verificationId]
    );
  }

  async getTotalApprovedPoints(userId) {
    const [rows] = await db.execute(
      'SELECT SUM(trust_points) as total FROM user_verifications WHERE user_id = ? AND verification_status = ?',
      [userId, 'approved']
    );
    return rows[0]?.total || 0;
  }

  async createCarbonSaving(carbonData) {
    const [result] = await db.execute(
      'INSERT INTO carbon_savings (user_id, ride_request_id, estimated_individual_emission, shared_ride_emission, carbon_saved, distance_traveled) VALUES (?, ?, ?, ?, ?, ?)',
      [carbonData.userId, carbonData.rideRequestId, carbonData.estimatedIndividualEmission, carbonData.sharedRideEmission, carbonData.carbonSaved, carbonData.distanceTraveled]
    );
    return result.insertId;
  }

  async getCarbonSavingsByUser(userId) {
    const [rows] = await db.execute(
      'SELECT SUM(carbon_saved) as total_saved, SUM(distance_traveled) as total_distance FROM carbon_savings WHERE user_id = ?',
      [userId]
    );
    return rows[0];
  }

  async getMonthlyCarbonSavings(userId) {
    const [rows] = await db.execute(
      `SELECT DATE_FORMAT(calculated_at, '%Y-%m') as month, SUM(carbon_saved) as saved 
       FROM carbon_savings 
       WHERE user_id = ? 
       GROUP BY month 
       ORDER BY month DESC 
       LIMIT 12`,
      [userId]
    );
    return rows;
  }
}

module.exports = new VerificationRepository();
