const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const authMiddleware = require('../middleware/authMiddleware');
const { requirePassenger, requireDriver, requireDriverOrPassenger } = require('../middleware/roleMiddleware');
const { validate, schemas } = require('../middleware/validationMiddleware');

router.post('/request', authMiddleware, requirePassenger, validate(schemas.rideRequest), rideController.requestRide);
router.post('/accept', authMiddleware, requireDriver, validate(schemas.acceptRide), rideController.acceptRide);
router.get('/incoming', authMiddleware, requireDriver, rideController.getIncomingRequests);
router.get('/active', authMiddleware, requireDriver, rideController.getActiveRequests.bind(rideController));
router.get('/completed', authMiddleware, requireDriver, rideController.getCompletedRequests.bind(rideController));
router.get('/cancelled', authMiddleware, requireDriver, rideController.getCancelledRequests.bind(rideController));
router.get('/history', authMiddleware, requireDriverOrPassenger, rideController.getHistory);
router.get('/history/summary', authMiddleware, requireDriverOrPassenger, rideController.getHistorySummary);

module.exports = router;
