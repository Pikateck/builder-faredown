# Fix 500 Error in Admin Panel - Complete Guide

## Problem

You're seeing a **500 Internal Server Error** when accessing the Admin Panel Markup Management at:

```
/admin/dashboard?module=markup-air
```

## Root Cause

The **`module_markups` table does not exist** in your PostgreSQL database. When the API tries to query this table, it fails and returns a 500 error.

## Solution (3 Options)

### **Option 1: Run the Table Creation Script (RECOMMENDED)**

This is the fastest way to fix the issue:

```bash
# Run from project root
node create-module-markups-table.js
```

This will:

- ✅ Create the `module_markups` table
- ✅ Create the `suppliers_master` table (dependency)
- ✅ Add indexes for performance
- ✅ Insert sample test data
- ✅ Verify everything works

**Expected output:**

```
🎉 SUCCESS - module_markups Table Ready!
✅ Admin Panel Markup Management will now work
✅ No more 500 errors when accessing /api/markups
```

---

### **Option 2: Run SQL Migration Manually in PgAdmin**

1. **Open PgAdmin** and connect to your database
2. **Run this SQL:**

```sql
-- Create suppliers_master table first
CREATE TABLE IF NOT EXISTS suppliers_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  api_type TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create module_markups table
CREATE TABLE IF NOT EXISTS module_markups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers_master(id) ON DELETE SET NULL,
  module TEXT NOT NULL,
  is_domestic BOOLEAN,
  cabin TEXT,
  airline_code TEXT,
  city_code TEXT,
  star_rating INT,
  hotel_chain TEXT,
  hotel_id TEXT,
  room_type TEXT,
  origin_city TEXT,
  dest_city TEXT,
  transfer_type TEXT,
  vehicle_type TEXT,
  experience_type TEXT,
  attraction_id TEXT,
  markup_type TEXT NOT NULL CHECK (markup_type IN ('PERCENT','FIXED')),
  markup_value NUMERIC(12,4) NOT NULL,
  fixed_currency CHAR(3) DEFAULT 'USD',
  bargain_min_pct NUMERIC(5,2),
  bargain_max_pct NUMERIC(5,2),
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_to TIMESTAMPTZ,
  status BOOLEAN NOT NULL DEFAULT TRUE,
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_module_markups_module ON module_markups(module);
CREATE INDEX IF NOT EXISTS idx_module_markups_status ON module_markups(status);
CREATE INDEX IF NOT EXISTS idx_module_markups_airline ON module_markups(airline_code);

-- Insert sample data
INSERT INTO module_markups (
  module, airline_code, cabin, markup_type, markup_value,
  bargain_min_pct, bargain_max_pct, status, created_by
) VALUES
  ('AIR', 'AI', 'ECONOMY', 'PERCENT', 15.0, 8.0, 15.0, true, 'admin'),
  ('AIR', 'EK', 'ECONOMY', 'PERCENT', 18.0, 10.0, 18.0, true, 'admin')
ON CONFLICT DO NOTHING;
```

3. **Verify** the table was created:

```sql
SELECT * FROM module_markups;
```

---

### **Option 3: Use Full Migration File**

If you want the complete schema with all features:

```bash
# Navigate to migrations directory
cd api/database/migrations

# Run the full migration
psql $DATABASE_URL -f 20251019_suppliers_master_spec.sql
```

---

## Verify the Fix

After running any of the options above, verify the fix:

### **1. Check Database in PgAdmin**

```sql
-- Should return TRUE
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'module_markups'
);

-- Should return some records
SELECT module, COUNT(*) as count
FROM module_markups
GROUP BY module;
```

### **2. Test API Endpoint**

```bash
# Get a valid token first (login to admin panel)
TOKEN="your_jwt_token_here"

# Test the endpoint
curl -H "Authorization: Bearer $TOKEN" \
     "https://builder-faredown-pricing.onrender.com/api/markups?module=air"
```

**Expected response:**

```json
{
  "success": true,
  "items": [...],
  "total": 4,
  "page": 1,
  "pageSize": 20
}
```

### **3. Access Admin Panel**

1. Go to: `https://your-app.fly.dev/admin/dashboard?module=markup-air`
2. Login with admin credentials
3. **Should see**: Markup List with data (no 500 error!)

---

## What Was Fixed

### **Backend Changes:**

1. **Added table existence check** (`api/routes/markups-unified.js`)
   - Now returns helpful error message instead of cryptic 500
   - Tells you exactly what migration to run

2. **Better error handling**
   - All CRUD operations have proper try-catch
   - Error messages include helpful troubleshooting info

3. **Database initialization**
   - Checks if database is connected before queries
   - Auto-initializes connection if needed

### **Table Created:**

- **`module_markups`** - Stores all markup rules for Air, Hotel, Transfers, etc.
- **`suppliers_master`** - Stores supplier information (TBO, Amadeus, etc.)

### **Features Enabled:**

- ✅ **Create** markups in admin panel
- ✅ **Read** markups from database
- ✅ **Update** markups via admin UI
- ✅ **Delete** markups
- ✅ **Full sync** between Admin Panel ↔ PgAdmin

---

## Common Errors After Fix

### **Still seeing 500?**

**Check server logs:**

```bash
# On Render, check logs
# Or run locally:
npm run dev
```

**Look for:**

- Database connection errors
- Permission errors
- Missing environment variables

### **403 Forbidden Error?**

This means authentication issue:

1. Log out and log back in
2. Get fresh JWT token
3. Check `ADMIN_API_KEY` is set in environment

### **Empty data but no error?**

This is normal! It means:

- ✅ Connection works
- ✅ Table exists
- ⚠️ No data yet (create your first markup)

---

## Testing the Complete Flow

### **1. Create a Markup in Admin Panel**

1. Go to **Markup Management (Air)**
2. Click **"Create Markup"**
3. Fill in form:
   - Airline: `AI` (Air India)
   - Class: `Economy`
   - Markup Type: `Percentage`
   - Markup Value: `15`
   - Bargain Min: `8`
   - Bargain Max: `15`
4. Click **Save**

### **2. Verify in PgAdmin**

```sql
SELECT * FROM module_markups
WHERE airline_code = 'AI'
ORDER BY created_at DESC
LIMIT 1;
```

**Should show:** Your newly created markup

### **3. Update in PgAdmin**

```sql
UPDATE module_markups
SET markup_value = 18.0
WHERE airline_code = 'AI' AND cabin = 'ECONOMY';
```

### **4. Refresh Admin Panel**

**Should see:** Updated markup value (18.0 instead of 15.0)

---

## Files Changed

1. `api/routes/markups-unified.js` - Added table existence check
2. `create-module-markups-table.js` - New migration script
3. `FIX_500_ERROR_ADMIN_PANEL.md` - This guide

---

## Support

If you still see 500 errors after following this guide:

1. **Check database connection:**

   ```bash
   node quick-db-test.js
   ```

2. **Verify environment variables:**

   ```bash
   echo $DATABASE_URL
   ```

3. **Check server logs** for specific error messages

4. **Restart the server** to apply changes

---

## Success Checklist

- [ ] `module_markups` table exists in PostgreSQL
- [ ] Sample data inserted successfully
- [ ] Admin Panel loads without 500 error
- [ ] Can create new markup in admin panel
- [ ] New markup appears in PgAdmin
- [ ] Can edit markup in PgAdmin
- [ ] Edit shows up in admin panel
- [ ] Can delete markup from admin panel
- [ ] Deletion reflects in PgAdmin

When all checkboxes are ✅, your system is fully operational!
