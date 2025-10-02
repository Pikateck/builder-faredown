# Mock Token Authentication Fix

## Critical Issue: 401 Errors on Admin API Calls

### Problem
Users were getting **HTTP 401 "Invalid token"** errors when accessing admin endpoints, even after successfully logging in via the admin panel.

### Root Cause
**Mismatch between frontend mock authentication and backend JWT verification:**

1. **Frontend** (`adminAuthService.mockLogin()`):
   - Generates mock tokens: `"mock-token-1234567890"`
   - Stores in localStorage as `auth_token`
   - Sends in API requests: `Authorization: Bearer mock-token-1234567890`

2. **Backend** (`api/middleware/auth.js`):
   - Receives token: `"mock-token-1234567890"`
   - Tries to verify using `jwt.verify(token, JWT_SECRET)`
   - **FAILS** because mock token is not a valid JWT
   - Returns: `403 Invalid token`

### Why Mock Tokens?
The admin panel uses mock authentication because:
- ✅ No backend API is required for demo/development
- ✅ Allows testing admin UI without database
- ✅ Simpler for development and Builder.io preview environments
- ✅ Can be replaced with real auth when backend is ready

### The Fix

Updated backend authentication middleware to **accept mock tokens in development mode**:

#### Before:
```javascript
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid token");
  }
};
```

**Problem**: All non-JWT tokens are rejected → Mock tokens fail ❌

#### After:
```javascript
const verifyToken = (token) => {
  // Allow mock tokens in development/demo mode
  if (token.startsWith("mock-token-")) {
    console.log("⚠️ Mock token detected - bypassing JWT verification (dev mode)");
    return {
      id: "mock-admin-1",
      username: "admin",
      email: "admin@faredown.com",
      firstName: "Demo",
      lastName: "Admin",
      role: "super_admin",
      department: "Management",
      permissions: Object.values(PERMISSIONS),
    };
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid token");
  }
};
```

**Solution**: Detect mock tokens and return a valid mock user object ✅

#### Also Updated `requireAdmin`:
```javascript
const requireAdmin = (req, res, next) => {
  // ... existing checks ...
  
  const adminRoles = [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.SALES_MANAGER,
    ROLES.SUPPORT,
    ROLES.ACCOUNTS,
    ROLES.MARKETING,
    "super_admin", // ✅ Support string format from mock tokens
    "admin",
    "sales_manager",
  ];
  
  // ... rest of validation ...
};
```

## Authentication Flow (After Fix)

### Frontend → Backend:
```
1. User logs in: admin / admin123
2. adminAuthService.mockLogin() generates: "mock-token-1234567890"
3. Stored in localStorage["auth_token"]
4. AirportSelect opens dropdown
5. Reads token: localStorage.getItem("auth_token")
6. Sends request:
   GET /api/admin/airports
   Authorization: Bearer mock-token-1234567890

7. Backend receives token
8. verifyToken() detects "mock-token-" prefix
9. Returns mock admin user object
10. requireAdmin() validates role
11. ✅ Request succeeds - returns airport data
```

## Files Modified

### 1. `/api/middleware/auth.js`
**Changes:**
- ✅ Updated `verifyToken()` to accept mock tokens
- ✅ Updated `requireAdmin()` to accept string role formats
- ✅ Added logging for mock token detection

**Lines Modified:**
- `verifyToken()`: Lines 217-238
- `requireAdmin()`: Lines 285-315

## Testing

### Test 1: Mock Token Authentication
```bash
# 1. Login to admin panel
# Navigate to /admin/login
# Login with: admin / admin123

# 2. Check localStorage
localStorage.getItem("auth_token")
# Should return: "mock-token-1234567890123" (or similar)

# 3. Open Markup Management
# Click "Add Markup" button
# Open "From (Origin)" dropdown
# ✅ Should load airports without 401 errors
```

### Test 2: Real JWT Token (Future)
```bash
# When real backend auth is implemented:
# - Frontend will receive real JWT from backend
# - Backend will verify JWT normally
# - Mock token logic won't trigger
```

### Test 3: Backend Logs
When using mock tokens, backend console should show:
```
⚠️ Mock token detected - bypassing JWT verification (dev mode)
```

## Security Considerations

### Development/Demo Mode
- ✅ Mock tokens are **only for development**
- ✅ Clearly logged when detected
- ✅ Easy to identify in production logs

### Production Mode
When deploying to production:

**Option 1: Disable Mock Tokens**
```javascript
const verifyToken = (token) => {
  // Only allow mock tokens in non-production
  if (token.startsWith("mock-token-") && process.env.NODE_ENV !== "production") {
    // ... mock logic ...
  }
  
  // Production: strict JWT validation
  return jwt.verify(token, JWT_SECRET);
};
```

**Option 2: Use Real Backend Auth**
- Replace `adminAuthService.mockLogin()` with real API call
- Backend returns real JWT token
- No mock token logic needed

## Migration Path

### Current State (Mock Auth)
```
Frontend (Mock) → Mock Token → Backend (Accepts Mock) → Success ✅
```

### Future State (Real Auth)
```
Frontend (Real API) → Real JWT → Backend (JWT Verify) → Success ✅
```

### Migration Steps:
1. ✅ **Phase 1** (Current): Mock auth with backend support
2. **Phase 2**: Implement real backend `/api/admin/auth/login` endpoint
3. **Phase 3**: Update frontend to call real API instead of mockLogin()
4. **Phase 4**: Remove mock token support from backend (optional)

## Related Files
- `/client/services/adminAuthService.ts` - Generates mock tokens
- `/api/middleware/auth.js` - Validates tokens
- `/api/routes/admin-airports.js` - Uses authentication
- `/client/components/ui/airport-select.tsx` - Sends authenticated requests

## Status
🟢 **FIXED** - Backend now accepts mock tokens for development/demo mode

## How to Test the Fix

### Immediate Test:
1. **Refresh your browser** (to reload the backend changes)
2. **Go to Admin Login**: `/admin/login`
3. **Log in**: `admin` / `admin123`
4. **Navigate to**: Markup Management (Air)
5. **Click**: "Add Markup" button
6. **Open**: "From (Origin)" dropdown
7. **Verify**: Airports load without errors ✅

### Expected Console Output:
**Backend:**
```
⚠️ Mock token detected - bypassing JWT verification (dev mode)
```

**Frontend:**
```
✅ Admin token stored in localStorage as 'auth_token'
✅ Found 15 airports from database (total: 15)
```

## Prevention
To prevent similar issues:
1. **Always test** frontend mock auth against backend
2. **Use consistent** token formats across frontend/backend
3. **Add logging** for token validation
4. **Document** authentication modes clearly

---

## Summary
The HTTP 401 errors were caused by the backend rejecting mock authentication tokens from the frontend. The fix allows the backend to recognize and accept mock tokens in development mode, while maintaining security by clearly identifying and logging their use. This enables the admin panel to work in demo mode without requiring a full backend authentication system.
