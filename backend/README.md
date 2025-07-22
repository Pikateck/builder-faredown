# 🎯 Faredown Backend API

**AI-Powered Travel Booking Platform with Real-time Bargain Engine**

Complete backend system for Faredown.com - the world's first AI-powered travel platform where users can bargain for better prices on flights and hotels.

## ✨ Features Implemented

### 🔐 Authentication & User Management

- JWT-based authentication with secure session management
- User registration, login, profile management
- B2C user tracking with online status monitoring
- Social login support (Google, Facebook, Apple)

### 💰 AI-Powered Bargain Engine

- **10-minute bargain sessions** with real-time countdown
- **Intelligent AI counter-offers** using OpenAI
- **Dynamic pricing strategies** (aggressive, moderate, conservative)
- **Session management** with automatic expiration
- **Anti-duplicate** offer protection

### 📊 Core Business Logic

- **Markup management** for flights and hotels
- **Multi-currency support** with real-time exchange rates
- **Promo code system** with usage tracking
- **VAT and convenience fee** calculations
- **Comprehensive booking workflow**

### 🤖 AI Services

- **Smart bargain decisions** based on user behavior
- **Dynamic pricing suggestions** using market analysis
- **User behavior scoring** for personalized offers
- **Profit margin optimization**

### 🚀 Production Ready

- **FastAPI** with async support
- **PostgreSQL** database with SQLAlchemy
- **Docker** containerization
- **Render.com** deployment configuration
- **Comprehensive error handling**
- **Health checks** and monitoring

## 🏗️ Architecture

```
faredown-backend/
├── app/
│   ├── models/           # Database models
│   │   ├── user_models.py      # User, Profile, Sessions
│   │   ├── bargain_models.py   # Bargain engine
│   │   └── booking_models.py   # Bookings, Payments
│   ├── routers/          # API endpoints
│   │   ├── auth.py            # Authentication
│   │   ├── bargain.py         # Bargain engine
│   │   └── ...               # Other endpoints
│   ├── services/         # Business logic
│   │   └── ai_service.py      # AI bargain engine
│   ���── core/
│   │   └── config.py          # Configuration
│   └── database.py       # Database setup
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
├── Dockerfile          # Container configuration
├── render.yaml         # Deployment configuration
└── .env.example        # Environment template
```

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Clone and navigate
cd backend

# Copy environment template
cp .env.example .env

# Update .env with your configuration
```

### 2. Database Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Set up PostgreSQL database
# Update DATABASE_URL in .env

# Run the application (creates tables automatically)
python main.py
```

### 3. Run Development Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 🎯 Key API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Bargain Engine

- `POST /api/bargain/start` - Start 10-minute bargain session
- `POST /api/bargain/offer` - Make bargain offer
- `POST /api/bargain/accept-counter/{session_id}` - Accept AI counter
- `GET /api/bargain/session/{session_id}` - Get session status
- `GET /api/bargain/history` - User bargain history

### Core Features

- `GET /api/admin/*` - Admin dashboard endpoints
- `GET /api/reports/*` - Analytics and reporting
- `GET /api/users/*` - User management
- `GET /api/currency/*` - Currency management

## 💡 Bargain Engine Logic

### How It Works

1. **Session Creation**: User starts 10-minute bargain session
2. **AI Analysis**: System analyzes user behavior and market data
3. **Offer Evaluation**: User makes price offer
4. **AI Decision**: Smart AI generates counter-offer or accepts
5. **Real-time Updates**: Frontend receives live updates via API

### AI Strategies

- **Aggressive**: Move closer to user's offer (high savings)
- **Moderate**: Balanced approach (moderate savings)
- **Conservative**: Maintain higher margins (premium experience)

### Session Management

- **10-minute timeout** matching supplier session duration
- **Maximum 3 attempts** per session
- **Anti-duplicate** protection
- **Real-time countdown** and status updates

## 🔧 Configuration

### Required Environment Variables

```bash
# Core Settings
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:pass@host:port/db

# AI Configuration
OPENAI_API_KEY=your-openai-key

# External APIs
AMADEUS_API_KEY=your-amadeus-key
BOOKING_COM_API_KEY=your-booking-key

# Email Settings
SMTP_HOST=smtp.gmail.com
SMTP_USERNAME=your-email
SMTP_PASSWORD=your-app-password
```

### Optional Configuration

- `BARGAIN_SESSION_TIMEOUT=600` (10 minutes)
- `MAX_BARGAIN_ATTEMPTS=3`
- `MIN_MARKUP_PERCENTAGE=5.0`
- `MAX_MARKUP_PERCENTAGE=20.0`

## 🚀 Deployment

### Using Docker

```bash
# Build image
docker build -t faredown-backend .

# Run container
docker run -p 8000:8000 --env-file .env faredown-backend
```

### Using Render.com

1. Connect your GitHub repository
2. Use the provided `render.yaml` configuration
3. Set environment variables in Render dashboard
4. Deploy automatically on code push

## 📊 Database Schema

### Core Tables

- **users**: User accounts and authentication
- **user_profiles**: Extended user information
- **user_sessions**: Session tracking for online status
- **bargain_sessions**: 10-minute bargain sessions
- **bargain_attempts**: Individual bargain offers
- **counter_offers**: AI-generated counter offers
- **bookings**: Complete booking records
- **payments**: Payment processing and tracking

## 🛡️ Security Features

- **JWT authentication** with secure token management
- **Password hashing** using bcrypt
- **Session management** with automatic expiration
- **CORS protection** with configurable origins
- **Request validation** using Pydantic models
- **SQL injection protection** via SQLAlchemy ORM

## 📈 AI & Analytics

### AI Capabilities

- **User behavior analysis** for personalized offers
- **Dynamic pricing** based on market conditions
- **Smart counter-offer generation**
- **Profit margin optimization**
- **Conversion probability prediction**

### Analytics Tracking

- **Bargain success rates** by strategy
- **User engagement metrics**
- **Revenue and profit analysis**
- **Market trend identification**

## 🔄 Frontend Integration

This backend is designed to work seamlessly with the Faredown frontend running at:

- **Production**: https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev
- **Development**: http://localhost:3000

### Real-time Connectivity

- **RESTful APIs** for all operations
- **WebSocket support** for live updates (planned)
- **CORS configured** for frontend domains
- **JSON responses** with consistent error handling

## 📝 Next Steps

### Immediate Deployment

1. Set up PostgreSQL database
2. Configure environment variables
3. Deploy to Render.com using provided configuration
4. Test API endpoints with frontend

### Future Enhancements

- WebSocket integration for real-time updates
- Advanced AI models for better predictions
- Integration with more supplier APIs
- Enhanced reporting and analytics dashboard

---

## 🎉 Status: Production Ready

This backend system is **fully functional** and ready for production deployment. It includes:

✅ **Complete API system** with authentication  
✅ **AI-powered bargain engine** with 10-minute sessions  
✅ **Database models** for all entities  
✅ **Production deployment** configuration  
✅ **Security best practices** implemented  
✅ **Error handling** and monitoring  
✅ **Documentation** and health checks

**Ready to deploy and connect with your Faredown frontend!** 🚀
