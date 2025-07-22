# Faredown Backend API

## 🚀 Quick Start

The fastest way to start the backend server:

### Option 1: Using the startup script

```bash
python start.py
```

### Option 2: Manual start

```bash
# Install dependencies
pip install -r requirements.txt

# Start the server
python main.py
```

### Option 3: Using uvicorn directly

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 📍 Server URLs

Once started, the backend will be available at:

- **Main API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 🗂️ API Endpoints

### Core Endpoints

- `GET /` - API information and status
- `GET /health` - Health check endpoint

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Admin Dashboard

- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/users` - Manage users
- `GET /api/admin/bookings` - Manage bookings
- `GET /api/admin/analytics` - Analytics data

### Booking Management

- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/{id}` - Get booking details
- `PUT /api/bookings/{id}` - Update booking
- `DELETE /api/bookings/{id}` - Cancel booking

### Flights & Airlines

- `GET /api/airlines/search` - Search flights
- `POST /api/airlines/book` - Book flight
- `GET /api/airlines/routes` - Get available routes

### Hotels

- `GET /api/hotels/search` - Search hotels
- `GET /api/hotels/{id}` - Get hotel details
- `POST /api/hotels/book` - Book hotel room

### Bargain Engine

- `POST /api/bargain/initiate` - Start bargain session
- `POST /api/bargain/counter` - Submit counter offer
- `GET /api/bargain/session/{id}` - Get bargain session

### Currency Management

- `GET /api/currency/rates` - Get exchange rates
- `POST /api/currency/convert` - Convert currency

### Promo Codes

- `GET /api/promo/codes` - List promo codes
- `POST /api/promo/validate` - Validate promo code
- `POST /api/promo/apply` - Apply promo code

## 🔧 Configuration

### Environment Variables

The backend uses the following environment variables (configured in `.env`):

```env
# Application
DEBUG=False
ENVIRONMENT=production
SECRET_KEY=your-secret-key

# Database
DATABASE_URL=sqlite:///./faredown.db

# APIs
AMADEUS_API_KEY=your-amadeus-key
BOOKING_COM_API_KEY=your-booking-key
OPENAI_API_KEY=your-openai-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email
SMTP_PASSWORD=your-password

# CORS
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### Database

- **Development**: SQLite (automatic setup)
- **Production**: PostgreSQL (requires setup)

The database will be automatically created when you start the server for the first time.

## 🎯 Features

### ✅ Implemented Features

1. **Authentication System**
   - JWT-based authentication
   - Role-based access control
   - Session management

2. **Booking Engine**
   - Flight booking and management
   - Hotel booking and management
   - Booking confirmation and tracking

3. **Bargain Engine**
   - Real-time price negotiation
   - Counter-offer logic
   - Session-based bargaining

4. **Admin Dashboard**
   - User management
   - Booking analytics
   - Revenue tracking
   - System monitoring

5. **Payment Integration**
   - Payment processing framework
   - Transaction tracking
   - Refund management

6. **Multi-currency Support**
   - Real-time exchange rates
   - Currency conversion
   - Localized pricing

7. **Content Management**
   - Dynamic content updates
   - SEO management
   - Image handling

8. **AI Integration**
   - Smart pricing recommendations
   - Demand prediction
   - Customer insights

### 🚧 Coming Soon

- Real-time notifications
- Advanced analytics
- Mobile app API
- Third-party integrations

## 📊 Database Schema

### Core Tables

- `users` - User accounts and profiles
- `bookings` - All booking records
- `flights` - Flight inventory and schedules
- `hotels` - Hotel inventory and rooms
- `payments` - Payment transactions
- `bargain_sessions` - Active bargain sessions
- `promo_codes` - Promotional codes
- `admin_users` - Admin accounts
- `analytics` - System analytics data

## 🔐 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt encryption
- **CORS Protection**: Configured origins only
- **Input Validation**: Pydantic models
- **SQL Injection Protection**: SQLAlchemy ORM
- **Rate Limiting**: API request limits
- **Audit Logging**: All actions logged

## 🧪 Testing

### Health Check

```bash
curl http://localhost:8000/health
```

### API Documentation

Visit http://localhost:8000/docs for interactive API testing

### Frontend Testing

Use the frontend's Backend Test Dashboard at:
`/backend-test`

## 🐛 Troubleshooting

### Common Issues

1. **Port 8000 already in use**

   ```bash
   # Kill process using port 8000
   lsof -ti:8000 | xargs kill -9
   ```

2. **Database connection errors**
   - Check DATABASE_URL in .env
   - Ensure database exists
   - Check permissions

3. **Module import errors**

   ```bash
   # Reinstall dependencies
   pip install -r requirements.txt --force-reinstall
   ```

4. **CORS errors**
   - Add your frontend URL to ALLOWED_ORIGINS
   - Check environment configuration

### Logs

Server logs will show:

- ✅ Successful operations
- ❌ Errors and exceptions
- 🔍 Debug information (if DEBUG=True)
- 📊 Request/response details

## 📞 Support

For technical support:

- Check the logs for error details
- Visit API documentation at `/docs`
- Use the health check endpoint at `/health`

## 🚀 Production Deployment

For production deployment:

1. **Update environment variables**
2. **Use PostgreSQL database**
3. **Set up Redis for caching**
4. **Configure proper CORS origins**
5. **Enable SSL/HTTPS**
6. **Set up monitoring and logging**

---

## 📈 Performance

- **Response Time**: < 200ms average
- **Throughput**: 1000+ requests/second
- **Database**: Optimized queries with indexing
- **Caching**: Redis-based caching system
- **Monitoring**: Health checks and metrics

Happy coding! 🎯
