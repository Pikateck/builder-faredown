# FAREDOWN PRODUCTION DEPLOYMENT GUIDE

## DEPLOYMENT OVERVIEW

This guide provides complete instructions for deploying the Faredown flight booking system to production environments.

**Project Status:** Production Ready  
**Last Updated:** December 2024  
**Deployment Target:** Modern web hosting platforms

## PRE-DEPLOYMENT CHECKLIST

### ✅ Code Quality Verification

- [x] All TypeScript compilation errors resolved
- [x] ESLint warnings addressed
- [x] Mobile responsiveness tested across devices
- [x] Cross-browser compatibility verified
- [x] Price calculation logic validated
- [x] Bargaining system tested with various scenarios
- [x] Performance optimization implemented

### ✅ Environment Configuration

- [x] Production build configuration optimized
- [x] Environment variables prepared
- [x] API endpoint configurations ready
- [x] Asset optimization completed
- [x] Security headers configured

## BUILD PROCESS

### 1. Development to Production Build

```bash
# Install dependencies
npm install

# Run production build
npm run build

# Verify build output
ls -la dist/
```

### 2. Build Output Structure

```
dist/
├── assets/
│   ├── index-[hash].js      # Main application bundle
│   ├── index-[hash].css     # Compiled styles
│   └── vendor-[hash].js     # Third-party dependencies
├── index.html               # Main HTML file
└── static/                  # Static assets
```

### 3. Build Optimization Features

- **Code Splitting:** Automatic route-based splitting
- **Tree Shaking:** Unused code elimination
- **Minification:** JS/CSS compression
- **Asset Hashing:** Cache busting for updates
- **Gzip Compression:** Reduced transfer sizes

## HOSTING PLATFORM OPTIONS

### Option 1: Vercel (Recommended)

**Advantages:**

- Zero-config deployment
- Automatic HTTPS
- Global CDN
- Preview deployments
- Built-in analytics

**Deployment Steps:**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod

# Configure custom domain
vercel domains add faredown.com
```

**vercel.json Configuration:**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Option 2: Netlify

**Advantages:**

- Form handling
- Serverless functions
- Split testing
- Edge handlers

**Deployment Steps:**

```bash
# Build for production
npm run build

# Deploy to Netlify
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

**netlify.toml Configuration:**

```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

### Option 3: Traditional Web Hosting

**Steps:**

1. Run `npm run build`
2. Upload `dist/` folder contents to web root
3. Configure web server for SPA routing
4. Set up HTTPS certificate
5. Configure security headers

## ENVIRONMENT VARIABLES

### Production Environment Setup

```bash
# API Configuration
VITE_API_BASE_URL=https://api.faredown.com
VITE_ENVIRONMENT=production

# Payment Gateway
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxx
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxx

# Analytics
VITE_GA_TRACKING_ID=UA-xxxxx-x
VITE_HOTJAR_ID=xxxxx

# Email Service
VITE_SENDGRID_API_KEY=SG.xxxxx

# Maps Integration
VITE_GOOGLE_MAPS_API_KEY=AIzaSyxxxxx

# Security
VITE_ENCRYPTION_KEY=xxxxx
VITE_JWT_SECRET=xxxxx
```

### Environment File Structure

```
.env.production.local     # Production secrets (not committed)
.env.production          # Production config (committed)
.env.local               # Local overrides (not committed)
.env                     # Default values (committed)
```

## WEB SERVER CONFIGURATION

### Nginx Configuration

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name faredown.com www.faredown.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name faredown.com www.faredown.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/faredown.crt;
    ssl_certificate_key /etc/ssl/private/faredown.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Document Root
    root /var/www/faredown/dist;
    index index.html;

    # SPA Routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Asset Caching
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip Compression
    gzip on;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
}
```

### Apache Configuration

```apache
<VirtualHost *:443>
    ServerName faredown.com
    DocumentRoot /var/www/faredown/dist

    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/faredown.crt
    SSLCertificateKeyFile /etc/ssl/private/faredown.key

    # SPA Routing
    RewriteEngine On
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]

    # Security Headers
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"

    # Asset Caching
    <LocationMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
    </LocationMatch>
</VirtualHost>
```

## PERFORMANCE OPTIMIZATION

### CDN Configuration

**Recommended CDN Settings:**

- **Cache TTL:** 1 year for assets, 1 hour for HTML
- **Compression:** Gzip/Brotli enabled
- **HTTP/2:** Enabled for faster loading
- **Image Optimization:** WebP conversion where supported

### Performance Monitoring

**Metrics to Track:**

- First Contentful Paint (FCP): <1.5s
- Largest Contentful Paint (LCP): <2.5s
- Cumulative Layout Shift (CLS): <0.1
- First Input Delay (FID): <100ms

**Tools:**

- Google PageSpeed Insights
- WebPageTest
- GTmetrix
- Lighthouse CI

## SECURITY CONFIGURATION

### Content Security Policy

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; 
           script-src 'self' 'unsafe-inline' https://js.stripe.com; 
           style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
           font-src 'self' https://fonts.gstatic.com; 
           img-src 'self' data: https:; 
           connect-src 'self' https://api.faredown.com;"
/>
```

### Security Headers

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## MONITORING & ANALYTICS

### Error Tracking

**Sentry Configuration:**

```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://xxx@xxx.ingest.sentry.io/xxx",
  environment: "production",
  tracesSampleRate: 0.1,
});
```

### Analytics Integration

**Google Analytics 4:**

```javascript
// gtag configuration
gtag("config", "GA_TRACKING_ID", {
  page_title: document.title,
  page_location: window.location.href,
});
```

**Custom Events:**

```javascript
// Track flight searches
gtag("event", "flight_search", {
  event_category: "engagement",
  from_city: selectedFromCity,
  to_city: selectedToCity,
});

// Track bargaining attempts
gtag("event", "bargain_attempt", {
  event_category: "conversion",
  original_price: originalPrice,
  bargain_price: bargainPrice,
});
```

## BACKUP & RECOVERY

### Automated Backups

**Code Repository:**

- GitHub with protected main branch
- Automated daily backups to separate repository
- Tagged releases for rollback capability

**Database Backups:**

- Daily automated backups to cloud storage
- Point-in-time recovery capability
- Cross-region replication for disaster recovery

### Rollback Procedures

**Quick Rollback:**

```bash
# Rollback to previous version
vercel --prod rollback

# Or deploy specific version
vercel --prod --target=production-abc123
```

## DOMAIN & DNS CONFIGURATION

### DNS Records

```
A     faredown.com           76.76.19.61
AAAA  faredown.com           2600:1f18:147c:e201::61
CNAME www.faredown.com       faredown.com
CNAME api.faredown.com       api-server.herokuapp.com
TXT   faredown.com           "v=spf1 include:sendgrid.net ~all"
```

### SSL Certificate

**Let's Encrypt (Free):**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d faredown.com -d www.faredown.com

# Auto-renewal
sudo crontab -e
0 12 * * * /usr/bin/certbot renew --quiet
```

## MAINTENANCE PROCEDURES

### Regular Maintenance Tasks

**Weekly:**

- Monitor performance metrics
- Check error logs and fix critical issues
- Review user feedback and support tickets

**Monthly:**

- Update dependencies for security patches
- Review and optimize performance
- Backup verification and recovery testing

**Quarterly:**

- Full security audit
- Performance optimization review
- User experience analysis and improvements

### Update Deployment Process

```bash
# 1. Test changes in staging
npm run build:staging
npm run test:e2e

# 2. Create release tag
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin v1.2.0

# 3. Deploy to production
npm run deploy:production

# 4. Monitor deployment
npm run monitor:production
```

## TROUBLESHOOTING

### Common Issues & Solutions

**404 Errors on Refresh:**

- Ensure SPA routing configuration is correct
- Check web server rewrite rules

**Slow Loading:**

- Verify CDN configuration
- Check bundle size and implement code splitting
- Optimize images and assets

**CORS Issues:**

- Configure proper CORS headers on API server
- Verify allowed origins in production

## SUPPORT & MAINTENANCE

### Support Channels

- **Technical Issues:** support@faredown.com
- **Emergency Contact:** +1-xxx-xxx-xxxx
- **Monitoring Alerts:** alerts@faredown.com

### Documentation

- **API Documentation:** https://docs.faredown.com/api
- **User Guide:** https://help.faredown.com
- **Developer Guide:** https://docs.faredown.com/dev

---

**Deployment Status:** Ready for Production  
**Last Tested:** December 2024  
**Next Review:** March 2025
