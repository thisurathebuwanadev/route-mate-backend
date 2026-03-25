const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { AuthError } = require('../errors/AppErrors');
const { logger } = require('./loggingMiddleware');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Authentication failed - no token provided', { 
        ip: req.ip, 
        url: req.url,
        method: req.method 
      });
      throw new AuthError('No token provided');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret);
    
    req.user = { userId: decoded.userId, role: decoded.role };
    
    logger.debug('Authentication successful', { 
      userId: decoded.userId, 
      role: decoded.role,
      url: req.url,
      method: req.method 
    });
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      logger.warn('Authentication failed - invalid/expired token', { 
        error: error.message,
        ip: req.ip, 
        url: req.url,
        method: req.method 
      });
      next(new AuthError('Invalid or expired token'));
    } else {
      logger.error('Authentication middleware error', { 
        error: error.message,
        ip: req.ip 
      });
      next(error);
    }
  }
};

module.exports = authMiddleware;
