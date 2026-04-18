require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || '0.0.0.0', // Allow connections from all interfaces
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'routemate_db'
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '1h',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
  },
  security: {
    allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
    trustedNetworks: process.env.TRUSTED_NETWORKS ? process.env.TRUSTED_NETWORKS.split(',') : ['192.168.0.0/16', '10.0.0.0/8', '172.16.0.0/12'],
    enableNetworkRestriction: process.env.ENABLE_NETWORK_RESTRICTION === 'true',
    maxRequestsPerMinute: parseInt(process.env.MAX_REQUESTS_PER_MINUTE) || 100,
    enableIpWhitelist: process.env.ENABLE_IP_WHITELIST === 'true',
    whitelistedIps: process.env.WHITELISTED_IPS ? process.env.WHITELISTED_IPS.split(',') : []
  },
  googleMapsKey: process.env.GOOGLE_MAPS_KEY || '',
  fuelPricePerLiter: parseFloat(process.env.FUEL_PRICE_PER_LITER) || 1.50,
  allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
  fileUploadMaxMB: parseInt(process.env.FILE_UPLOAD_MAX_MB) || 5
};
