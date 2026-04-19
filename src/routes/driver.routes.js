const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireDriver } = require('../middleware/roleMiddleware');
const { validate, schemas } = require('../middleware/validationMiddleware');

router.post('/create-route', authMiddleware, requireDriver, validate(schemas.createRoute), driverController.createRoute);
router.post('/mark-location', authMiddleware, requireDriver, driverController.markLocation);
router.get('/routes', authMiddleware, requireDriver, driverController.getRoutes);
router.post('/add-vehicle', authMiddleware, requireDriver, validate(schemas.addVehicle), driverController.addVehicle);
router.get('/vehicles', authMiddleware, requireDriver, driverController.getVehicles);

module.exports = router;
