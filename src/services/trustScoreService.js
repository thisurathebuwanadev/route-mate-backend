const userRepository = require('../repositories/userRepository');
const verificationRepository = require('../repositories/verificationRepository');

class TrustScoreService {
  getTrustPoints(documentType) {
    const points = {
      phone: 1.0,
      profile_photo: 0.5,
      national_id: 2.0,
      address_proof: 1.5,
      driver_license: 2.0,
      vehicle_photo: 1.0
    };
    return points[documentType] || 0;
  }

  async recalculateTrustScore(userId) {
    const totalPoints = await verificationRepository.getTotalApprovedPoints(userId);
    const trustScore = Math.min(totalPoints, 5.0);
    await userRepository.updateTrustScore(userId, trustScore);
    return trustScore;
  }
}

module.exports = new TrustScoreService();
