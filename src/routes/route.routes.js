const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validationMiddleware');

router.post('/search', authMiddleware, validate(schemas.searchRoutes), rideController.searchRoutes);

module.exports = router;
