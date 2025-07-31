# Complete End-to-End Deployment Guide

## 🚀 Complete Platform Setup on Render

This guide will help you deploy a fully working end-to-end booking platform with live data, admin dashboard, and Hotelbeds integration.

## 📋 Prerequisites

- GitHub account with your code repository
- Render account (free tier works)
- PostgreSQL database (already set up)
- Hotelbeds API credentials (test environment)

## 🗄️ Database Setup (Already Done ✅)

Your PostgreSQL database is already configured:
- **Host**: dpg-d2086mndiees739731t0-a.singapore-postgres.render.com
- **Database**: faredown_booking_db
- **User**: faredown_user
- **Connection String**: postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db

## 🎯 Step 1: Deploy Backend API to Render

### 1.1 Create Web Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Use these settings:

```yaml
Name: faredown-api
Environment: Node
Region: Singapore (closest to your database)
Branch: main
Root Directory: api
Build Command: npm install
Start Command: npm start
Plan: Free
```

### 1.2 Environment Variables
Add these environment variables:

```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db
JWT_SECRET=your-generated-jwt-secret
HOTELBEDS_API_KEY=91d2368789abdb5beec101ce95a9d185
HOTELBEDS_SECRET=a9ffaaecce
HOTELBEDS_CONTENT_API=https://api.test.hotelbeds.com/hotel-content-api/1.0/
HOTELBEDS_BOOKING_API=https://api.test.hotelbeds.com/hotel-api/1.0/
SENDGRID_API_KEY=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
RAZORPAY_KEY_ID=rzp_test_XkiZskS8iGKFKi
CORS_ORIGIN=https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev
ENABLE_BARGAIN_ENGINE=true
ENABLE_AI_PRICING=true
ENABLE_REAL_TIME_UPDATES=true
```

### 1.3 Health Check
Your backend will be available at: `https://faredown-api.onrender.com`
Test it: `https://faredown-api.onrender.com/health`

## 🎯 Step 2: Update Frontend Configuration

### 2.1 Update API Base URL
Create `.env` file in your project root:

```bash
VITE_API_BASE_URL=https://faredown-api.onrender.com
```

### 2.2 Update CORS Settings
Update your frontend deployment environment variables:

```bash
VITE_API_BASE_URL=https://faredown-api.onrender.com
VITE_ENVIRONMENT=production
```

## 🎯 Step 3: Database Schema Setup

Run these SQL commands to set up your database tables:

```sql
-- Connect using psql:
PGPASSWORD=VFEkJ35EShYkok2OfgabKLRCKIluidqb psql -h dpg-d2086mndiees739731t0-a.singapore-postgres.render.com -U faredown_user faredown_booking_db

-- Create hotel bookings table
CREATE TABLE IF NOT EXISTS hotel_bookings (
    id SERIAL PRIMARY KEY,
    booking_reference VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    hotel_code VARCHAR(50),
    hotel_name VARCHAR(255),
    destination_code VARCHAR(10),
    destination_name VARCHAR(255),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    room_type VARCHAR(255),
    guests INTEGER DEFAULT 2,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending',
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50),
    supplier VARCHAR(50) DEFAULT 'hotelbeds',
    booking_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    role VARCHAR(20) DEFAULT 'customer',
    is_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create admin user
INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified) 
VALUES ('admin@faredown.com', '$2a$12$encrypted_password_here', 'Admin', 'User', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON hotel_bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON hotel_bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON hotel_bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON hotel_bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

## 🎯 Step 4: Admin Dashboard Features

Your admin dashboard will now have access to:

### 4.1 Live Statistics
- Total bookings, revenue, users
- Real-time booking activity
- Popular destinations
- Performance metrics

### 4.2 Booking Management
- View all bookings with filters
- Search by customer name/email
- Export booking data (CSV/JSON)
- Booking status management

### 4.3 Analytics
- Revenue trends (7d, 30d, 3m, 1y)
- Destination performance
- Customer insights
- Booking conversion rates

### 4.4 Access URLs
- Admin Dashboard: `https://your-frontend-url/admin`
- API Health: `https://faredown-api.onrender.com/health`
- Admin Stats: `https://faredown-api.onrender.com/api/admin-dashboard/stats`

## 🎯 Step 5: Live Hotel Images

Your hotel gallery now supports:

### 5.1 Hotelbeds Live Images
- High-resolution gallery images
- Multiple image categories (rooms, facilities, exterior)
- Automatic fallback to sample images
- Mobile-optimized gallery grid

### 5.2 Image Features
- Progressive loading
- Error handling with fallbacks
- Category-based filtering
- Hover effects and descriptions
- Lightbox-ready (expandable)

### 5.3 Image Quality Options
- **High-res**: 1200x800 for gallery viewing
- **Standard**: 600x400 for general use
- **Thumbnails**: 300x200 for previews

## 🎯 Step 6: Testing Your Platform

### 6.1 Backend Tests
```bash
# Test API health
curl https://faredown-api.onrender.com/health

# Test hotel search
curl "https://faredown-api.onrender.com/api/hotels-live/search?destination=DXB&checkIn=2025-03-15&checkOut=2025-03-18"

# Test admin stats (requires auth)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" https://faredown-api.onrender.com/api/admin-dashboard/stats
```

### 6.2 Frontend Tests
1. Visit your frontend URL
2. Search for hotels (Dubai, Bangkok, etc.)
3. View hotel details with live images
4. Test booking flow
5. Access admin dashboard

### 6.3 Database Tests
```sql
-- Check bookings table
SELECT COUNT(*) FROM hotel_bookings;

-- Check recent bookings
SELECT booking_reference, customer_name, hotel_name, total_amount, status, created_at 
FROM hotel_bookings 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🎯 Step 7: Go Live Checklist

### 7.1 Production Readiness
- [ ] Backend deployed to Render
- [ ] Database schema created
- [ ] Environment variables configured
- [ ] CORS properly set up
- [ ] Health checks passing
- [ ] Admin access working

### 7.2 Hotelbeds Integration
- [ ] Test API credentials working
- [ ] Hotel search returning results
- [ ] Live images loading
- [ ] Booking flow functional
- [ ] Error handling working

### 7.3 Admin Dashboard
- [ ] Admin login working
- [ ] Live statistics displaying
- [ ] Booking management functional
- [ ] Data export working
- [ ] Analytics charts showing

## 🎯 Step 8: Monitoring & Maintenance

### 8.1 Application Monitoring
- Monitor Render service logs
- Set up uptime monitoring
- Track API response times
- Monitor database performance

### 8.2 Database Maintenance
```sql
-- Regular cleanup of old test bookings
DELETE FROM hotel_bookings WHERE status = 'cancelled' AND created_at < NOW() - INTERVAL '90 days';

-- Update statistics
ANALYZE hotel_bookings;
ANALYZE users;
```

### 8.3 API Limits & Usage
- Monitor Hotelbeds API usage
- Track rate limits
- Implement caching strategies
- Monitor error rates

## 🚨 Troubleshooting

### Common Issues:

1. **CORS Errors**: Update CORS_ORIGIN in backend env vars
2. **Database Connection**: Check DATABASE_URL format
3. **API Timeout**: Increase timeout settings
4. **Image Loading**: Check Hotelbeds image URLs
5. **Admin Access**: Verify JWT secret and admin user

### Support Resources:
- Render docs: https://render.com/docs
- PostgreSQL docs: https://www.postgresql.org/docs/
- Hotelbeds API docs: https://developer.hotelbeds.com/

## 🎉 Success!

Your complete end-to-end booking platform is now live with:
✅ Live hotel data from Hotelbeds API
✅ Real-time admin dashboard
✅ PostgreSQL database integration
✅ Production-ready deployment
✅ Live hotel image galleries
✅ Complete booking flow

**Next Steps:**
1. Test all functionality thoroughly
2. Set up monitoring and alerts
3. Plan for production Hotelbeds credentials
4. Configure custom domain
5. Implement SSL certificates
6. Set up automated backups
