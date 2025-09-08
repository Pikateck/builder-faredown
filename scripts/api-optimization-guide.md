# API Performance Optimization Guide

## Quick Wins (Immediate Implementation)

### 1. Response Compression
```javascript
// Enable gzip compression in Express
const compression = require('compression');
app.use(compression({
  level: 6,
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));
```

### 2. Response Caching Headers
```javascript
// Cache static responses
app.use('/api/destinations', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=3600'); // 1 hour
  next();
});

// Cache hotel/flight search results briefly
app.use('/api/hotels/search', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
  next();
});
```

### 3. Request Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const searchLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per windowMs
  message: 'Too many search requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/*/search', searchLimit);
```

### 4. Database Connection Pooling
```javascript
// Optimize PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  // Performance settings
  max: 20, // Maximum pool size
  min: 5,  // Minimum pool size
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 5000, // 5 seconds
  acquireTimeoutMillis: 10000, // 10 seconds
});
```

## API Endpoint Optimizations

### Hotels API (`/api/hotels/search`)
**Target: <200ms response time**

1. **Implement pagination**:
```javascript
// Instead of returning all hotels
const limit = Math.min(parseInt(req.query.limit) || 20, 50);
const offset = parseInt(req.query.offset) || 0;

const query = `
  SELECT * FROM hotels 
  WHERE destination_code = $1 
  ORDER BY price_per_night 
  LIMIT $2 OFFSET $3
`;
```

2. **Use selective field loading**:
```javascript
// Only fetch required fields
const query = `
  SELECT hotel_id, name, price_per_night, rating, image_url
  FROM hotels 
  WHERE destination_code = $1
`;
```

3. **Implement response caching**:
```javascript
const Redis = require('redis');
const redis = Redis.createClient();

// Cache search results for 5 minutes
const cacheKey = `hotels:${destinationCode}:${checkIn}:${checkOut}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return res.json(JSON.parse(cached));
}

// Fetch from database and cache
const result = await searchHotels(params);
await redis.setex(cacheKey, 300, JSON.stringify(result));
```

### Flights API (`/api/flights/search`)
**Target: <300ms response time**

1. **Batch external API calls**:
```javascript
// Instead of sequential calls
const [amadeusResults, hotelbedsResults] = await Promise.all([
  searchAmadeus(params),
  searchHotelbeds(params)
]);
```

2. **Implement request debouncing**:
```javascript
const searchRequests = new Map();

function debounceSearch(searchKey, searchFn, delay = 300) {
  if (searchRequests.has(searchKey)) {
    clearTimeout(searchRequests.get(searchKey).timeout);
  }
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(async () => {
      try {
        const result = await searchFn();
        searchRequests.delete(searchKey);
        resolve(result);
      } catch (error) {
        searchRequests.delete(searchKey);
        reject(error);
      }
    }, delay);
    
    searchRequests.set(searchKey, { timeout, resolve, reject });
  });
}
```

### Bargain API (`/api/bargain/*`)
**Target: <500ms response time**

1. **Optimize AI processing**:
```javascript
// Stream responses for better perceived performance
app.post('/api/bargain/process', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Transfer-Encoding': 'chunked'
  });
  
  // Send progress updates
  res.write('Processing bargain request...\n');
  
  processBargain(req.body, (progress) => {
    res.write(`Progress: ${progress}%\n`);
  }).then(result => {
    res.write(`Result: ${JSON.stringify(result)}\n`);
    res.end();
  });
});
```

2. **Background processing for complex operations**:
```javascript
const Queue = require('bull');
const bargainQueue = new Queue('bargain processing');

// Add job to queue
app.post('/api/bargain/start', async (req, res) => {
  const job = await bargainQueue.add('process', req.body);
  res.json({ jobId: job.id, status: 'queued' });
});

// Check job status
app.get('/api/bargain/status/:jobId', async (req, res) => {
  const job = await bargainQueue.getJob(req.params.jobId);
  res.json({ 
    status: job.opts.jobId, 
    progress: job.progress() 
  });
});
```

## Database Query Optimizations

### 1. Use Prepared Statements
```javascript
// Instead of string concatenation
const query = 'SELECT * FROM hotels WHERE destination = $1 AND date = $2';
const result = await pool.query(query, [destination, date]);
```

### 2. Implement Query Result Caching
```javascript
const queryCache = new Map();

async function cachedQuery(sql, params, ttl = 300) {
  const cacheKey = `${sql}:${JSON.stringify(params)}`;
  
  if (queryCache.has(cacheKey)) {
    const cached = queryCache.get(cacheKey);
    if (Date.now() - cached.timestamp < ttl * 1000) {
      return cached.result;
    }
  }
  
  const result = await pool.query(sql, params);
  queryCache.set(cacheKey, {
    result: result.rows,
    timestamp: Date.now()
  });
  
  return result.rows;
}
```

### 3. Optimize Complex Joins
```javascript
// Instead of multiple queries
const hotelWithAmenities = await pool.query(`
  SELECT h.*, array_agg(a.name) as amenities
  FROM hotels h
  LEFT JOIN hotel_amenities ha ON h.id = ha.hotel_id
  LEFT JOIN amenities a ON ha.amenity_id = a.id
  WHERE h.destination_code = $1
  GROUP BY h.id
`, [destinationCode]);
```

## Monitoring and Profiling

### 1. Request Timing Middleware
```javascript
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) { // Log slow requests
      console.log(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  next();
});
```

### 2. Database Query Monitoring
```javascript
// Log slow queries
const originalQuery = pool.query;
pool.query = function(...args) {
  const start = Date.now();
  const promise = originalQuery.apply(this, args);
  
  promise.then(() => {
    const duration = Date.now() - start;
    if (duration > 100) {
      console.log(`Slow query: ${args[0]} - ${duration}ms`);
    }
  });
  
  return promise;
};
```

### 3. Memory Usage Monitoring
```javascript
setInterval(() => {
  const usage = process.memoryUsage();
  if (usage.heapUsed > 100 * 1024 * 1024) { // 100MB
    console.warn('High memory usage:', usage);
  }
}, 30000);
```

## Production Deployment Checklist

- [ ] Enable compression middleware
- [ ] Set appropriate cache headers
- [ ] Implement rate limiting
- [ ] Configure database connection pooling
- [ ] Add request timeout handling
- [ ] Set up error logging and monitoring
- [ ] Enable database query logging for slow queries
- [ ] Configure Redis/Memcached for caching
- [ ] Implement health check endpoints
- [ ] Set up load balancing
- [ ] Configure CDN for static assets
- [ ] Enable HTTP/2 if supported
- [ ] Set security headers (CORS, CSP, etc.)
- [ ] Configure environment-specific settings

## Performance Targets

| Endpoint | Target Response Time | Acceptable Response Time |
|----------|---------------------|-------------------------|
| `/api/destinations` | <100ms | <200ms |
| `/api/hotels/search` | <200ms | <500ms |
| `/api/flights/search` | <300ms | <800ms |
| `/api/bargain/process` | <500ms | <1000ms |
| `/api/bookings/create` | <1000ms | <2000ms |

## Common Performance Anti-patterns to Avoid

1. **N+1 Query Problem**: Load related data in a single query
2. **Blocking Operations**: Use async/await properly
3. **Memory Leaks**: Clean up event listeners and timers
4. **Synchronous File Operations**: Use async file operations
5. **Large JSON Responses**: Implement pagination
6. **Missing Error Handling**: Handle errors gracefully
7. **No Request Timeouts**: Set appropriate timeouts
8. **Inefficient Loops**: Use array methods efficiently
