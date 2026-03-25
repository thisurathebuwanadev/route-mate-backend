const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireDriver } = require('../middleware/roleMiddleware');
const { validate, schemas } = require('../middleware/validationMiddleware');

router.post('/start', authMiddleware, requireDriver, validate(schemas.startTrip), tripController.startTrip);
router.post('/end', authMiddleware, requireDriver, validate(schemas.endTrip), tripController.endTrip);
router.post('/gps', authMiddleware, requireDriver, validate(schemas.gpsUpdate), tripController.updateGPS);

module.exports = router;
