const db = require('../config/database');
const { logger } = require('../middleware/loggingMiddleware');

class UserRepository {
  async create({ email, passwordHash, firstName, lastName, phoneNumber, userType, role = 'PASSENGER' }) {
    try {
      logger.debug('Creating new user', { email, userType, role });
      const [result] = await db.execute(
        'INSERT INTO users (email, password_hash, first_name, last_name, phone_number, user_type, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [email, passwordHash, firstName, lastName, phoneNumber, userType, role]
      );
      logger.info('User created successfully', { userId: result.insertId, email });
      return result.insertId;
    } catch (error) {
      logger.error('Failed to create user', { email, error: error.message });
      throw error;
    }
  }

  async findByEmail(email) {
    try {
      logger.debug('Finding user by email', { email });
      const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      const found = rows.length > 0;
      logger.debug('User search by email completed', { email, found });
      return rows[0];
    } catch (error) {
      logger.error('Failed to find user by email', { email, error: error.message });
      throw error;
    }
  }

  async findById(userId) {
    try {
      logger.debug('Finding user by ID', { userId });
      const [rows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
      const found = rows.length > 0;
      logger.debug('User search by ID completed', { userId, found });
      return rows[0];
    } catch (error) {
      logger.error('Failed to find user by ID', { userId, error: error.message });
      throw error;
    }
  }

  async findByPhoneNumber(phoneNumber) {
    try {
      logger.debug('Finding user by phone number', { phoneNumber });
      const [rows] = await db.execute('SELECT * FROM users WHERE phone_number = ?', [phoneNumber]);
      const found = rows.length > 0;
      logger.debug('User search by phone completed', { phoneNumber, found });
      return rows[0];
    } catch (error) {
      logger.error('Failed to find user by phone', { phoneNumber, error: error.message });
      throw error;
    }
  }

  async updateProfile(userId, { firstName, lastName, profileImageUrl }) {
    try {
      logger.info('Updating user profile', { userId, firstName, lastName });
      const updates = [];
      const values = [];
      
      if (firstName) {
        updates.push('first_name = ?');
        values.push(firstName);
      }
      if (lastName) {
        updates.push('last_name = ?');
        values.push(lastName);
      }
      if (profileImageUrl) {
        updates.push('profile_image_url = ?');
        values.push(profileImageUrl);
      }
      
      if (updates.length === 0) {
        logger.warn('No profile updates provided', { userId });
        return;
      }
      
      values.push(userId);
      await db.execute(`UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`, values);
      logger.info('User profile updated successfully', { userId });
    } catch (error) {
      logger.error('Failed to update user profile', { userId, error: error.message });
      throw error;
    }
  }

  async updateTrustScore(userId, trustScore) {
    try {
      logger.info('Updating user trust score', { userId, trustScore });
      await db.execute('UPDATE users SET trust_score = ? WHERE user_id = ?', [trustScore, userId]);
      logger.info('Trust score updated successfully', { userId, trustScore });
    } catch (error) {
      logger.error('Failed to update trust score', { userId, trustScore, error: error.message });
      throw error;
    }
  }

  async updateVerificationStatus(userId, isVerified) {
    try {
      logger.info('Updating user verification status', { userId, isVerified });
      await db.execute('UPDATE users SET is_verified = ? WHERE user_id = ?', [isVerified, userId]);
      logger.info('Verification status updated successfully', { userId, isVerified });
    } catch (error) {
      logger.error('Failed to update verification status', { userId, isVerified, error: error.message });
      throw error;
    }
  }
}

module.exports = new UserRepository();
