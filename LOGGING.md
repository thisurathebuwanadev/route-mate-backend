# RouteMate Logging System

## Overview

The RouteMate backend implements comprehensive logging using Winston for structured logging and Morgan for HTTP request logging. All logs are written to both console and files with different log levels and rotation.

## Log Levels

- **ERROR**: System errors, exceptions, failed operations
- **WARN**: Warning conditions, authentication failures, validation errors
- **INFO**: General information, successful operations, user actions
- **DEBUG**: Detailed debugging information (development only)

## Log Files

### Location: `./logs/`

- **app.log**: All application logs (info, warn, error, debug)
- **error.log**: Error logs only
- **Console**: Colored output for development

### File Rotation
- Maximum file size: 5MB
- Maximum files kept: 5
- Automatic rotation when size limit reached

## Log Format

```
YYYY-MM-DD HH:mm:ss [LEVEL]: message | {"key": "value", ...}
```

### Example:
```
2024-01-15 10:30:45 [INFO]: User logged in successfully | {"userId": 123, "email": "user@example.com", "role": "PASSENGER", "ip": "192.168.1.1"}
```

## Logged Events

### Authentication & Authorization
- User registration attempts and results
- Login attempts (success/failure) with IP tracking
- Token refresh operations
- Authentication failures
- Role-based access control violations
- Admin operations (user management)

### Database Operations
- Connection establishment and errors
- User creation, updates, and queries
- Database pool events

### Redis Operations
- Connection status changes
- Retry attempts
- Connection errors and recovery

### HTTP Requests
- All incoming requests with method, URL, IP, user agent
- Response status codes and duration
- Request completion times

### Security Events
- Failed authentication attempts
- Invalid tokens
- Insufficient permissions
- Suspicious activities

### System Events
- Server startup and shutdown
- Graceful shutdown procedures
- Configuration loading

## Usage Examples

### In Services
```javascript
const { logger } = require('../middleware/loggingMiddleware');

// Info logging
logger.info('User operation completed', { 
  userId: 123, 
  operation: 'profile_update' 
});

// Error logging
logger.error('Database operation failed', { 
  userId: 123, 
  error: error.message,
  operation: 'user_create' 
});

// Warning logging
logger.warn('Invalid input detected', { 
  userId: 123, 
  input: sanitizedInput 
});
```

### In Controllers
```javascript
// Request logging
logger.info('API request received', { 
  endpoint: '/api/users/profile',
  method: 'PUT',
  userId: req.user.userId,
  ip: req.ip 
});

// Success logging
logger.info('API request completed successfully', { 
  endpoint: '/api/users/profile',
  userId: req.user.userId,
  duration: '150ms' 
});
```

## Security Considerations

### What We Log
- User IDs (not personal information)
- IP addresses
- Request URLs and methods
- Error messages
- Timestamps
- Operation results

### What We DON'T Log
- Passwords (plain text or hashed)
- JWT tokens
- Personal information (names, emails in logs)
- Credit card information
- Sensitive user data

### Log Access
- Logs contain sensitive information (IPs, user IDs)
- Restrict access to log files
- Consider log encryption for production
- Implement log retention policies

## Configuration

### Environment-based Logging
- **Development**: Debug level, console + file output
- **Production**: Info level, file output only, health check requests skipped

### Log Levels by Environment
```javascript
const logLevel = config.nodeEnv === 'production' ? 'info' : 'debug';
```

## Monitoring & Alerting

### Key Metrics to Monitor
- Error rate (errors per minute)
- Authentication failure rate
- Database connection errors
- Redis connection issues
- Response times

### Alert Conditions
- High error rates (>10 errors/minute)
- Multiple authentication failures from same IP
- Database connection failures
- Redis connection issues
- Server startup/shutdown events

## Log Analysis

### Common Queries

#### Find authentication failures:
```bash
grep "Authentication failed" logs/app.log
```

#### Find errors for specific user:
```bash
grep "userId.*123" logs/error.log
```

#### Monitor login attempts:
```bash
grep "Login attempt" logs/app.log | tail -20
```

#### Check database issues:
```bash
grep "Database" logs/error.log
```

## Best Practices

1. **Structured Logging**: Always include relevant context (userId, IP, operation)
2. **Consistent Format**: Use the same log format across all components
3. **Appropriate Levels**: Use correct log levels for different events
4. **No Sensitive Data**: Never log passwords, tokens, or personal information
5. **Performance**: Avoid excessive logging in high-frequency operations
6. **Correlation**: Include request IDs for tracing requests across services

## Troubleshooting

### Common Issues

#### Logs not appearing:
- Check file permissions on `./logs/` directory
- Verify Winston configuration
- Check disk space

#### Performance impact:
- Reduce log level in production
- Implement log sampling for high-volume events
- Use asynchronous logging

#### Log rotation not working:
- Check file size limits
- Verify write permissions
- Monitor disk space

## Integration with External Systems

### Log Aggregation
Consider integrating with:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Splunk
- CloudWatch (AWS)
- Datadog

### Log Shipping
- Use log shippers like Filebeat
- Configure log forwarding
- Set up centralized logging

## Maintenance

### Regular Tasks
- Monitor log file sizes
- Clean up old log files
- Review error patterns
- Update log retention policies
- Test log rotation

### Log Retention
- Keep error logs for 30 days
- Keep info logs for 7 days
- Archive important logs
- Comply with data retention policies