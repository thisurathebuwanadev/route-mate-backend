const config = require('../config/env');
const { logger } = require('./loggingMiddleware');
const { AuthError } = require('../errors/AppErrors');

// Helper function to check if IP is in CIDR range
const isIpInCidr = (ip, cidr) => {
  const [range, bits] = cidr.split('/');
  const mask = ~(2 ** (32 - bits) - 1);
  return (ip2int(ip) & mask) === (ip2int(range) & mask);
};

// Convert IP to integer
const ip2int = (ip) => {
  return ip.split('.').reduce((int, oct) => (int << 8) + parseInt(oct, 10), 0) >>> 0;
};

// Get real client IP (handles proxies, load balancers)
const getRealClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip ||
         'unknown';
};

// Check if IP is in private network ranges
const isPrivateNetwork = (ip) => {
  const privateRanges = [
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    '127.0.0.0/8'
  ];
  
  return privateRanges.some(range => {
    try {
      return isIpInCidr(ip, range);
    } catch (error) {
      return false;
    }
  });
};

// Network security middleware
const networkSecurityMiddleware = (req, res, next) => {
  const clientIp = getRealClientIp(req);
  const userAgent = req.get('User-Agent') || 'unknown';
  
  // Log all connection attempts
  logger.info('Network connection attempt', {
    ip: clientIp,
    method: req.method,
    url: req.url,
    userAgent,
    headers: {
      origin: req.get('Origin'),
      referer: req.get('Referer'),
      host: req.get('Host')
    }
  });

  // Skip security checks for health endpoint
  if (req.url === '/health') {
    return next();
  }

  try {
    // IP Whitelist check (if enabled)
    if (config.security.enableIpWhitelist && config.security.whitelistedIps.length > 0) {
      const isWhitelisted = config.security.whitelistedIps.includes(clientIp);
      if (!isWhitelisted) {
        logger.warn('Connection blocked - IP not whitelisted', {
          ip: clientIp,
          url: req.url,
          method: req.method
        });
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied from this IP address',
            code: 'IP_NOT_WHITELISTED'
          }
        });
      }
    }

    // Trusted network check (if enabled)
    if (config.security.enableNetworkRestriction) {
      const isInTrustedNetwork = config.security.trustedNetworks.some(network => {
        try {
          return isIpInCidr(clientIp, network);
        } catch (error) {
          logger.error('CIDR validation error', { network, ip: clientIp, error: error.message });
          return false;
        }
      });

      if (!isInTrustedNetwork) {
        logger.warn('Connection blocked - IP not in trusted network', {
          ip: clientIp,
          trustedNetworks: config.security.trustedNetworks,
          url: req.url,
          method: req.method
        });
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied from untrusted network',
            code: 'UNTRUSTED_NETWORK'
          }
        });
      }
    }

    // Add security headers for network information
    res.set({
      'X-Client-IP': clientIp,
      'X-Network-Security': 'enabled'
    });

    // Store client IP in request for logging
    req.clientIp = clientIp;
    req.isPrivateNetwork = isPrivateNetwork(clientIp);

    next();
  } catch (error) {
    logger.error('Network security middleware error', {
      error: error.message,
      ip: clientIp,
      url: req.url
    });
    next(error);
  }
};

// Suspicious activity detection
const suspiciousActivityMiddleware = (req, res, next) => {
  const clientIp = req.clientIp || getRealClientIp(req);
  const userAgent = req.get('User-Agent') || '';
  
  // Detect potential security threats
  const suspiciousPatterns = [
    /sqlmap/i,
    /nmap/i,
    /nikto/i,
    /burp/i,
    /owasp/i,
    /hack/i,
    /exploit/i
  ];

  const isSuspiciousUserAgent = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  
  if (isSuspiciousUserAgent) {
    logger.warn('Suspicious user agent detected', {
      ip: clientIp,
      userAgent,
      url: req.url,
      method: req.method
    });
  }

  // Check for common attack patterns in URL
  const suspiciousUrlPatterns = [
    /\.\./,  // Directory traversal
    /union.*select/i,  // SQL injection
    /<script/i,  // XSS
    /javascript:/i,  // XSS
    /eval\(/i,  // Code injection
    /exec\(/i   // Code injection
  ];

  const isSuspiciousUrl = suspiciousUrlPatterns.some(pattern => pattern.test(req.url));
  
  if (isSuspiciousUrl) {
    logger.warn('Suspicious URL pattern detected', {
      ip: clientIp,
      url: req.url,
      method: req.method,
      userAgent
    });
    
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid request pattern',
        code: 'SUSPICIOUS_REQUEST'
      }
    });
  }

  next();
};

// Connection monitoring middleware
const connectionMonitoringMiddleware = (req, res, next) => {
  const clientIp = req.clientIp || getRealClientIp(req);
  
  // Log connection details for monitoring
  logger.debug('Connection details', {
    ip: clientIp,
    isPrivateNetwork: req.isPrivateNetwork,
    protocol: req.protocol,
    secure: req.secure,
    method: req.method,
    url: req.url,
    headers: {
      host: req.get('Host'),
      origin: req.get('Origin'),
      referer: req.get('Referer'),
      userAgent: req.get('User-Agent')
    }
  });

  next();
};

module.exports = {
  networkSecurityMiddleware,
  suspiciousActivityMiddleware,
  connectionMonitoringMiddleware,
  getRealClientIp,
  isPrivateNetwork
};