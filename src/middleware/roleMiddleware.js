const { AuthError } = require('../errors/AppErrors');
const { logger } = require('./loggingMiddleware');

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      logger.warn('Role check failed - no user/role in request', { 
        url: req.url,
        method: req.method,
        ip: req.ip 
      });
      return next(new AuthError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Role check failed - insufficient permissions', { 
        userId: req.user.userId,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        url: req.url,
        method: req.method,
        ip: req.ip 
      });
      return next(new AuthError('Insufficient permissions'));
    }

    logger.debug('Role check passed', { 
      userId: req.user.userId,
      userRole: req.user.role,
      requiredRoles: allowedRoles,
      url: req.url,
      method: req.method 
    });

    next();
  };
};

const requireAdmin = requireRole('ADMIN');
const requireDriver = requireRole('DRIVER', 'ADMIN');
const requirePassenger = requireRole('PASSENGER', 'ADMIN');
const requireDriverOrPassenger = requireRole('DRIVER', 'PASSENGER', 'ADMIN');

module.exports = {
  requireRole,
  requireAdmin,
  requireDriver,
  requirePassenger,
  requireDriverOrPassenger
};