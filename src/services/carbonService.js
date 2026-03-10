const verificationRepository = require('../repositories/verificationRepository');

class CarbonService {
  async calculateCarbonSaving({ distanceKm, passengerCount, vehicleType, userId, rideRequestId }) {
    const emissionFactors = { car: 0.21, van: 0.27, bike: 0.05 };
    const emissionFactor = emissionFactors[vehicleType] || 0.21;

    const individualEmission = distanceKm * emissionFactor;
    const sharedEmission = individualEmission / passengerCount;
    const carbonSaved = individualEmission - sharedEmission;

    await verificationRepository.createCarbonSaving({
      userId,
      rideRequestId,
      estimatedIndividualEmission: parseFloat(individualEmission.toFixed(4)),
      sharedRideEmission: parseFloat(sharedEmission.toFixed(4)),
      carbonSaved: parseFloat(carbonSaved.toFixed(4)),
      distanceTraveled: parseFloat(distanceKm.toFixed(2))
    });

    return {
      individualEmission: parseFloat(individualEmission.toFixed(4)),
      sharedEmission: parseFloat(sharedEmission.toFixed(4)),
      carbonSaved: parseFloat(carbonSaved.toFixed(4))
    };
  }

  async getUserCarbonSavings(userId) {
    const totals = await verificationRepository.getCarbonSavingsByUser(userId);
    const monthly = await verificationRepository.getMonthlyCarbonSavings(userId);

    return {
      totalCarbonSaved: parseFloat((totals.total_saved || 0).toFixed(4)),
      totalDistance: parseFloat((totals.total_distance || 0).toFixed(2)),
      monthlyBreakdown: monthly.map(m => ({
        month: m.month,
        saved: parseFloat(m.saved.toFixed(4))
      }))
    };
  }
}

module.exports = new CarbonService();
