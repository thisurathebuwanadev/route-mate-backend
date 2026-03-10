const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const redis = require('../config/redis');
const config = require('../config/env');
const { AuthError, ConflictError } = require('../errors/AppErrors');

class AuthService {
  async register({ email, password, firstName, lastName, phoneNumber, userType }) {
    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) throw new ConflictError('Email already registered');

    const existingPhone = await userRepository.findByPhoneNumber(phoneNumber);
    if (existingPhone) throw new ConflictError('Phone number already registered');

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = await userRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
      phoneNumber,
      userType
    });

    const accessToken = this.generateAccessToken(userId);
    const refreshToken = this.generateRefreshToken(userId);
    await this.storeRefreshToken(userId, refreshToken);

    return { userId, accessToken, refreshToken };
  }

  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new AuthError('Invalid credentials');

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) throw new AuthError('Invalid credentials');

    const accessToken = this.generateAccessToken(user.user_id);
    const refreshToken = this.generateRefreshToken(user.user_id);
    await this.storeRefreshToken(user.user_id, refreshToken);

    return {
      userId: user.user_id,
      trustScore: user.trust_score,
      accessToken,
      refreshToken
    };
  }

  async refreshAccessToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret);
      const storedToken = await redis.get(`refresh:${decoded.userId}`);
      
      if (!storedToken || storedToken !== refreshToken) {
        throw new AuthError('Invalid refresh token');
      }

      const accessToken = this.generateAccessToken(decoded.userId);
      return { accessToken };
    } catch (error) {
      throw new AuthError('Invalid or expired refresh token');
    }
  }

  generateAccessToken(userId) {
    return jwt.sign({ userId }, config.jwt.secret, { expiresIn: config.jwt.accessExpiry });
  }

  generateRefreshToken(userId) {
    return jwt.sign({ userId }, config.jwt.secret, { expiresIn: config.jwt.refreshExpiry });
  }

  async storeRefreshToken(userId, token) {
    await redis.setex(`refresh:${userId}`, 604800, token);
  }

  async invalidateRefreshToken(userId) {
    await redis.del(`refresh:${userId}`);
  }
}

module.exports = new AuthService();
