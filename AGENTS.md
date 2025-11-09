# Fusion Starter

A production-ready full-stack React application template with integrated Express server, featuring React Router 6 SPA mode, TypeScript, Vitest, Zod and modern tooling.

While the starter comes with a express server, only create endpoint when strictly neccesary, for example to encapsulate logic that must leave in the server, such as private keys handling, or certain DB operations, db...

---

## ⚠️ CRITICAL: TBO Hotel API Credentials & Setup (Oct 25, 2025)

### Status: ✅ CONFIRMED & DEPLOYED

**Credentials (PRODUCTION):**
- ClientId: `tboprod`
- Agency ID / UserId: `BOMF145`
- API Password: `@Bo#4M-Api@`
- Static Data Username: `travelcategory`
- Static Data Password: `Tra@59334536`

**Outbound IPs (Fixie Proxy):**
- 52.5.155.132
- 52.87.82.133

**All credentials are in Render environment variables (NOT in code)**

### Documentation
- `TBO_CREDENTIALS_VERIFICATION_CONFIRMED.md` - Full setup details
- `TBO_QUICK_REFERENCE_CARD.md` - Quick testing reference
- `TBO_DEPLOYMENT_GUIDE_FINAL.md` - Complete deployment & troubleshooting

### Key Files
- `api/services/adapters/tboAdapter.js` (lines 43-80) - Credential initialization
- `api/routes/tbo-hotels.js` - Hotel API endpoints (/cities, /search, /hotel)
- `api/routes/tbo-diagnostics.js` - Diagnostics test endpoint
- `api/lib/tboRequest.js` - HTTP request helper with Fixie proxy

### Quick Verification
```bash
# Check outbound IP
curl https://builder-faredown-pricing.onrender.com/api/tbo-hotels/egress-ip

# Expected: {"success": true, "ip": "52.5.155.132"}
```

### ⚠️ ACTION REQUIRED
**Confirm with TBO that IPs 52.5.155.132 and 52.87.82.133 are whitelisted for:**
- ClientId: tboprod
- Agency: BOMF145

---

## Tech Stack

- **Frontend**: React 18 + React Router 6 (spa) + TypeScript + Vite + TailwindCSS 3
- **Backend**: Express.js (Node.js) with PostgreSQL
- **Testing**: Vitest
- **UI**: Radix UI + TailwindCSS 3 + Lucide React icons
- **Suppliers**: Amadeus (flights), TBO (hotels), Hotelbeds (hotels/transfers), Ratehawk (hotels)
- **Database**: PostgreSQL (Render)
- **Deployment**: Render (backend), Netlify (frontend)
- **Proxy**: Fixie (HTTP proxy for outbound requests)

## Project Structure

```
client/                   # React SPA frontend
├── pages/                # Route components (Index.tsx = home)
├── components/ui/        # Pre-built UI component library
├── App.tsx                # App entry point and with SPA routing setup
└── global.css            # TailwindCSS 3 theming and global styles

server/                   # Express API backend
├── index.ts              # Main server setup (express config + routes)
└── routes/               # API handlers

shared/                   # Types used by both client & server
└── api.ts                # Example of how to share api interfaces
```

## Key Features

## SPA Routing System

The routing system is powered by React Router 6:

- `client/pages/Index.tsx` represents the home page.
- Routes are defined in `client/App.tsx` using the `react-router-dom` import
- Route files are located in the `client/pages/` directory

For example, routes can be defined with:

```typescript
import { BrowserRouter, Routes, Route } from "react-router-dom";

<Routes>
  <Route path="/" element={<Index />} />
  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
  <Route path="*" element={<NotFound />} />
</Routes>;
```

### Styling System

- **Primary**: TailwindCSS 3 utility classes
- **Theme and design tokens**: Configure in `client/global.css` 
- **UI components**: Pre-built library in `client/components/ui/`
- **Utility**: `cn()` function combines `clsx` + `tailwind-merge` for conditional classes

```typescript
// cn utility usage
className={cn(
  "base-classes",
  { "conditional-class": condition },
  props.className  // User overrides
)}
```

### Express Server Integration

- **Development**: Single port (8080) for both frontend/backend
- **Hot reload**: Both client and server code
- **API endpoints**: Prefixed with `/api/`

#### Example API Routes
- `GET /api/ping` - Simple ping api
- `GET /api/demo` - Demo endpoint  

### Shared Types
Import consistent types in both client and server:
```typescript
import { DemoResponse } from '@shared/api';
```

Path aliases:
- `@shared/*` - Shared folder
- `@/*` - Client folder

## Development Commands

```bash
npm run dev        # Start dev server (client + server)
npm run build      # Production build
npm run start      # Start production server
npm run typecheck  # TypeScript validation
npm test          # Run Vitest tests
```

## Adding Features

### Add new colors to the theme

Open `client/global.css` and `tailwind.config.ts` and add new tailwind colors.

### New API Route
1. **Optional**: Create a shared interface in `shared/api.ts`:
```typescript
export interface MyRouteResponse {
  message: string;
  // Add other response properties here
}
```

2. Create a new route handler in `server/routes/my-route.ts`:
```typescript
import { RequestHandler } from "express";
import { MyRouteResponse } from "@shared/api"; // Optional: for type safety

export const handleMyRoute: RequestHandler = (req, res) => {
  const response: MyRouteResponse = {
    message: 'Hello from my endpoint!'
  };
  res.json(response);
};
```

3. Register the route in `server/index.ts`:
```typescript
import { handleMyRoute } from "./routes/my-route";

// Add to the createServer function:
app.get("/api/my-endpoint", handleMyRoute);
```

4. Use in React components with type safety:
```typescript
import { MyRouteResponse } from '@shared/api'; // Optional: for type safety

const response = await fetch('/api/my-endpoint');
const data: MyRouteResponse = await response.json();
```

### New Page Route
1. Create component in `client/pages/MyPage.tsx`
2. Add route in `client/App.tsx`:
```typescript
<Route path="/my-page" element={<MyPage />} />
```

## Production Deployment

- **Standard**: `npm run build` + `npm start`
- **Docker**: Dockerfile included
- **Binary**: Self-contained executables (Linux, macOS, Windows)
- Express serves the built React SPA with fallback routing support

## Architecture Notes

- Single-port development with Vite + Express integration
- TypeScript throughout (client, server, shared)
- Full hot reload for rapid development
- Production-ready with multiple deployment options
- Comprehensive UI component library included
- Type-safe API communication via shared interfaces
