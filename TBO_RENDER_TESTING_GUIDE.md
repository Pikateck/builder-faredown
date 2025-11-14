# Running TBO Test on Render

## Why Render?

The TBO API **requires all requests to come from a whitelisted IP address**. We use the Fixie proxy service which provides a static IP that TBO has whitelisted.

**Problem**: Your local machine **cannot** access the Fixie proxy (connection times out)

**Solution**: Run the test on Render where the Fixie proxy is accessible

---

## Option 1: SSH into Render (Recommended)

### Step 1: Get Render Service ID

1. Go to your Render dashboard: https://dashboard.render.com
2. Find your `builder-faredown-pricing` service
3. Copy the Service ID (looks like: `srv-xxxxxxxxxxxxx`)

### Step 2: SSH into Render

```bash
# SSH into your Render instance
render ssh srv-YOUR-SERVICE-ID
```

### Step 3: Navigate to Project

```bash
cd /opt/render/project/src
```

### Step 4: Run the Test

```bash
node test-tbo-full-booking-flow.js
```

### Step 5: Get Results

The test will create `tbo-full-booking-flow-results.json` in the same directory.

To view it:

```bash
cat tbo-full-booking-flow-results.json
```

To download it:

```bash
# Copy the JSON output and paste it into a local file
# or use Render's shell to view it in chunks
```

---

## Option 2: Add Test Endpoint to API

Create an endpoint that runs the test and returns results:

### Create Test Route

**File**: `api/routes/tbo/test.js`

```javascript
const express = require("express");
const router = express.Router();
const { runCompleteFlow } = require("../../../test-tbo-full-booking-flow");

/**
 * GET /api/tbo/test/full-flow
 * Runs complete booking flow test
 *
 * ⚠️ WARNING: This will create a real booking!
 * Only use in staging/test environment
 */
router.get("/full-flow", async (req, res) => {
  try {
    const results = await runCompleteFlow();
    res.json(results);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
});

module.exports = router;
```

### Add to server.js

```javascript
// Add with other TBO routes
const tboTestRoutes = require("./routes/tbo/test.js");
app.use("/api/tbo/test", tboTestRoutes);
```

### Deploy and Test

```bash
# Deploy to Render (push to main)
git add .
git commit -m "Add TBO test endpoint"
git push origin main

# Wait for Render to deploy

# Then call the endpoint
curl https://builder-faredown-pricing.onrender.com/api/tbo/test/full-flow > tbo-results.json
```

---

## Option 3: Render Shell (Web Console)

Render also provides a web-based shell:

1. Go to https://dashboard.render.com
2. Select your `builder-faredown-pricing` service
3. Click **Shell** tab
4. Run:
   ```bash
   cd /opt/render/project/src
   node test-tbo-full-booking-flow.js
   cat tbo-full-booking-flow-results.json
   ```

---

## Option 4: Local Testing (Limited)

You can test the request structure locally without proxy:

```bash
USE_SUPPLIER_PROXY=false node test-tbo-full-booking-flow.js
```

**Expected Result**: Authentication will fail with TBO error (not whitelisted IP)

**Use Case**: Verify request payload structure is correct

---

## Environment Variables on Render

Ensure these are set in your Render environment:

```bash
# TBO Credentials
TBO_CLIENT_ID=tboprod
TBO_HOTEL_USER_ID=BOMF145
TBO_HOTEL_PASSWORD=@Bo#4M-Api@
TBO_END_USER_IP=52.5.155.132

# Proxy (CRITICAL)
USE_SUPPLIER_PROXY=true
FIXIE_URL=http://fixie:GseepY8oA3SemkD@criterium.usefixie.com:80

# All TBO endpoints (should be set)
TBO_AUTH_URL=https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc/rest/Authenticate
TBO_HOTEL_SEARCH_URL=https://hotelbooking.travelboutiqueonline.com/HotelAPI_V10/HotelService.svc/rest/GetHotelResult
# ... (rest of endpoints)
```

---

## Troubleshooting

### SSH Connection Refused

**Error**: `Connection refused` or `Permission denied`

**Solution**:

- Verify you're using the correct Service ID
- Ensure you're logged into Render CLI: `render login`

### Test Times Out on Render

**Possible Causes**:

1. Fixie proxy not configured
2. Environment variables not set
3. TBO API is down

**Check**:

```bash
# Verify proxy config
echo $USE_SUPPLIER_PROXY
echo $FIXIE_URL

# Test basic connectivity
curl -I https://api.travelboutiqueonline.com
```

### Results File Not Created

**Cause**: Test crashed before completion

**Solution**: Check the error output, test might have failed at an earlier step

---

## Expected Success Output

When the test succeeds on Render, you should see:

```
Starting TBO Complete Hotel Booking Flow Test...

================================================================================
STEP 1: Authentication - Get TokenId
================================================================================
✅ SUCCESS: TokenId obtained: [TOKEN]...

================================================================================
STEP 2: Get Static Data - Retrieve Real CityId for Dubai
================================================================================
✅ SUCCESS: Real CityId retrieved: 130443

[... all 8 steps ...]

================================================================================
COMPLETE BOOKING FLOW SUMMARY
================================================================================

✅ All steps completed successfully!

📄 Results saved to: tbo-full-booking-flow-results.json

🎉 COMPLETE BOOKING FLOW TEST PASSED! 🎉
```

---

## Next Steps After Success

1. Download `tbo-full-booking-flow-results.json` from Render
2. Share it for validation
3. Verify all 8 steps completed
4. Check booking confirmation and voucher URL

---

## Quick Commands Reference

```bash
# SSH into Render
render ssh srv-YOUR-SERVICE-ID

# Navigate to project
cd /opt/render/project/src

# Run test
node test-tbo-full-booking-flow.js

# View results
cat tbo-full-booking-flow-results.json | jq .

# Exit SSH
exit
```

---

**Recommended**: Use **Option 1 (SSH)** - it's the most straightforward way to run the test and get results.
