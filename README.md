# RouteMate Backend API

Complete ride-sharing backend API built with Node.js, Express, MySQL, Redis, and Socket.io.

## Tech Stack

- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Database**: MySQL 8.0 (mysql2)
- **Cache**: Redis 7 (ioredis)
- **Auth**: JWT (15min access / 7-day refresh)
- **Real-Time**: Socket.io
- **Validation**: Joi + sanitize-html
- **Security**: Helmet, CORS, Bcrypt, Rate Limiting

## Prerequisites

- Node.js 18+
- MySQL 8.0
- Redis 7
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd route-mate-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure `.env` with your settings:
```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=routemate_db
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key-here
```

5. Create database and run migrations:
```bash
mysql -u root -p < database/schema.sql
```

6. Create uploads directory:
```bash
mkdir uploads
```

7. Start the server:
```bash
npm run dev
```

## Docker Deployment

```bash
docker-compose up -d
```

## API Endpoints

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "userType": "both"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### User Profile

#### Get Profile
```http
GET /users/profile
Authorization: Bearer <access-token>
```

#### Update Profile
```http
PUT /users/profile
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "profileImageUrl": "https://example.com/image.jpg"
}
```

### Driver Operations

#### Go Online (Create Route)
```http
POST /drivers/go-online
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "vehicleId": 1,
  "startLatitude": 6.9271,
  "startLongitude": 79.8612,
  "endLatitude": 6.0535,
  "endLongitude": 80.2210,
  "startAddress": "Colombo",
  "endAddress": "Galle",
  "departureTime": "08:00:00",
  "availableSeats": 3
}
```

#### Get Active Routes
```http
GET /drivers/routes
Authorization: Bearer <access-token>
```

### Route Search

#### Search Routes
```http
POST /routes/search
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "startLatitude": 6.9271,
  "startLongitude": 79.8612,
  "endLatitude": 6.0535,
  "endLongitude": 80.2210,
  "departureTime": "08:00:00",
  "passengerCount": 1
}
```

### Ride Requests

#### Request Ride
```http
POST /rides/request
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "routeId": 1,
  "pickupLatitude": 6.9271,
  "pickupLongitude": 79.8612,
  "pickupAddress": "Colombo Fort",
  "passengerCount": 1
}
```

#### Accept/Reject Ride
```http
POST /rides/accept
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "requestId": 1,
  "action": "accept"
}
```

#### Get Ride History
```http
GET /rides/history?limit=20&offset=0
Authorization: Bearer <access-token>
```

### Trip Management

#### Start Trip
```http
POST /trips/start
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "routeId": 1
}
```

#### End Trip
```http
POST /trips/end
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "routeId": 1
}
```

#### Update GPS Location
```http
POST /trips/gps
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "routeId": 1,
  "latitude": 6.9271,
  "longitude": 79.8612
}
```

### Verification

#### Upload Document
```http
POST /verification/upload-document
Authorization: Bearer <access-token>
Content-Type: multipart/form-data

document: <file>
documentType: "driver_license"
```

#### Get Verification Status
```http
GET /verification/status
Authorization: Bearer <access-token>
```

#### Review Document (Admin)
```http
PUT /verification/review/:id
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "status": "approved"
}
```

### Carbon Savings

#### Get Carbon Savings
```http
GET /carbon/savings
Authorization: Bearer <access-token>
```

## WebSocket Events

### Client → Server

#### Join Trip Room
```javascript
socket.emit('trip:join', { routeId: 1 });
```

#### Send GPS Location (Driver)
```javascript
socket.emit('driver:location', {
  routeId: 1,
  latitude: 6.9271,
  longitude: 79.8612
});
```

### Server → Client

#### Receive GPS Updates
```javascript
socket.on('driver:location', (data) => {
  console.log(data.latitude, data.longitude, data.timestamp);
});
```

#### Ride Accepted
```javascript
socket.on('ride:accepted', (data) => {
  console.log(data.requestId, data.estimatedPickupTime);
});
```

#### Ride Rejected
```javascript
socket.on('ride:rejected', (data) => {
  console.log(data.requestId, data.reason);
});
```

#### Trip Started
```javascript
socket.on('trip:started', (data) => {
  console.log(data.routeId);
});
```

#### Trip Ended
```javascript
socket.on('trip:ended', (data) => {
  console.log(data.routeId, data.carbonSaved);
});
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

## Error Codes

- `VALIDATION_ERROR` - Invalid request data
- `AUTH_ERROR` - Authentication failed
- `FORBIDDEN` - Access denied
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

## Architecture

### Layered Architecture
- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic
- **Repositories**: Database operations
- **Middleware**: Authentication, validation, logging

### Security Features
- JWT authentication with refresh tokens
- Bcrypt password hashing (12 rounds)
- Rate limiting (100 req/15min/IP)
- Input sanitization
- SQL injection prevention (prepared statements)
- Helmet security headers
- CORS protection

### Caching Strategy
- Route search results: 120s TTL
- User profiles: 300s TTL
- GPS locations: 300s TTL
- Refresh tokens: 7 days TTL

## Trust Score System

Document verification points:
- Phone: 1.0
- Profile Photo: 0.5
- National ID: 2.0
- Address Proof: 1.5
- Driver License: 2.0
- Vehicle Photo: 1.0

Maximum trust score: 5.0

## Carbon Calculation

Emission factors (kg CO₂/km):
- Car: 0.21
- Van: 0.27
- Bike: 0.05

Formula: `carbonSaved = individualEmission - (individualEmission / passengerCount)`

## License

ISC
