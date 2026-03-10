const express = require('express');
const router = express.Router();
const carbonController = require('../controllers/carbonController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/savings', authMiddleware, carbonController.getSavings);

module.exports = router;
