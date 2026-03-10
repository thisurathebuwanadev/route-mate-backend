const db = require('../config/database');

class UserRepository {
  async create({ email, passwordHash, firstName, lastName, phoneNumber, userType }) {
    const [result] = await db.execute(
      'INSERT INTO users (email, password_hash, first_name, last_name, phone_number, user_type) VALUES (?, ?, ?, ?, ?, ?)',
      [email, passwordHash, firstName, lastName, phoneNumber, userType]
    );
    return result.insertId;
  }

  async findByEmail(email) {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  async findById(userId) {
    const [rows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
    return rows[0];
  }

  async findByPhoneNumber(phoneNumber) {
    const [rows] = await db.execute('SELECT * FROM users WHERE phone_number = ?', [phoneNumber]);
    return rows[0];
  }

  async updateProfile(userId, { firstName, lastName, profileImageUrl }) {
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
    
    if (updates.length === 0) return;
    
    values.push(userId);
    await db.execute(`UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`, values);
  }

  async updateTrustScore(userId, trustScore) {
    await db.execute('UPDATE users SET trust_score = ? WHERE user_id = ?', [trustScore, userId]);
  }

  async updateVerificationStatus(userId, isVerified) {
    await db.execute('UPDATE users SET is_verified = ? WHERE user_id = ?', [isVerified, userId]);
  }
}

module.exports = new UserRepository();
