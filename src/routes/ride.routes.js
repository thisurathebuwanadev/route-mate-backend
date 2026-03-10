const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validationMiddleware');

router.post('/request', authMiddleware, validate(schemas.rideRequest), rideController.requestRide);
router.post('/accept', authMiddleware, validate(schemas.acceptRide), rideController.acceptRide);
router.get('/history', authMiddleware, rideController.getHistory);

module.exports = router;
