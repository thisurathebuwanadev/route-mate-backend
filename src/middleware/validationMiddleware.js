const Joi = require('joi');
const sanitizeHtml = require('sanitize-html');
const { ValidationError } = require('../errors/AppErrors');

const sanitizeInput = (obj) => {
  if (typeof obj === 'string') {
    return sanitizeHtml(obj, { allowedTags: [], allowedAttributes: {} });
  }
  if (typeof obj === 'object' && obj !== null) {
    const sanitized = {};
    for (const key in obj) {
      sanitized[key] = sanitizeInput(obj[key]);
    }
    return sanitized;
  }
  return obj;
};

const validate = (schema) => {
  return (req, res, next) => {
    req.body = sanitizeInput(req.body);
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const message = error.details.map(d => d.message).join(', ');
      return next(new ValidationError(message));
    }
    
    req.body = value;
    next();
  };
};

const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(2).max(100).required(),
    lastName: Joi.string().min(2).max(100).required(),
    phoneNumber: Joi.string().pattern(/^[0-9+\-\s()]+$/).required(),
    userType: Joi.string().valid('driver', 'passenger', 'both').required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().min(2).max(100),
    lastName: Joi.string().min(2).max(100),
    profileImageUrl: Joi.string().uri()
  }),

  goOnline: Joi.object({
    vehicleId: Joi.number().integer().required(),
    startLatitude: Joi.number().min(-90).max(90).required(),
    startLongitude: Joi.number().min(-180).max(180).required(),
    endLatitude: Joi.number().min(-90).max(90).required(),
    endLongitude: Joi.number().min(-180).max(180).required(),
    startAddress: Joi.string().max(500),
    endAddress: Joi.string().max(500),
    departureTime: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).required(),
    availableSeats: Joi.number().integer().min(1).required()
  }),

  searchRoutes: Joi.object({
    startLatitude: Joi.number().min(-90).max(90).required(),
    startLongitude: Joi.number().min(-180).max(180).required(),
    endLatitude: Joi.number().min(-90).max(90).required(),
    endLongitude: Joi.number().min(-180).max(180).required(),
    departureTime: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).required(),
    passengerCount: Joi.number().integer().min(1).default(1)
  }),

  rideRequest: Joi.object({
    routeId: Joi.number().integer().required(),
    pickupLatitude: Joi.number().min(-90).max(90).required(),
    pickupLongitude: Joi.number().min(-180).max(180).required(),
    pickupAddress: Joi.string().max(500),
    passengerCount: Joi.number().integer().min(1).default(1)
  }),

  acceptRide: Joi.object({
    requestId: Joi.number().integer().required(),
    action: Joi.string().valid('accept', 'reject').required(),
    reason: Joi.string().max(200)
  }),

  startTrip: Joi.object({
    routeId: Joi.number().integer().required()
  }),

  endTrip: Joi.object({
    routeId: Joi.number().integer().required()
  }),

  gpsUpdate: Joi.object({
    routeId: Joi.number().integer().required(),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  })
};

module.exports = { validate, schemas };
