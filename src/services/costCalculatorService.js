const config = require('../config/env');

class CostCalculatorService {
  calculateFare({ vehicleType, distanceKm, passengerCount, fuelEfficiency }) {
    const baseRates = { bike: 0.50, car: 1.20, van: 1.80 };
    const baseRate = baseRates[vehicleType] || 1.20;
    
    const baseCost = distanceKm * baseRate;
    const fuelCost = fuelEfficiency ? (distanceKm / fuelEfficiency) * config.fuelPricePerLiter : 0;
    const totalCost = baseCost + fuelCost;
    const costPerPassenger = totalCost / passengerCount;

    return {
      totalCost: parseFloat(totalCost.toFixed(2)),
      costPerPassenger: parseFloat(costPerPassenger.toFixed(2)),
      breakdown: {
        baseCost: parseFloat(baseCost.toFixed(2)),
        fuelCost: parseFloat(fuelCost.toFixed(2)),
        distanceKm: parseFloat(distanceKm.toFixed(2))
      }
    };
  }
}

module.exports = new CostCalculatorService();
