const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validationMiddleware');

router.post('/go-online', authMiddleware, validate(schemas.goOnline), driverController.goOnline);
router.get('/routes', authMiddleware, driverController.getRoutes);

module.exports = router;
