const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const userRepository = require('../repositories/userRepository');
const { logger } = require('../middleware/loggingMiddleware');

// Get all users (admin only)
router.get('/users', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    logger.info('Admin fetching users list', { 
      adminId: req.user.userId,
      limit: parseInt(limit),
      offset: parseInt(offset),
      ip: req.ip 
    });
    
    const [users] = await require('../config/database').execute(
      'SELECT user_id, email, first_name, last_name, phone_number, user_type, role, trust_score, is_verified, created_at FROM users LIMIT ? OFFSET ?',
      [parseInt(limit), parseInt(offset)]
    );
    
    logger.info('Users list fetched successfully', { 
      adminId: req.user.userId,
      userCount: users.length 
    });
    
    res.json({ success: true, data: users });
  } catch (error) {
    logger.error('Failed to fetch users list', { 
      adminId: req.user.userId,
      error: error.message 
    });
    next(error);
  }
});

// Update user role (admin only)
router.put('/users/:userId/role', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    logger.info('Admin updating user role', { 
      adminId: req.user.userId,
      targetUserId: userId,
      newRole: role,
      ip: req.ip 
    });
    
    if (!['ADMIN', 'PASSENGER', 'DRIVER'].includes(role)) {
      logger.warn('Invalid role update attempt', { 
        adminId: req.user.userId,
        targetUserId: userId,
        invalidRole: role 
      });
      return res.status(400).json({ success: false, error: { message: 'Invalid role' } });
    }

    await require('../config/database').execute(
      'UPDATE users SET role = ? WHERE user_id = ?',
      [role, userId]
    );
    
    logger.info('User role updated successfully', { 
      adminId: req.user.userId,
      targetUserId: userId,
      newRole: role 
    });
    
    res.json({ success: true, data: { message: 'Role updated successfully' } });
  } catch (error) {
    logger.error('Failed to update user role', { 
      adminId: req.user.userId,
      targetUserId: req.params.userId,
      error: error.message 
    });
    next(error);
  }
});

module.exports = router;