const Redis = require('ioredis');
const config = require('./env');
const { logger } = require('../middleware/loggingMiddleware');

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    logger.warn('Redis connection retry attempt', { 
      attempt: times, 
      delay: `${delay}ms`,
      host: config.redis.host 
    });
    return delay;
  },
  maxRetriesPerRequest: 3
});

redis.on('connect', () => {
  logger.info('Redis connected successfully', {
    host: config.redis.host,
    port: config.redis.port
  });
});

redis.on('ready', () => {
  logger.info('Redis ready for operations', {
    host: config.redis.host,
    port: config.redis.port
  });
});

redis.on('error', (err) => {
  logger.error('Redis connection error', {
    error: err.message,
    host: config.redis.host,
    port: config.redis.port
  });
});

redis.on('close', () => {
  logger.warn('Redis connection closed', {
    host: config.redis.host,
    port: config.redis.port
  });
});

redis.on('reconnecting', () => {
  logger.info('Redis reconnecting', {
    host: config.redis.host,
    port: config.redis.port
  });
});

module.exports = redis;
