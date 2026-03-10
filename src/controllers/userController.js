const userRepository = require('../repositories/userRepository');
const verificationRepository = require('../repositories/verificationRepository');
const redis = require('../config/redis');

class UserController {
  async getProfile(req, res, next) {
    try {
      const cached = await redis.get(`profile:${req.user.userId}`);
      if (cached) {
        return res.json({ success: true, data: JSON.parse(cached) });
      }

      const user = await userRepository.findById(req.user.userId);
      const verifications = await verificationRepository.findByUser(req.user.userId);

      const profile = {
        userId: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phoneNumber: user.phone_number,
        profileImageUrl: user.profile_image_url,
        userType: user.user_type,
        trustScore: user.trust_score,
        isVerified: user.is_verified,
        verifications: verifications.map(v => ({
          documentType: v.document_type,
          status: v.verification_status,
          verifiedAt: v.verified_at
        }))
      };

      await redis.setex(`profile:${req.user.userId}`, 300, JSON.stringify(profile));
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      await userRepository.updateProfile(req.user.userId, req.body);
      await redis.del(`profile:${req.user.userId}`);
      res.json({ success: true, data: { message: 'Profile updated successfully' } });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
