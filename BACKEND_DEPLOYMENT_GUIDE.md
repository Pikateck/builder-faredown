# 🚀 Faredown Backend Deployment Guide

## 📋 Overview

This guide covers multiple ways to deploy the Faredown backend API, from local development to production deployment.

## 🏠 Local Development

### Option 1: Quick Start (Recommended)
```bash
# From project root
python start_backend.py
```

### Option 2: Manual Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Start server
python main.py
```

### Option 3: Using Docker
```bash
# Start full stack with database
docker-compose up

# Or just backend
docker-compose up backend db redis
```

## ☁️ Cloud Deployment

### 1. Render.com (Recommended)

**Step 1: Prepare Repository**
```bash
# Ensure render.yaml is in project root
git add render.yaml
git commit -m "Add Render deployment config"
git push
```

**Step 2: Deploy on Render**
1. Go to [render.com](https://render.com)
2. Connect your GitHub repository
3. Click "New +" → "Blueprint"
4. Select your repository
5. Render will automatically deploy using `render.yaml`

**Step 3: Get Backend URL**
After deployment, your backend will be available at:
```
https://faredown-backend.onrender.com
```

### 2. Railway

**Step 1: Install Railway CLI**
```bash
npm install -g @railway/cli
railway login
```

**Step 2: Deploy**
```bash
# From project root
railway init
railway up
```

### 3. Fly.io

**Step 1: Install Fly CLI**
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh
```

**Step 2: Deploy**
```bash
# From backend directory
cd backend
fly launch
fly deploy
```

### 4. Heroku

**Step 1: Create Heroku App**
```bash
# Install Heroku CLI, then:
heroku create faredown-backend-api
```

**Step 2: Configure Environment**
```bash
heroku config:set DEBUG=false
heroku config:set ENVIRONMENT=production
heroku config:set SECRET_KEY=$(openssl rand -base64 32)
```

**Step 3: Deploy**
```bash
git subtree push --prefix=backend heroku main
```

## 🌐 Update Frontend Configuration

After deploying the backend, update your frontend:

### Environment Variable
```env
# .env.production
VITE_API_BASE_URL=https://your-backend-url.com
```

### Or use auto-detection (already implemented)
The frontend will automatically try to detect the backend URL.

## 🔧 Environment Configuration

### Required Environment Variables

```env
# Core Settings
DEBUG=false
ENVIRONMENT=production
SECRET_KEY=your-secure-secret-key

# Database (PostgreSQL for production)
DATABASE_URL=postgresql://user:password@host:port/database

# External APIs
AMADEUS_API_KEY=your-amadeus-key
BOOKING_COM_API_KEY=your-booking-key
OPENAI_API_KEY=your-openai-key

# CORS (Update with your frontend URL)
ALLOWED_ORIGINS=https://your-frontend-domain.com

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Optional Variables
```env
REDIS_URL=redis://localhost:6379
EXCHANGE_RATE_API_KEY=your-exchange-key
LOG_LEVEL=INFO
```

## 🗄️ Database Setup

### Development (SQLite)
Automatically created - no setup required.

### Production (PostgreSQL)

**Option 1: Render.com Database**
- Automatically provisioned with render.yaml
- Connection string provided via environment

**Option 2: External Database**
```bash
# Example with Supabase, Neon, or PlanetScale
DATABASE_URL=postgresql://user:password@host:port/database
```

**Option 3: Local PostgreSQL**
```bash
# Install PostgreSQL, then:
createdb faredown_db
psql faredown_db -c "CREATE USER faredown WITH PASSWORD 'password';"
psql faredown_db -c "GRANT ALL PRIVILEGES ON DATABASE faredown_db TO faredown;"
```

## 🧪 Testing Your Deployment

### 1. Health Check
```bash
curl https://your-backend-url.com/health
```

### 2. API Documentation
Visit: `https://your-backend-url.com/docs`

### 3. Frontend Testing
Use the Backend Test Dashboard in your frontend:
```
https://your-frontend-url.com/backend-test
```

## 🔐 Security Checklist

### ✅ Before Production
- [ ] Change default SECRET_KEY
- [ ] Use strong database passwords
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS/SSL
- [ ] Set DEBUG=false
- [ ] Review API rate limits
- [ ] Set up monitoring
- [ ] Configure backups

### 🛡️ Security Headers
```python
# Add to main.py if needed
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response
```

## 📊 Monitoring & Maintenance

### Health Monitoring
Set up monitoring for:
- `/health` endpoint
- Database connectivity
- API response times
- Error rates

### Logging
Configure structured logging:
```python
# In production, logs will show:
# - Request/response details
# - Error tracking
# - Performance metrics
# - Security events
```

### Backups
- **Database**: Daily automated backups
- **Files**: Regular code repository backups
- **Environment**: Secure environment variable storage

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   ```bash
   # Update ALLOWED_ORIGINS in environment
   ALLOWED_ORIGINS=https://your-frontend-url.com
   ```

2. **Database Connection**
   ```bash
   # Check DATABASE_URL format
   postgresql://username:password@host:port/database
   ```

3. **Port Issues**
   ```bash
   # Backend runs on port 8000 by default
   # Update if needed via PORT environment variable
   ```

4. **Module Import Errors**
   ```bash
   # Ensure all dependencies are installed
   pip install -r requirements.txt
   ```

### Debug Mode
For debugging, temporarily set:
```env
DEBUG=true
LOG_LEVEL=DEBUG
```

## 📈 Performance Optimization

### Production Settings
```env
# Recommended production settings
WORKERS=4
TIMEOUT=30
KEEPALIVE=2
MAX_REQUESTS=1000
```

### Database Optimization
- Enable connection pooling
- Set up read replicas for scaling
- Configure proper indexes

### Caching
- Redis for session storage
- API response caching
- Database query caching

## 🎯 Deployment Verification

After deployment, verify these endpoints work:

```bash
# Basic health check
curl https://your-backend-url.com/health

# API root
curl https://your-backend-url.com/

# Admin endpoints (with auth)
curl https://your-backend-url.com/api/admin/dashboard

# Public endpoints
curl https://your-backend-url.com/api/airlines/search
curl https://your-backend-url.com/api/hotels/search
```

## 🤝 Integration with Frontend

### Update Frontend API Base URL
1. **Environment Variable**:
   ```env
   VITE_API_BASE_URL=https://your-backend-url.com
   ```

2. **Auto-detection** (already implemented):
   Frontend will automatically detect backend URL

3. **Manual Configuration**:
   Update `client/lib/api.ts` if needed

### Test Integration
1. Visit frontend `/backend-test` page
2. Run comprehensive API tests
3. Verify all features work end-to-end

---

## 🎉 Success!

Your Faredown backend is now deployed and ready to power your travel booking platform!

### 📞 Support
- Backend API Documentation: `/docs`
- Health Check: `/health`
- Admin Dashboard: Frontend `/admin`

### 🔄 Continuous Deployment
Set up GitHub Actions or platform-specific CI/CD for automatic deployments on code changes.

**Happy Coding!** 🚀
