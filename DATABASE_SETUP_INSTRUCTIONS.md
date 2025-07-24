# 🗄️ Database Setup Instructions for Faredown

## Prerequisites
- Access to Render PostgreSQL database
- Database credentials provided by Zubin

## Database Information
- **External URL**: `postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db`
- **Internal URL**: `postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a/faredown_booking_db`
- **PSQL Command**: `render psql dpg-d2086mndiees739731t0-a`

---

## 🚀 Step-by-Step Setup Process

### **Step 1: Connect to Your Render Database**

**Option A: Using Render CLI (Recommended)**
```bash
# Install Render CLI if you haven't already
npm install -g @render/cli

# Login to your Render account
render login

# Connect to your PostgreSQL database
render psql dpg-d2086mndiees739731t0-a
```

**Option B: Using psql directly**
```bash
psql "postgresql://faredown_user:VFEkJ35EShYkok2OfgabKLRCKIluidqb@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db"
```

### **Step 2: Execute the Database Setup Script**

Once connected to your database, execute the complete setup script:

```sql
-- Copy and paste the entire content of setup-database.sql
-- OR execute it directly if you have file access:
\i setup-database.sql
```

### **Step 3: Verify Database Setup**

Check that all tables were created successfully:

```sql
-- List all tables
\dt

-- Check table counts
SELECT 'countries' as table_name, COUNT(*) as count FROM countries
UNION ALL
SELECT 'destinations', COUNT(*) FROM destinations
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL
SELECT 'hotel_bookings', COUNT(*) FROM hotel_bookings
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'vouchers', COUNT(*) FROM vouchers;
```

**Expected Results:**
- ✅ **countries**: 14 records (UAE, US, GB, FR, ES, IT, DE, IN, TH, SG, JP, AU, GR, TR)
- ✅ **destinations**: 40+ records (major international cities)
- ✅ **suppliers**: 4 records (hotelbeds, tbo, agoda, booking.com)
- ✅ **hotel_bookings**: 0 records (empty, ready for bookings)
- ✅ **payments**: 0 records (empty, ready for payments)
- ✅ **vouchers**: 0 records (empty, ready for vouchers)

### **Step 4: Test the Search Function**

Test the destination search functionality:

```sql
-- Test basic search
SELECT * FROM search_destinations('dubai', 10, false);

-- Test popular destinations only
SELECT * FROM search_destinations('', 10, true);

-- Test country search
SELECT * FROM search_destinations('spain', 5, false);
```

### **Step 5: Restart Your Application**

After database setup, restart your application to connect to the live database:

1. The app will automatically detect the populated database
2. You should see: `✅ Destinations database connected successfully`
3. The fallback mode message should disappear

---

## 📋 Database Schema Overview

### **Core Booking Tables**
- **`hotel_bookings`** - Main booking storage with guest details, pricing, status
- **`payments`** - Payment transactions with gateway integration (Razorpay, Stripe)
- **`vouchers`** - PDF voucher generation and email delivery tracking
- **`suppliers`** - API provider management (Hotelbeds, TBO, Agoda)
- **`users`** - Customer management (for future login system)
- **`booking_audit_log`** - Complete audit trail of all booking changes

### **Destinations & Cache Tables**
- **`countries`** - Master country data with flags, currencies, phone codes
- **`destinations`** - Cities, regions, landmarks with Hotelbeds codes
- **`hotels_cache`** - Cached hotel data from Hotelbeds API
- **`hotel_rooms_cache`** - Room availability and pricing cache
- **`destination_searches`** - Search popularity analytics

### **Key Features**
- 🔍 **Full-text search** on destinations with country and airport code matching
- 🏷️ **JSONB storage** for flexible guest details and payment information
- 📊 **Built-in analytics** with revenue tracking and booking summaries
- 🔄 **Auto-updating timestamps** with triggers
- 🚀 **Optimized indexes** for high-performance queries
- 🌍 **60+ international destinations** with airport codes and country flags

---

## 🔧 Troubleshooting

### **Connection Issues**
If you encounter connection problems:

1. **Check your IP whitelist** in Render dashboard
2. **Verify credentials** are correct
3. **Try the internal URL** if external fails
4. **Contact Render support** if connectivity persists

### **Permission Issues**
If you get permission errors:

```sql
-- Check current user permissions
\du

-- If needed, grant permissions (run as superuser)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO faredown_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO faredown_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO faredown_user;
```

### **Data Verification**
If some data is missing:

```sql
-- Re-insert countries if missing
INSERT INTO countries (code, name, iso3_code, continent, currency_code, phone_prefix, flag_emoji, popular) VALUES
('AE', 'United Arab Emirates', 'ARE', 'Asia', 'AED', '+971', '🇦🇪', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Re-insert destinations if missing
INSERT INTO destinations (hotelbeds_code, name, type, country_code, country_name, popular, search_priority, airport_codes) VALUES
('DXB', 'Dubai', 'city', 'AE', 'United Arab Emirates', TRUE, 10, ARRAY['DXB', 'DWC'])
ON CONFLICT (hotelbeds_code) DO NOTHING;
```

---

## ✅ Success Indicators

After successful setup, you should see:

1. **Application logs**: `✅ Destinations database connected successfully`
2. **Destination search**: Returns real data instead of fallback
3. **Admin panel**: Database health shows "Connected"
4. **Search functionality**: Instant results with country flags and airport codes
5. **Booking system**: Ready to accept and store real bookings

---

## 🚨 Important Notes

- ⚠️ **Backup first**: Always backup before running schema changes
- 🔒 **Secure credentials**: Never commit database credentials to code
- 📊 **Monitor performance**: Check query performance after setup
- 🔄 **Regular maintenance**: Clean expired cache entries periodically
- 📧 **Email setup**: Configure SMTP for voucher delivery

---

## 🎯 Next Steps

After database setup:

1. **Configure email service** for voucher delivery
2. **Set up Razorpay integration** for payments  
3. **Configure Hotelbeds API** for live hotel data
4. **Test complete booking flow** end-to-end
5. **Set up monitoring** and alerts for production

Your Faredown booking system is now ready for production use! 🎉
