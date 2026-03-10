const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validationMiddleware');

router.post('/start', authMiddleware, validate(schemas.startTrip), tripController.startTrip);
router.post('/end', authMiddleware, validate(schemas.endTrip), tripController.endTrip);
router.post('/gps', authMiddleware, validate(schemas.gpsUpdate), tripController.updateGPS);

module.exports = router;
