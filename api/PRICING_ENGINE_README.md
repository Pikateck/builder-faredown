# Faredown Pricing Engine

The **Faredown Pricing Engine** is a centralized pricing system that handles all fare calculations, markups, discounts, and taxes across the Faredown travel platform.

## 🚀 Features

- **Dynamic Pricing Engine**: Base fare calculations with configurable markup rules
- **Discount & Offer Layer**: Rule-based discount engine with promo codes and seasonal offers
- **Admin Configuration**: Database-driven configuration for margins, commissions, and tax policies
- **API Integration**: Clean JSON endpoints for real-time pricing calculations
- **Audit & Logging**: Complete price tracking across the user journey
- **Price Echo System**: Automatic price consistency monitoring

## 📂 Architecture

```
api/
├── services/pricing/
│   └── PricingEngine.js          # Core pricing logic
├── routes/
│   └── pricing.js                # API endpoints
├── middleware/
│   └── priceEcho.js             # Price consistency tracking
├── database/migrations/
│   └── V2025_09_06_pricing_engine.sql  # Database schema
└── tests/
    ├── pricing.engine.test.js    # Unit tests
    ├── pricing.api.test.js       # Integration tests
    └── jest.config.js           # Test configuration
```

## 🛠️ Setup

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Run Database Migration

```bash
npm run migrate:pricing
```

This will create:

- `markup_rules` - Pricing rules by route/airline/class
- `promo_codes` - Discount codes
- `tax_policies` - Tax calculation rules
- `price_checkpoints` - Price tracking logs

### 3. Start the Pricing Server

```bash
npm run start:pricing
```

The server will start on port 3001 with endpoints at `/api/pricing/*`

### 4. Run Tests

```bash
# Run all pricing tests
npm run test:pricing

# Run tests in watch mode
npm run test:pricing:watch
```

## 📡 API Endpoints

### POST `/api/pricing/quote`

Calculate pricing with all markups, discounts, and taxes.

**Request Body:**

```json
{
  "module": "air",
  "origin": "BOM",
  "destination": "JFK",
  "serviceClass": "Y",
  "airlineCode": "AI",
  "currency": "USD",
  "baseFare": 512.35,
  "userType": "b2c",
  "debug": true,
  "extras": {
    "promoCode": "WELCOME10",
    "pax": 1
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "baseFare": 512.35,
    "markup": 41.00,
    "discount": 55.34,
    "tax": 59.88,
    "totalFare": 557.89,
    "currency": "USD",
    "breakdown": {
      "steps": [...]
    }
  }
}
```

### GET `/api/pricing/rules/preview`

Preview which markup rule would match given parameters.

```
GET /api/pricing/rules/preview?module=air&origin=BOM&destination=JFK&serviceClass=Y
```

### GET `/api/pricing/diff`

Get price difference analysis for a journey.

```
GET /api/pricing/diff?journeyId=abc-123-def
```

### GET `/api/pricing/health`

Health check endpoint for monitoring.

## 🎯 Frontend Integration

### Journey Tracking

```typescript
import { getJourneyId, JOURNEY_STEPS } from "@/utils/journey";
import { pricingApi } from "@/utils/pricingApi";

// Start new journey on search
const journeyId = startNewJourney();

// Use throughout the booking flow
const pricing = await pricingApi.searchResults({
  module: "air",
  baseFare: supplierFare,
  currency: "USD",
  // ... other params
});
```

### Price Echo Headers

The system automatically tracks price consistency using these headers:

- `x-fd-journey`: Journey ID (same throughout user flow)
- `x-fd-step`: Current step (`search_results`, `view_details`, `bargain_pre`, etc.)

### Journey Steps

- `search_results` - Search results page
- `view_details` - Hotel/flight details page
- `bargain_pre` - Before bargaining
- `bargain_post` - After bargaining
- `book` - Booking page
- `payment` - Payment page
- `invoice` - Invoice generation
- `my_trips` - My trips/bookings

## 🔧 Configuration

### Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:password@host:port/database

# Optional
DEBUG_PRICING=true                    # Enable debug mode
PRICE_ECHO_ENABLED=true              # Enable price tracking
PRICE_ALERT_WEBHOOK=https://...      # Webhook for price mismatches
```

### Markup Rules

Configure pricing rules in the `markup_rules` table:

```sql
INSERT INTO markup_rules (
  module, origin, destination, service_class,
  user_type, markup_type, markup_value, priority
) VALUES (
  'air', 'BOM', 'JFK', 'Y',
  'b2c', 'percent', 8.00, 10
);
```

### Promo Codes

Add discount codes in the `promo_codes` table:

```sql
INSERT INTO promo_codes (
  code, type, value, min_fare, max_discount, valid_to
) VALUES (
  'WELCOME10', 'percent', 10.00, 100.00, 500.00, '2025-12-31'
);
```

## 🧪 Testing

### Unit Tests

Test the core pricing engine logic:

```bash
npm run test:pricing
```

### Integration Tests

Test API endpoints with mock data:

```javascript
const response = await request(app)
  .post("/api/pricing/quote")
  .send({
    module: "air",
    baseFare: 500,
    currency: "USD",
  })
  .expect(200);
```

### Price Consistency Testing

Monitor price consistency across the user journey:

```bash
# Check price diff for a journey
curl "http://localhost:3001/api/pricing/diff?journeyId=abc-123"
```

## 📊 Monitoring

### Price Mismatch Alerts

The system automatically detects price mismatches (except during bargaining) and can send webhook alerts:

```json
{
  "type": "PRICE_MISMATCH",
  "journeyId": "abc-123-def",
  "firstStep": "search_results",
  "firstPrice": 500.0,
  "currentStep": "payment",
  "currentPrice": 520.0,
  "delta": 20.0,
  "timestamp": "2025-09-06T10:00:00Z"
}
```

### Health Monitoring

Monitor system health:

```bash
curl http://localhost:3001/api/pricing/health
```

## 🚦 Usage Examples

### Search Results Pricing

```javascript
const pricing = await pricingApi.searchResults({
  module: "air",
  origin: "BOM",
  destination: "JFK",
  serviceClass: "Y",
  airlineCode: "AI",
  currency: "USD",
  baseFare: supplierFare,
  userType: "b2c",
});

// Display pricing.totalFare to user
```

### Bargain Flow

```javascript
// Pre-bargain price
const preBargain = await pricingApi.bargainPre(params);

// After user negotiation
const postBargain = await pricingApi.bargainPost({
  ...params,
  baseFare: negotiatedFare, // Updated fare after bargaining
});
```

### Admin Rules Management

```javascript
// Preview what rule would apply
const preview = await previewPricingRules({
  module: "air",
  origin: "BOM",
  destination: "JFK",
  serviceClass: "Y",
});

console.log("Matched rule:", preview.matchedRule);
```

## 🛡️ Error Handling

The pricing engine includes comprehensive error handling:

- **Validation errors**: Invalid parameters return 400 with details
- **Database errors**: Graceful degradation with 500 response
- **Missing rules**: Falls back to default module rules
- **Invalid promos**: Silently ignored, no discount applied

## 📈 Performance

- **Caching**: Database queries are optimized with proper indexes
- **Async operations**: All pricing calculations are asynchronous
- **Connection pooling**: Database connections are pooled for efficiency
- **Timeouts**: API calls have reasonable timeout limits

## 🔒 Security

- **Input validation**: All parameters are validated before processing
- **SQL injection protection**: Parameterized queries prevent injection
- **Rate limiting**: API endpoints should be rate-limited in production
- **Audit logging**: All pricing calculations are logged for transparency

## 📞 Support

For issues with the pricing engine:

1. Check the health endpoint: `/api/pricing/health`
2. Review application logs for errors
3. Verify database connectivity and schema
4. Run the test suite: `npm run test:pricing`
5. Check price consistency: `/api/pricing/diff?journeyId=...`

---

**Version**: 1.0.0  
**Last Updated**: September 6, 2025  
**Maintainer**: Faredown Development Team
