const mysql = require('mysql2/promise');
const config = require('./env');
const { logger } = require('../middleware/loggingMiddleware');

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Log database connection events
pool.on('connection', (connection) => {
  logger.info('Database connection established', { 
    connectionId: connection.threadId,
    host: config.db.host,
    database: config.db.database 
  });
});

pool.on('error', (err) => {
  logger.error('Database connection error', { 
    error: err.message,
    code: err.code,
    host: config.db.host 
  });
});

// Test initial connection
pool.getConnection()
  .then(connection => {
    logger.info('Database pool initialized successfully', {
      host: config.db.host,
      database: config.db.database,
      connectionLimit: 10
    });
    connection.release();
  })
  .catch(err => {
    logger.error('Failed to initialize database pool', {
      error: err.message,
      host: config.db.host,
      database: config.db.database
    });
  });

module.exports = pool;
