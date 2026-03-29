const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const authMiddleware = require('../middleware/authMiddleware');
const { requirePassenger, requireDriver, requireDriverOrPassenger } = require('../middleware/roleMiddleware');
const { validate, schemas } = require('../middleware/validationMiddleware');

router.post('/request', authMiddleware, requirePassenger, validate(schemas.rideRequest), rideController.requestRide);
router.post('/accept', authMiddleware, requireDriver, validate(schemas.acceptRide), rideController.acceptRide);
router.get('/incoming', authMiddleware, requireDriver, rideController.getIncomingRequests);
router.get('/history', authMiddleware, requireDriverOrPassenger, rideController.getHistory);

module.exports = router;
