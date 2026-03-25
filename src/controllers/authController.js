const authService = require('../services/authService');
const { logger } = require('../middleware/loggingMiddleware');

class AuthController {
  async register(req, res, next) {
    try {
      logger.info('Registration request received', { 
        email: req.body.email, 
        userType: req.body.userType,
        role: req.body.role,
        ip: req.ip 
      });
      
      const result = await authService.register(req.body);
      
      logger.info('Registration successful', { 
        userId: result.userId, 
        email: req.body.email 
      });
      
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Registration failed', { 
        email: req.body.email, 
        error: error.message,
        ip: req.ip 
      });
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      logger.info('Login request received', { 
        email, 
        ip: req.ip,
        userAgent: req.get('User-Agent') 
      });
      
      const result = await authService.login(email, password);
      
      logger.info('Login successful', { 
        userId: result.userId, 
        email: result.email,
        role: result.role,
        ip: req.ip 
      });
      
      res.json({ success: true, data: result });
    } catch (error) {
      logger.warn('Login failed', { 
        email: req.body.email, 
        error: error.message,
        ip: req.ip 
      });
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      logger.info('Token refresh request received', { ip: req.ip });
      
      const result = await authService.refreshAccessToken(refreshToken);
      
      logger.info('Token refresh successful', { ip: req.ip });
      
      res.json({ success: true, data: result });
    } catch (error) {
      logger.warn('Token refresh failed', { 
        error: error.message,
        ip: req.ip 
      });
      next(error);
    }
  }
}

module.exports = new AuthController();
