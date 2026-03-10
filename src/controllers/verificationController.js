const verificationRepository = require('../repositories/verificationRepository');
const trustScoreService = require('../services/trustScoreService');
const redis = require('../config/redis');
const { NotFoundError } = require('../errors/AppErrors');

class VerificationController {
  async uploadDocument(req, res, next) {
    try {
      const { documentType } = req.body;
      const documentUrl = req.file ? `/uploads/${req.file.filename}` : req.body.documentUrl;
      const trustPoints = trustScoreService.getTrustPoints(documentType);

      const verificationId = await verificationRepository.create({
        userId: req.user.userId,
        documentType,
        documentUrl,
        trustPoints
      });

      res.status(201).json({
        success: true,
        data: { verificationId, message: 'Document uploaded successfully' }
      });
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req, res, next) {
    try {
      const verifications = await verificationRepository.findByUser(req.user.userId);
      res.json({ success: true, data: verifications });
    } catch (error) {
      next(error);
    }
  }

  async reviewDocument(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const verification = await verificationRepository.findById(id);
      if (!verification) throw new NotFoundError('Verification not found');

      await verificationRepository.updateStatus(id, status);

      if (status === 'approved') {
        await trustScoreService.recalculateTrustScore(verification.user_id);
        await redis.del(`profile:${verification.user_id}`);
      }

      res.json({ success: true, data: { message: 'Document reviewed successfully' } });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VerificationController();
