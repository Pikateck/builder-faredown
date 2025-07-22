# Faredown Node.js API

## 🚀 Quick Start

The Faredown Node.js API provides a comprehensive backend service for the Faredown travel booking platform, connecting the frontend to admin panel operations.

### ⚡ One-Command Start

```bash
node start.js
```

### 📍 Server URLs

- **Main API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **API Documentation**: http://localhost:3001/api/docs

## 🎯 Features

### ✅ Complete Admin Integration

- **Authentication & Authorization** - JWT-based with role permissions
- **Admin Dashboard APIs** - Real-time statistics and analytics
- **User Management** - CRUD operations with audit logging
- **Booking Management** - Complete booking lifecycle
- **Payment Processing** - Payment gateway integration ready
- **Content Management** - CMS APIs for dynamic content
- **Analytics & Reporting** - Advanced reporting system
- **Audit Logging** - Complete action tracking
- **Security Features** - Rate limiting, CORS, input validation

### 🔐 Authentication System

- **JWT Tokens** - Secure authentication
- **Role-Based Access** - Multiple user roles and permissions
- **Session Management** - Secure session handling
- **Password Security** - Bcrypt hashing

### 📊 Admin Features

- **Real-time Dashboard** - Live statistics and KPIs
- **Booking Analytics** - Revenue, trends, performance metrics
- **User Analytics** - User behavior and engagement data
- **System Monitoring** - Health checks and system status
- **Audit Trail** - Complete action logging
- **Report Generation** - Export data in multiple formats

## 🛠️ Installation

### Prerequisites

- Node.js 16+
- npm or yarn
- Git

### Setup Steps

1. **Clone or navigate to API directory**

   ```bash
   cd api
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   ```bash
   # Environment file is already created with defaults
   # Edit .env file if needed
   ```

4. **Start the server**
   ```bash
   npm run dev    # Development with auto-reload
   npm start      # Production mode
   node start.js  # Direct start with setup checks
   ```

## 📡 API Endpoints

### 🔑 Authentication

```
POST   /api/auth/login              # User login
POST   /api/auth/register           # User registration
POST   /api/auth/logout             # User logout
GET    /api/auth/me                 # Get current user
POST   /api/auth/refresh            # Refresh token
POST   /api/auth/change-password    # Change password
GET    /api/auth/permissions        # Get user permissions
```

### 👨‍💼 Admin Dashboard

```
GET    /api/admin/dashboard         # Dashboard overview
GET    /api/admin/stats             # Real-time statistics
GET    /api/admin/analytics         # Analytics data
GET    /api/admin/reports           # Generate reports
GET    /api/admin/audit             # Audit logs
GET    /api/admin/system            # System information
POST   /api/admin/backup            # Create backup
```

### 📚 Booking Management

```
GET    /api/bookings               # List all bookings
GET    /api/bookings/:id           # Get booking details
POST   /api/bookings               # Create new booking
PUT    /api/bookings/:id           # Update booking
POST   /api/bookings/:id/cancel    # Cancel booking
GET    /api/bookings/:id/history   # Booking history
POST   /api/bookings/:id/resend-confirmation  # Resend confirmation
```

### 👥 User Management

```
GET    /api/users                  # List users
GET    /api/users/:id              # Get user details
POST   /api/users                  # Create user
PUT    /api/users/:id              # Update user
DELETE /api/users/:id              # Delete user
POST   /api/users/:id/activate     # Activate user
POST   /api/users/:id/deactivate   # Deactivate user
```

### ✈️ Flight Services

```
GET    /api/flights/search         # Search flights
GET    /api/flights/details/:id    # Flight details
POST   /api/flights/book           # Book flight
GET    /api/flights/routes         # Available routes
```

### 🏨 Hotel Services

```
GET    /api/hotels/search          # Search hotels
GET    /api/hotels/:id             # Hotel details
POST   /api/hotels/book            # Book hotel
GET    /api/hotels/availability    # Check availability
```

### 💰 Bargain Engine

```
POST   /api/bargain/initiate       # Start bargain session
POST   /api/bargain/counter        # Submit counter offer
GET    /api/bargain/session/:id    # Get bargain session
POST   /api/bargain/accept         # Accept offer
POST   /api/bargain/reject         # Reject offer
```

### 💳 Payment Processing

```
POST   /api/payments/process       # Process payment
GET    /api/payments/:id           # Payment details
POST   /api/payments/refund        # Process refund
GET    /api/payments/history       # Payment history
```

### 🎟️ Promo Codes

```
GET    /api/promo/codes            # List promo codes
POST   /api/promo/validate         # Validate promo code
POST   /api/promo/apply            # Apply promo code
POST   /api/promo/create           # Create promo code
```

### 💱 Currency Services

```
GET    /api/currency/rates         # Get exchange rates
POST   /api/currency/convert       # Convert currency
GET    /api/currency/supported     # Supported currencies
```

### 📝 Content Management

```
GET    /api/cms/content            # List content
POST   /api/cms/content            # Create content
PUT    /api/cms/content/:id        # Update content
DELETE /api/cms/content/:id        # Delete content
POST   /api/cms/publish/:id        # Publish content
```

## 🔐 Authentication & Authorization

### Test Credentials

```javascript
// Super Admin
{
  username: "admin",
  password: "admin123",
  role: "super_admin"
}

// Sales Manager
{
  username: "sales",
  password: "sales123",
  role: "sales_manager"
}

// Support Agent
{
  username: "support",
  password: "support123",
  role: "support"
}
```

### Using JWT Tokens

```javascript
// Login to get token
const response = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "admin", password: "admin123" }),
});

const { token } = await response.json();

// Use token in subsequent requests
const authResponse = await fetch("/api/admin/dashboard", {
  headers: { Authorization: `Bearer ${token}` },
});
```

## 🎛️ Configuration

### Environment Variables

Key configuration options in `.env`:

```env
# Server
NODE_ENV=development
PORT=3001

# JWT
JWT_SECRET=faredown-jwt-secret-key-2025
JWT_EXPIRES_IN=7d

# Security
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS=https://your-frontend-domain.com

# Features
ENABLE_BARGAIN_ENGINE=true
ENABLE_AI_PRICING=true
ENABLE_REAL_TIME_UPDATES=true
```

## 📊 Admin Dashboard Integration

### Real-time Statistics

The API provides real-time data for the admin dashboard:

```javascript
// Get dashboard stats
GET /api/admin/dashboard

// Response format
{
  "success": true,
  "data": {
    "totalBookings": 1247,
    "totalRevenue": 2847392,
    "successRate": 94.2,
    "topDestinations": [...],
    "recentBookings": [...],
    "systemHealth": {...}
  }
}
```

### Analytics & Reporting

```javascript
// Get analytics data
GET /api/admin/analytics?startDate=2025-01-01&endDate=2025-01-31

// Generate reports
GET /api/admin/reports?type=financial&format=json
```

## 🔍 Monitoring & Logging

### Health Checks

```bash
curl http://localhost:3001/health

# Response
{
  "status": "healthy",
  "timestamp": "2025-01-21T14:30:00.000Z",
  "version": "1.0.0",
  "uptime": 3600.5,
  "services": {
    "database": "connected",
    "cache": "connected"
  }
}
```

### Audit Logging

All admin actions are automatically logged:

```javascript
// View audit logs
GET /api/admin/audit?page=1&limit=50

// Filter audit logs
GET /api/admin/audit?userId=admin&actionType=USER_CREATE
```

## 🚨 Error Handling

### Standard Error Response

```javascript
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "details": {...}  // Additional error details
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

## 🔒 Security Features

### Rate Limiting

- **General API**: 100 requests/15 minutes per IP
- **Auth endpoints**: 5 requests/15 minutes per IP

### Input Validation

- **Joi schemas** for request validation
- **XSS protection** via input sanitization
- **SQL injection prevention** via parameterized queries

### Security Headers

- **Helmet.js** for security headers
- **CORS** protection
- **JWT** secure token handling

## 🧪 Testing

### Manual Testing

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test protected endpoint
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/admin/dashboard
```

### Frontend Integration Testing

Use the frontend's backend test dashboard:

```
https://your-frontend-domain.com/backend-test
```

## 📦 Dependencies

### Core Dependencies

- **express** - Web framework
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **cors** - CORS handling
- **helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **joi** - Input validation
- **winston** - Logging
- **dotenv** - Environment management

### Development Dependencies

- **nodemon** - Auto-reload during development
- **jest** - Testing framework
- **eslint** - Code linting

## 🚀 Deployment

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

### Docker

```bash
# Build image
docker build -t faredown-api .

# Run container
docker run -p 3001:3001 faredown-api
```

### Environment Setup

1. Copy `.env.example` to `.env`
2. Update configuration values
3. Set production secrets
4. Configure CORS origins
5. Set up external service credentials

## 📞 Support & Documentation

### API Documentation

- Interactive docs available at `/api/docs` (when running)
- Postman collection available
- OpenAPI/Swagger specification included

### Logging

- Application logs in `./logs/` directory
- Audit logs for security and compliance
- Error tracking and monitoring

### Monitoring

- Health check endpoint for monitoring
- Performance metrics available
- System status dashboard

## 🎯 Frontend Integration

This API is designed to work seamlessly with the Faredown React frontend:

### Update Frontend API URL

```javascript
// In frontend .env
VITE_API_BASE_URL=http://localhost:3001

// Or auto-detection is already implemented
```

### Test Integration

Use the frontend backend test panel at `/backend-test` to verify all endpoints.

---

## 🎉 Success!

Your Faredown Node.js API is now ready to power the admin panel and frontend operations!

### 📞 Quick Support

- Check logs in `./logs/` for errors
- Use health check endpoint for status
- Test with provided credentials
- Refer to audit logs for admin actions

**Happy coding!** 🚀
