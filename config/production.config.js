// Production Configuration for Faredown Platform
// Optimized for performance, security, and monitoring

const config = {
  // Environment
  NODE_ENV: 'production',
  
  // Server Configuration
  server: {
    port: process.env.PORT || 8080,
    host: '0.0.0.0',
    
    // Performance settings
    compression: {
      enabled: true,
      level: 6, // Compression level (1-9)
      threshold: 1024, // Only compress responses > 1KB
    },
    
    // Rate limiting
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per windowMs
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
    
    // Request timeouts
    timeout: {
      server: 30000, // 30 seconds
      api: 10000, // 10 seconds for API calls
      database: 5000, // 5 seconds for database queries
    },
    
    // Body parsing limits
    bodyParser: {
      limit: '10mb',
      parameterLimit: 1000,
    },
  },
  
  // Database Configuration
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    
    // Connection pool settings
    pool: {
      min: 5,
      max: 20,
      idle: 30000, // 30 seconds
      acquire: 10000, // 10 seconds
      evict: 5000, // 5 seconds
    },
    
    // Query settings
    query: {
      timeout: 5000,
      logging: false, // Disable query logging in production
    },
    
    // SSL configuration
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  
  // Redis Configuration (for caching)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    db: 0,
    
    // Connection settings
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    
    // Cache TTL settings
    ttl: {
      default: 300, // 5 minutes
      search: 600, // 10 minutes for search results
      destinations: 3600, // 1 hour for destinations
      static: 86400, // 24 hours for static data
    },
  },
  
  // External API Configuration
  apis: {
    // Amadeus API
    amadeus: {
      baseURL: 'https://api.amadeus.com',
      timeout: 8000,
      retries: 2,
      retryDelay: 1000,
    },
    
    // Hotelbeds API
    hotelbeds: {
      baseURL: 'https://api.hotelbeds.com',
      timeout: 10000,
      retries: 2,
      retryDelay: 1000,
    },
    
    // Default settings for all APIs
    default: {
      timeout: 5000,
      retries: 1,
      retryDelay: 500,
    },
  },
  
  // Logging Configuration
  logging: {
    level: 'info', // 'error' | 'warn' | 'info' | 'debug'
    
    // Console logging
    console: {
      enabled: false, // Disable console logs in production
      timestamp: true,
      colorize: false,
    },
    
    // File logging
    file: {
      enabled: true,
      path: './logs',
      maxSize: '10m',
      maxFiles: 5,
      compress: true,
    },
    
    // Error tracking (replace with your service)
    errorTracking: {
      enabled: true,
      service: 'sentry', // or 'bugsnag', 'rollbar', etc.
      dsn: process.env.SENTRY_DSN,
    },
    
    // Performance monitoring
    monitoring: {
      enabled: true,
      slowRequestThreshold: 1000, // Log requests slower than 1s
      slowQueryThreshold: 100, // Log queries slower than 100ms
    },
  },
  
  // Security Configuration
  security: {
    // CORS settings
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://faredown.com'],
      credentials: true,
      optionsSuccessStatus: 200,
    },
    
    // Helmet security headers
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", 'https://api.amadeus.com', 'https://api.hotelbeds.com'],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    },
    
    // Session configuration
    session: {
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: true, // HTTPS only
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict',
      },
    },
  },
  
  // Static Files Configuration
  static: {
    // Cache settings for static assets
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    etag: true,
    lastModified: true,
    
    // Compression for static files
    compression: true,
    
    // CDN configuration
    cdn: {
      enabled: true,
      baseUrl: process.env.CDN_BASE_URL,
      paths: {
        images: '/images',
        css: '/css',
        js: '/js',
        fonts: '/fonts',
      },
    },
  },
  
  // Application-specific Configuration
  application: {
    // Search settings
    search: {
      maxResults: 50,
      defaultResults: 20,
      cacheTimeout: 600, // 10 minutes
    },
    
    // Bargain engine settings
    bargain: {
      timeout: 30000, // 30 seconds
      maxAttempts: 3,
      cooldown: 60000, // 1 minute between attempts
    },
    
    // Booking settings
    booking: {
      timeout: 60000, // 1 minute
      confirmationTimeout: 300000, // 5 minutes
    },
    
    // Email settings
    email: {
      provider: 'sendgrid', // or 'ses', 'mailgun', etc.
      apiKey: process.env.SENDGRID_API_KEY,
      from: process.env.EMAIL_FROM || 'noreply@faredown.com',
      templates: {
        path: './templates/email',
        cache: true,
      },
    },
    
    // File upload settings
    upload: {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      destination: process.env.UPLOAD_PATH || './uploads',
    },
  },
  
  // Health Check Configuration
  healthCheck: {
    enabled: true,
    path: '/health',
    timeout: 5000,
    
    // Services to check
    services: {
      database: true,
      redis: true,
      externalApis: false, // Don't check external APIs in health check
    },
  },
  
  // Metrics and Analytics
  metrics: {
    enabled: true,
    
    // Performance metrics
    performance: {
      enabled: true,
      interval: 60000, // Collect every minute
    },
    
    // Business metrics
    business: {
      enabled: true,
      events: [
        'search_performed',
        'booking_started',
        'booking_completed',
        'bargain_initiated',
        'bargain_completed',
      ],
    },
  },
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'development') {
  config.logging.console.enabled = true;
  config.logging.level = 'debug';
  config.security.cors.origin = ['http://localhost:3000', 'http://localhost:8080'];
  config.static.maxAge = 0; // No caching in development
}

// Validation function
const validateConfig = (config) => {
  const required = [
    'database.host',
    'database.username',
    'database.password',
    'security.session.secret',
  ];
  
  for (const path of required) {
    const value = path.split('.').reduce((obj, key) => obj?.[key], config);
    if (!value) {
      throw new Error(`Missing required configuration: ${path}`);
    }
  }
  
  return true;
};

// Validate configuration
try {
  validateConfig(config);
} catch (error) {
  console.error('Configuration validation failed:', error.message);
  process.exit(1);
}

module.exports = config;
