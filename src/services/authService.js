const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const redis = require('../config/redis');
const config = require('../config/env');
const { AuthError, ConflictError } = require('../errors/AppErrors');
const { logger } = require('../middleware/loggingMiddleware');

class AuthService {
  async register({ email, password, firstName, lastName, phoneNumber, userType, role = 'PASSENGER' }) {
    logger.info('User registration attempt', { email, userType, role });
    
    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) {
      logger.warn('Registration failed - email already exists', { email });
      throw new ConflictError('Email already registered');
    }

    const existingPhone = await userRepository.findByPhoneNumber(phoneNumber);
    if (existingPhone) {
      logger.warn('Registration failed - phone already exists', { phoneNumber });
      throw new ConflictError('Phone number already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = await userRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
      phoneNumber,
      userType,
      role
    });

    logger.info('User registered successfully', { userId, email, role });

    const accessToken = this.generateAccessToken(userId, role);
    const refreshToken = this.generateRefreshToken(userId);
    await this.storeRefreshToken(userId, refreshToken);

    return { userId, accessToken, refreshToken };
  }

  async login(email, password) {
    logger.info('Login attempt', { email });
    
    const user = await userRepository.findByEmail(email);
    if (!user) {
      logger.warn('Login failed - user not found', { email });
      throw new AuthError('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      logger.warn('Login failed - invalid password', { email, userId: user.user_id });
      throw new AuthError('Invalid credentials');
    }

    logger.info('User logged in successfully', { 
      userId: user.user_id, 
      email: user.email, 
      role: user.role 
    });

    const accessToken = this.generateAccessToken(user.user_id, user.role);
    const refreshToken = this.generateRefreshToken(user.user_id);
    await this.storeRefreshToken(user.user_id, refreshToken);

    return {
      userId: user.user_id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      role: user.role,
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
        logger.warn('Token refresh failed - invalid refresh token', { userId: decoded.userId });
        throw new AuthError('Invalid refresh token');
      }

      const user = await userRepository.findById(decoded.userId);
      if (!user) {
        logger.warn('Token refresh failed - user not found', { userId: decoded.userId });
        throw new AuthError('User not found');
      }

      logger.info('Access token refreshed successfully', { userId: decoded.userId });

      const accessToken = this.generateAccessToken(decoded.userId, user.role);
      return { accessToken };
    } catch (error) {
      logger.error('Token refresh error', { error: error.message });
      throw new AuthError('Invalid or expired refresh token');
    }
  }

  generateAccessToken(userId, role) {
    logger.debug('Generating access token', { userId, role });
    return jwt.sign({ userId, role }, config.jwt.secret, { expiresIn: config.jwt.accessExpiry });
  }

  generateRefreshToken(userId) {
    logger.debug('Generating refresh token', { userId });
    return jwt.sign({ userId }, config.jwt.secret, { expiresIn: config.jwt.refreshExpiry });
  }

  async storeRefreshToken(userId, token) {
    logger.debug('Storing refresh token', { userId });
    await redis.setex(`refresh:${userId}`, 604800, token);
  }

  async invalidateRefreshToken(userId) {
    logger.info('Invalidating refresh token', { userId });
    await redis.del(`refresh:${userId}`);
  }
}

module.exports = new AuthService();
