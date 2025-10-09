# Admin API & Service Worker Runbook

## Environment Variables (must match across Builder preview, Netlify, Render)

| Name | Expected Value | Notes |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `https://builder-faredown-pricing.onrender.com/api` | Frontend Fetch base URL |
| `ADMIN_API_KEY` | `8f13a2c7b4d9e0f1a6c5d4b3e2f1908a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1` | Injected by SW and server auth |
| `JWT_SECRET` | `<shared protected value>` | Must be identical on Render & Netlify functions |

## Service Worker Registration

- **File:** `public/admin-fetch-worker.js`
- **Registration entry point:** `client/lib/register-admin-worker.ts`
- **Bootstrapped from:** `client/pages/admin/AdminDashboard.tsx` (`useEffect` on mount)
- Ensure admin pages are loaded only after `registerAdminWorker()` resolves.

## Verification Steps

1. **CORS / Preflight**
   ```bash
   curl -i -X OPTIONS \
     -H "Origin: https://spontaneous-biscotti-da44bc.netlify.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Admin-Key, Content-Type, request-id" \
     https://builder-faredown-pricing.onrender.com/api/admin/users
   ```
   - Expect: `204` status, `Vary: Origin, Access-Control-Request-Headers`, `Access-Control-Allow-Headers` echoing request headers.

2. **Authenticated GET**
   ```bash
   curl -i \
     -H "Origin: https://spontaneous-biscotti-da44bc.netlify.app" \
     -H "X-Admin-Key: $ADMIN_API_KEY" \
     https://builder-faredown-pricing.onrender.com/api/admin/users
   ```
   - Expect: `200` with JSON body, `Access-Control-Allow-Origin` set to requesting origin.

3. **Automated Guardrail**
   ```bash
   npm run monitor:admin-api
   ```
   - Runs both checks above; non-zero exit code on failure.

## Browser Checklist

1. Open Admin (`/admin/dashboard?module=users`) → DevTools → **Application → Clear storage** → *Clear site data*.
2. Reload with DevTools Console & Network tabs open.
3. Confirm console logs:
   - `✅ Admin Service Worker activated`
   - `[SW] intercept ... hasAdminKey: true`
   - `[SW] response ... status: 200`
4. In Network tab:
   - `OPTIONS /api/admin/users` → `204`
   - `GET /api/admin/users` → `200`, request headers include `X-Admin-Key`.

## Additional Admin Routes

- Verify the same pattern on:
  - `/api/admin/dashboard`
  - `/api/admin/analytics`
  - `/api/admin/suppliers`
  - `/api/admin/pricing`
- Service worker intercept covers any path containing `/admin`; no extra configuration required.

## Deployment Notes

- Render deploy: dashboard → `builder-faredown-pricing` → Manual Deploy (latest commit).
- Netlify deploy: `spontaneous-biscotti-da44bc` → Deploys → Publish latest.
- Record deploy IDs alongside commit SHA for audit.
