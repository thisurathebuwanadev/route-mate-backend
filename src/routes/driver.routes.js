const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireDriver } = require('../middleware/roleMiddleware');
const { validate, schemas } = require('../middleware/validationMiddleware');

router.post('/go-online', authMiddleware, requireDriver, validate(schemas.goOnline), driverController.goOnline);
router.get('/routes', authMiddleware, requireDriver, driverController.getRoutes);

module.exports = router;
