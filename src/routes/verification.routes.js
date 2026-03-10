const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const verificationController = require('../controllers/verificationController');
const authMiddleware = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed'));
    }
  }
});

router.post('/upload-document', authMiddleware, upload.single('document'), verificationController.uploadDocument);
router.get('/status', authMiddleware, verificationController.getStatus);
router.put('/review/:id', authMiddleware, verificationController.reviewDocument);

module.exports = router;
