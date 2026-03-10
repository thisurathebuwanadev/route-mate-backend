const carbonService = require('../services/carbonService');

class CarbonController {
  async getSavings(req, res, next) {
    try {
      const savings = await carbonService.getUserCarbonSavings(req.user.userId);
      res.json({ success: true, data: savings });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CarbonController();
