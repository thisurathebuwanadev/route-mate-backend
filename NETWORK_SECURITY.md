# RouteMate Network Security Configuration

## Overview

The RouteMate backend is configured to handle network connections securely, with support for:
- Binding to all network interfaces (0.0.0.0)
- Firewall-friendly configuration
- Network-based access control
- IP whitelisting and trusted networks
- Enhanced rate limiting with IP awareness

## Network Configuration

### Server Binding

The server binds to `0.0.0.0:3000` by default, allowing connections from:
- Localhost (127.0.0.1)
- Local network devices (192.168.x.x, 10.x.x.x)
- External networks (if firewall allows)

### Environment Variables

```env
# Server binding
HOST=0.0.0.0                    # Bind to all interfaces
PORT=3000                       # Server port

# CORS Origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.100:3000,http://10.0.0.50:3000

# Trusted Networks (CIDR notation)
TRUSTED_NETWORKS=192.168.0.0/16,10.0.0.0/8,172.16.0.0/12

# Network Security
ENABLE_NETWORK_RESTRICTION=false    # Enable trusted network filtering
ENABLE_IP_WHITELIST=false          # Enable IP whitelist
WHITELISTED_IPS=192.168.1.100,10.0.0.50  # Specific allowed IPs

# Rate Limiting
MAX_REQUESTS_PER_MINUTE=100
```

## Security Layers

### 1. Network Security Middleware

**Features:**
- Real client IP detection (handles proxies/load balancers)
- Private network detection
- Trusted network validation
- IP whitelisting
- Suspicious activity detection

**Configuration:**
```javascript
// Enable network restriction
ENABLE_NETWORK_RESTRICTION=true
TRUSTED_NETWORKS=192.168.0.0/16,10.0.0.0/8

// Enable IP whitelist
ENABLE_IP_WHITELIST=true
WHITELISTED_IPS=192.168.1.100,192.168.1.101,10.0.0.50
```

### 2. Enhanced Rate Limiting

**Different limits for different endpoints:**
- General API: 100 requests/15 minutes
- Authentication: 10 requests/15 minutes
- Admin operations: 20 requests/5 minutes

**IP-aware features:**
- Uses real client IP for rate limiting
- More lenient for private networks in development
- Detailed logging of rate limit violations

### 3. CORS Configuration

**Secure CORS setup:**
```javascript
cors({
  origin: config.security.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
})
```

## Deployment Scenarios

### Scenario 1: Local Development
```env
HOST=0.0.0.0
PORT=3000
ENABLE_NETWORK_RESTRICTION=false
ENABLE_IP_WHITELIST=false
ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.100:3000
```

### Scenario 2: Same Network Deployment
```env
HOST=0.0.0.0
PORT=3000
ENABLE_NETWORK_RESTRICTION=true
TRUSTED_NETWORKS=192.168.1.0/24
ALLOWED_ORIGINS=http://192.168.1.100:3000,http://192.168.1.101:3000
```

### Scenario 3: Restricted Access
```env
HOST=0.0.0.0
PORT=3000
ENABLE_IP_WHITELIST=true
WHITELISTED_IPS=192.168.1.100,192.168.1.101,10.0.0.50
ALLOWED_ORIGINS=http://192.168.1.100:3000
```

### Scenario 4: Production Deployment
```env
HOST=0.0.0.0
PORT=3000
ENABLE_NETWORK_RESTRICTION=true
TRUSTED_NETWORKS=10.0.0.0/8
MAX_REQUESTS_PER_MINUTE=50
ALLOWED_ORIGINS=https://yourdomain.com
```

## Firewall Configuration

### Windows Firewall
```cmd
# Allow inbound connections on port 3000
netsh advfirewall firewall add rule name="RouteMate Backend" dir=in action=allow protocol=TCP localport=3000

# Allow from specific network only
netsh advfirewall firewall add rule name="RouteMate Backend Local" dir=in action=allow protocol=TCP localport=3000 remoteip=192.168.1.0/24
```

### Linux iptables
```bash
# Allow port 3000 from local network
sudo iptables -A INPUT -p tcp --dport 3000 -s 192.168.1.0/24 -j ACCEPT

# Allow port 3000 from specific IP
sudo iptables -A INPUT -p tcp --dport 3000 -s 192.168.1.100 -j ACCEPT
```

### UFW (Ubuntu)
```bash
# Allow from local network
sudo ufw allow from 192.168.1.0/24 to any port 3000

# Allow from specific IP
sudo ufw allow from 192.168.1.100 to any port 3000
```

## Network Discovery

### Finding Your Server IP
```bash
# Windows
ipconfig

# Linux/Mac
ifconfig
ip addr show
```

### Testing Connectivity
```bash
# Test from client device
curl http://192.168.1.50:3000/health

# Test with specific headers
curl -H "Origin: http://192.168.1.100:3000" http://192.168.1.50:3000/health
```

## Security Monitoring

### Logged Events
- All connection attempts with IP addresses
- Network security violations
- Rate limit violations
- Suspicious activity detection
- CORS violations

### Log Examples
```
2024-01-15 10:30:45 [INFO]: Network connection attempt | {"ip": "192.168.1.100", "method": "GET", "url": "/health"}
2024-01-15 10:30:46 [WARN]: Connection blocked - IP not in trusted network | {"ip": "203.0.113.1", "trustedNetworks": ["192.168.0.0/16"]}
2024-01-15 10:30:47 [WARN]: Rate limit exceeded | {"ip": "192.168.1.100", "url": "/auth/login"}
```

## Troubleshooting

### Common Issues

#### 1. Cannot Connect from Other Devices
**Symptoms:** Connection refused, timeout
**Solutions:**
- Check `HOST=0.0.0.0` in .env
- Verify firewall allows port 3000
- Check network restrictions in config

#### 2. CORS Errors
**Symptoms:** Browser blocks requests
**Solutions:**
- Add client origin to `ALLOWED_ORIGINS`
- Check protocol (http vs https)
- Verify port numbers match

#### 3. Rate Limited
**Symptoms:** 429 Too Many Requests
**Solutions:**
- Check rate limit settings
- Verify IP detection is working
- Review rate limit logs

#### 4. Network Restriction Blocks Valid Clients
**Symptoms:** 403 Access denied from untrusted network
**Solutions:**
- Add client network to `TRUSTED_NETWORKS`
- Disable network restriction temporarily
- Check CIDR notation is correct

### Debug Commands

```bash
# Check server is listening on all interfaces
netstat -an | grep :3000

# Test from different IPs
curl -H "X-Forwarded-For: 192.168.1.100" http://localhost:3000/health

# Check logs for network issues
tail -f logs/app.log | grep "Network"
```

## Best Practices

### Development
- Use `ENABLE_NETWORK_RESTRICTION=false` for flexibility
- Include all development device IPs in `ALLOWED_ORIGINS`
- Monitor logs for connection issues

### Production
- Enable network restrictions
- Use HTTPS origins only
- Implement IP whitelisting for sensitive operations
- Set appropriate rate limits
- Monitor security logs regularly

### Network Security
- Use private networks when possible
- Implement firewall rules at network level
- Regular security audits
- Monitor for suspicious activity
- Keep security configurations updated

## Performance Considerations

### Rate Limiting Impact
- Minimal CPU overhead
- Memory usage scales with unique IPs
- Consider Redis for distributed rate limiting

### Network Middleware
- Lightweight IP validation
- Efficient CIDR matching
- Minimal latency impact

### Logging
- Structured logging for analysis
- Log rotation to manage disk space
- Consider log aggregation for production