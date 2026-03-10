const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validationMiddleware');

router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, validate(schemas.updateProfile), userController.updateProfile);

module.exports = router;
