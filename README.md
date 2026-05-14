# Cuisinier

Installable mobile-first PWA for an AI-powered cloud kitchen in Dhaka. The app supports guest ordering, manual payment capture, admin order operations, tracking, WhatsApp support, and a Supabase-ready repository layer with localStorage fallback.

Production defaults:

- Domain target: `cuisinier.online`
- WhatsApp support: `+8801778307704`
- bKash Personal: `01778307704`
- Nagad Personal: `+8801677975845`

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Framer Motion
- Supabase optional backend
- localStorage fallback for local development and offline-friendly persistence

## Run Locally

```bash
npm install
npm run dev
```

Typical local URL: `http://localhost:3000`

## Validation Commands

```bash
npm run typecheck
npm run build
npm run preview
```

There is no lint script in the current project.

## Environment Variables

Create a local `.env` file from [.env.example](/F:/HQ/Codex/Cuisinier/cuisinier_kimi_fixed/.env.example). Use [.env.production.example](/F:/HQ/Codex/Cuisinier/cuisinier_kimi_fixed/.env.production.example) as the production deployment checklist.

Supabase, only when enabling the remote backend:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Admin hardening:

```bash
VITE_ADMIN_PASSWORD=
VITE_ADMIN_SESSION_TTL_MINUTES=480
```

Optional analytics:

```bash
VITE_GA4_MEASUREMENT_ID=
VITE_META_PIXEL_ID=
```

## Admin Access

- Route: `/admin`
- Local fallback password when `VITE_ADMIN_PASSWORD` is missing: `cuisinier-admin`
- Production recommendation: set `VITE_ADMIN_PASSWORD` in deployment settings

## Main Routes

- `/` home and launch screen
- `/craving` AI craving selector
- `/menu` menu browsing and customization
- `/cart` cart review
- `/checkout` guest checkout
- `/order/:orderId` order confirmation and tracking timeline
- `/track` order lookup
- `/support` WhatsApp and support actions
- `/install` install help
- `/admin` admin dashboard

## Data Modes

### localStorage fallback

Used automatically when Supabase environment variables are missing.

Storage keys:

- `cuisinier_menu_items`
- `cuisinier_orders`
- `cuisinier_cart`
- `cuisinier_settings`
- `cuisinier_admin_session`

### Supabase mode

Used automatically when both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` exist.

Behavior:

- Menu, orders, order items, and settings load from Supabase
- Admin status updates write to Supabase
- Tracking reads remote status updates
- Local browser cache is refreshed from Supabase for resilience
- If Supabase is configured but a write fails, the app does not silently fall back to local-only writes

Schema file:

- [docs/SUPABASE_SCHEMA.sql](/F:/HQ/Codex/Cuisinier/cuisinier_kimi_fixed/docs/SUPABASE_SCHEMA.sql)

## PWA Notes

- Manifest: [public/manifest.webmanifest](/F:/HQ/Codex/Cuisinier/cuisinier_kimi_fixed/public/manifest.webmanifest)
- Service worker: [public/service-worker.js](/F:/HQ/Codex/Cuisinier/cuisinier_kimi_fixed/public/service-worker.js)
- Offline page: [public/offline.html](/F:/HQ/Codex/Cuisinier/cuisinier_kimi_fixed/public/offline.html)
- Icons: `192`, `512`, and `maskable-512`
- Install CTA is available in the home hero, fallback prompt, and `/install`
- Production PWA validation guide: [docs/PWA_TESTING_GUIDE.md](/F:/HQ/Codex/Cuisinier/cuisinier_kimi_fixed/docs/PWA_TESTING_GUIDE.md)

## Deployment

### Vercel

1. Import the project into Vercel.
2. Set install command: `npm install`
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Keep [vercel.json](/F:/HQ/Codex/Cuisinier/cuisinier_kimi_fixed/vercel.json) in the project root so SPA routes, service worker headers, and manifest headers are applied.
6. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_PASSWORD`
   - `VITE_ADMIN_SESSION_TTL_MINUTES`
   - `VITE_GA4_MEASUREMENT_ID` if used
   - `VITE_META_PIXEL_ID` if used
7. Deploy over HTTPS.
8. Add the custom domain `cuisinier.online` in Vercel project settings.
9. Configure the required DNS records at your domain provider.
10. Wait for Vercel to issue the HTTPS certificate.
11. Run the install and offline checks from [docs/PWA_TESTING_GUIDE.md](/F:/HQ/Codex/Cuisinier/cuisinier_kimi_fixed/docs/PWA_TESTING_GUIDE.md).

### Supabase Setup

1. Create a Supabase project.
2. Run [docs/SUPABASE_SCHEMA.sql](/F:/HQ/Codex/Cuisinier/cuisinier_kimi_fixed/docs/SUPABASE_SCHEMA.sql) in the SQL editor.
3. Add the project URL and anon key to your deployment environment.
4. Seed menu and settings by opening the deployed app once, or by inserting rows directly.

### Launch Business Numbers

- WhatsApp support: `+8801778307704`
- bKash Personal: `01778307704`
- Nagad Personal: `+8801677975845`

## Current Product Rules

- Guest checkout only
- COD, bKash manual, and Nagad manual
- bKash and Nagad require sender number and transaction ID
- Fixed delivery fee is `BDT 100`
- Tracking is a timeline only, no fake GPS
- Admin can update statuses, forward orders to WhatsApp, manage menu, and manage settings
- Tracking refreshes on live updates and periodic polling
- Analytics hooks are environment-driven and safe to leave disabled

## Known Limitations

- Admin authentication is still client-side and env-password based, not server-issued
- Supabase writes currently depend on the public client path, so stricter production security should move admin mutations behind a server function or authenticated admin role
- No customer account system yet
- No screenshot upload for manual payments
- No dedicated server-side abuse protection or rate limiting yet
- Real Supabase sync and real-device PWA install still need deployed HTTPS verification

## Exact Next Steps

1. Verify live Supabase order sync across at least two devices.
2. Run Android Chrome, Desktop Chrome, and iPhone Safari install tests over HTTPS.
3. Connect `cuisinier.online`, confirm HTTPS issuance, and run one live customer-to-admin order flow.
4. Move admin mutations behind server-side protection or Supabase Auth/RLS before wider public traffic.
