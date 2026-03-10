const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { AuthError } = require('../errors/AppErrors');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('No token provided');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = { userId: decoded.userId };
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new AuthError('Invalid or expired token'));
    } else {
      next(error);
    }
  }
};

module.exports = authMiddleware;
