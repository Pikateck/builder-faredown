# Admin Panel ↔ PostgreSQL Database Sync - COMPLETE FIX

## Problem Summary

The Admin Panel Markup Management was **NOT syncing** with PgAdmin database because:

1. **Wrong API endpoint**: Frontend called `/api/markups` but needed module-based queries
2. **Missing CRUD operations**: `/api/markups` only had `/list` and `/export`, no create/update/delete
3. **Table mismatch**: Frontend expected `module_markups` table but route used `unified_markups`
4. **Field mapping mismatch**: Database schema didn't match frontend data model
5. **Authentication issues**: 403 errors due to missing/expired JWT tokens

## Complete Solution

### 1. Backend API Routes Fixed (`api/routes/markups-unified.js`)

#### **Added Complete CRUD Endpoints:**

```javascript
// ✅ GET /api/markups?module=air
// - Queries module_markups table
// - Supports filtering by module, supplier_id, search, status
// - Returns paginated results with items array

// ✅ POST /api/markups
// - Creates new markup in module_markups table
// - Maps all fields correctly

// ✅ PUT /api/markups/:id
// - Updates existing markup
// - Returns updated record

// ✅ DELETE /api/markups/:id
// - Deletes markup
// - Returns deleted record

// ✅ GET /api/markups/export?module=air
// - Exports markups as CSV
// - Supports module filtering
```

### 2. Database Connection

**Connection String**: Uses `DATABASE_URL` environment variable

```
postgresql://faredown_user:***@dpg-d2086mndiees739731t0-a.singapore-postgres.render.com/faredown_booking_db
```

**Primary Table**: `module_markups`

**Schema** (from `api/database/migrations/20251019_suppliers_master_spec.sql`):

```sql
CREATE TABLE module_markups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers_master(id),
  module TEXT NOT NULL,              -- 'AIR', 'HOTEL', etc.
  airline_code TEXT,                 -- For air markups
  cabin TEXT,                        -- ECONOMY, BUSINESS, FIRST
  city_code TEXT,                    -- For hotel markups
  star_rating INT,                   -- For hotel markups
  markup_type TEXT NOT NULL,         -- 'PERCENT' or 'FIXED'
  markup_value NUMERIC(12,4) NOT NULL,
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
```

### 3. Frontend Service Updated (`client/services/markupService.ts`)

#### **Field Mapping (Frontend → Database):**

| Frontend Field   | Database Column                         |
| ---------------- | --------------------------------------- |
| `name`           | Generated from `airline_code` + `cabin` |
| `airline`        | `airline_code`                          |
| `class`          | `cabin` (uppercased)                    |
| `markupType`     | `markup_type` ('PERCENT' or 'FIXED')    |
| `markupValue`    | `markup_value`                          |
| `bargainFareMin` | `bargain_min_pct`                       |
| `bargainFareMax` | `bargain_max_pct`                       |
| `validFrom`      | `valid_from`                            |
| `validTo`        | `valid_to`                              |
| `status`         | `status` (boolean)                      |

#### **Updated Functions:**

- ✅ `createAirMarkup()` - Maps to module_markups schema
- ✅ `updateAirMarkup()` - Maps to module_markups schema
- ✅ `mapAirRow()` - Correctly parses database rows

### 4. Data Flow (Complete)

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERACTION                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Admin Panel UI (client/pages/admin/MarkupManagementAir.tsx)│
│  - Create/Edit/Delete markup                                 │
│  - View markup list                                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────��──────────────────────────────┐
│  Markup Service (client/services/markupService.ts)           │
│  - Transforms UI data to API format                          │
│  - Calls: GET/POST/PUT/DELETE /api/markups                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  API Client (client/lib/api.ts)                              │
│  - Adds Authorization: Bearer <token>                        │
│  - Adds X-Admin-Key header                                   │
│  - Sends to: https://builder-faredown-pricing.onrender.com   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────���───────────────────────────────────┐
│  Backend Routes (api/routes/markups-unified.js)              │
│  - Validates authentication                                  │
│  - Parses query parameters                                   │
│  - Executes SQL queries                                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Database Connection (api/database/connection.js)            │
│  - Uses pg.Pool with DATABASE_URL                            │
│  - SSL enabled (required for Render PostgreSQL)              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  PostgreSQL Database (Render)                                │
│  - Table: module_markups                                     │
│  - Visible in PgAdmin                                        │
└─────────────────────────────────────────────────────────────┘
```

## Testing the Fix

### 1. Verify Database Connection

Check in PgAdmin:

```sql
-- See all air markups
SELECT * FROM module_markups WHERE module = 'AIR';

-- Count total markups
SELECT module, COUNT(*) as count
FROM module_markups
GROUP BY module;
```

### 2. Test Admin Panel

1. **Login to Admin Panel**
   - Ensure you have a valid JWT token
   - Token stored in localStorage as `auth_token`

2. **Navigate to Markup Management (Air)**
   - Should load existing markups from database
   - No 403 errors

3. **Create New Markup**
   - Click "Create Markup"
   - Fill in form
   - Submit
   - **Verify**: Check PgAdmin - new row should appear in `module_markups`

4. **Edit Existing Markup**
   - Click edit on any markup
   - Change values
   - Submit
   - **Verify**: Check PgAdmin - row should be updated

5. **Delete Markup**
   - Click delete
   - Confirm
   - **Verify**: Check PgAdmin - row should be deleted

### 3. Test API Directly

```bash
# Get auth token first
TOKEN="your_jwt_token_here"

# List air markups
curl -H "Authorization: Bearer $TOKEN" \
     "https://builder-faredown-pricing.onrender.com/api/markups?module=air&page=1&limit=10"

# Create markup
curl -X POST \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "module": "AIR",
       "airline_code": "AI",
       "cabin": "ECONOMY",
       "markup_type": "PERCENT",
       "markup_value": 15.5,
       "bargain_min_pct": 8,
       "bargain_max_pct": 15,
       "status": true
     }' \
     "https://builder-faredown-pricing.onrender.com/api/markups"

# Update markup
curl -X PUT \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "markup_value": 18.0,
       "updated_by": "admin"
     }' \
     "https://builder-faredown-pricing.onrender.com/api/markups/{markup_id}"
```

## Files Modified

1. **`api/routes/markups-unified.js`**
   - Added GET / endpoint with module filtering
   - Added POST / endpoint for creating markups
   - Added PUT /:id endpoint for updating markups
   - Added DELETE /:id endpoint for deleting markups
   - Updated export endpoint to support module filtering
   - Connected to module_markups table via db connection

2. **`client/services/markupService.ts`**
   - Updated `createAirMarkup()` to map to module_markups schema
   - Updated `updateAirMarkup()` to map to module_markups schema
   - Fixed `mapAirRow()` to correctly parse database columns

## Authentication Requirements

The `/api/markups` endpoint requires:

1. **JWT Token**: Valid user authentication token
   - Set in `Authorization: Bearer <token>` header
   - Token stored in localStorage as `auth_token`

2. **Admin Role**: User must have admin role
   - Validated by `authenticateToken` middleware
   - Returns 403 if not admin

3. **Admin API Key** (optional): For admin-specific routes
   - Set in `X-Admin-Key` header
   - Value from `VITE_ADMIN_API_KEY` environment variable

## Troubleshooting

### Issue: 403 Forbidden Errors

**Cause**: Invalid or expired JWT token

**Solution**:

1. Log out and log back in to get fresh token
2. Check token in browser localStorage
3. Verify `auth_token` exists and is valid

### Issue: Empty Data in Admin Panel

**Cause**: No records in database OR wrong module filter

**Solution**:

1. Check PgAdmin: `SELECT * FROM module_markups WHERE module = 'AIR'`
2. If empty, create test data manually
3. Verify module name is uppercase (AIR not air)

### Issue: Changes Not Appearing in PgAdmin

**Cause**: Caching OR using wrong table

**Solution**:

1. Refresh PgAdmin query
2. Verify you're querying `module_markups` not `unified_markups`
3. Check created_at timestamp to see if record is new

### Issue: Fields Not Saving

**Cause**: Field mapping mismatch

**Solution**:

1. Check browser console for errors
2. Verify payload structure matches module_markups schema
3. Check database column names match exactly

## Summary

✅ **Admin Panel → Database**: CREATE, UPDATE, DELETE all write to `module_markups`  
✅ **Database → Admin Panel**: GET queries read from `module_markups`  
✅ **Bidirectional Sync**: Changes in either direction reflect immediately  
✅ **Complete CRUD**: All operations supported (Create, Read, Update, Delete)  
✅ **Proper Authentication**: JWT tokens validated on all requests

The system is now **fully connected** and **bidirectional**. Any changes made in the admin panel will immediately reflect in PgAdmin, and vice versa.
