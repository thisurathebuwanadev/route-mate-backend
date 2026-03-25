const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const { logger } = require('./loggingMiddleware');
const { getRealClientIp, isPrivateNetwork } = require('./networkSecurityMiddleware');

// Custom key generator that uses real client IP
const keyGenerator = (req) => {
  return getRealClientIp(req);
};

// Custom handler for rate limit exceeded
const rateLimitHandler = (req, res) => {
  const clientIp = getRealClientIp(req);
  
  logger.warn('Rate limit exceeded', {
    ip: clientIp,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    isPrivateNetwork: isPrivateNetwork(clientIp)
  });
  
  res.status(429).json({
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes'
    }
  });
};

// Skip rate limiting for certain conditions
const skipRateLimit = (req) => {
  const clientIp = getRealClientIp(req);
  
  // Skip for health checks
  if (req.url === '/health') {
    return true;
  }
  
  // More lenient for private networks in development
  if (config.nodeEnv === 'development' && isPrivateNetwork(clientIp)) {
    return false; // Still apply rate limiting but with higher limits
  }
  
  return false;
};

// Main rate limiting middleware
const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.security.maxRequestsPerMinute || 100,
  keyGenerator,
  handler: rateLimitHandler,
  skip: skipRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  onLimitReached: (req, res, options) => {
    const clientIp = getRealClientIp(req);
    logger.warn('Rate limit threshold reached', {
      ip: clientIp,
      limit: options.max,
      windowMs: options.windowMs,
      url: req.url
    });
  }
});

// Stricter rate limiting for authentication endpoints
const authRateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit auth attempts
  keyGenerator,
  handler: (req, res) => {
    const clientIp = getRealClientIp(req);
    
    logger.warn('Authentication rate limit exceeded', {
      ip: clientIp,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many authentication attempts, please try again later',
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        retryAfter: '15 minutes'
      }
    });
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Admin operations rate limiting
const adminRateLimitMiddleware = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit admin operations
  keyGenerator,
  handler: (req, res) => {
    const clientIp = getRealClientIp(req);
    
    logger.warn('Admin rate limit exceeded', {
      ip: clientIp,
      url: req.url,
      method: req.method,
      adminId: req.user?.userId
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many admin operations, please slow down',
        code: 'ADMIN_RATE_LIMIT_EXCEEDED',
        retryAfter: '5 minutes'
      }
    });
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  rateLimitMiddleware,
  authRateLimitMiddleware,
  adminRateLimitMiddleware
};
