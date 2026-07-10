# Cuisinier

Installable mobile-first PWA for an AI-powered cloud kitchen in Dhaka. The app supports guest ordering, manual payment capture, admin order operations, live tracking, WhatsApp support, and a Supabase-backed repository layer with localStorage fallback.

Production defaults:

- Domain: `cuisinier.online`
- WhatsApp support: `+8801778307704`
- bKash Personal: `01778307704`
- Nagad Personal: `+8801677975845`
- Fixed delivery fee: `৳100`

## Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS
- React Router
- Framer Motion
- Supabase (menu, orders, order items, settings, atomic order RPC)
- Vercel serverless functions (`api/admin/*`) for server-side admin auth
- localStorage fallback when Supabase env vars are absent

## Run Locally

```bash
npm install
npm run dev
```

Local dev server: `http://localhost:3000` (see `vite.config.ts`).

## Validation Commands

```bash
npm run typecheck
npm run build
npm run preview
```

There is no lint script in the current project.

## Environment Variables

Copy `.env.example` for local development. Copy `.env.production.example` as the reference for what must be set in Vercel for production — it documents every variable including which ones are server-side-only secrets.

### Client-side (safe to expose, prefixed `VITE_`)

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GA4_MEASUREMENT_ID=       # optional
VITE_META_PIXEL_ID=            # optional
VITE_ADMIN_PASSWORD=           # LOCAL DEV FALLBACK ONLY — must be blank in production
VITE_ADMIN_SESSION_TTL_MINUTES=480
```

### Server-side only (never exposed to the browser)

Set these in Vercel Project Settings → Environment Variables, never in a client bundle:

```bash
ADMIN_PASSWORD=                # the real production admin password
ADMIN_SESSION_SECRET=          # random 32+ char string, signs admin session cookies
ADMIN_SESSION_TTL_MINUTES=480
SUPABASE_SERVICE_ROLE_KEY=     # only used by /api/admin/* routes
```

## Admin Access

- Route: `/admin`
- **Production auth is server-side.** `/api/admin/login` reads `ADMIN_PASSWORD` from the server environment, does a timing-safe comparison, and issues an HMAC-signed session as an HttpOnly cookie. The password never touches client-side code in production.
- Rate limited: 5 attempts per IP, 15-minute lockout (in-memory per serverless instance — not shared across instances; acceptable for current scale).
- `VITE_ADMIN_PASSWORD` is a **local development fallback only**, used when `/api/admin/login` is unreachable (e.g. plain `vite dev` without `vercel dev`). It must be left blank in the production environment.

## Main Routes

- `/` — standalone marketing landing page (`public/welcome.html`), served via a Vercel redirect *before* the React app loads. Fully decoupled static file — edit it independently of the app with zero risk to ordering/checkout/admin.
- `/home` — the actual React app entry (what `/` used to be). This is where the "Start Food Mission" hero, PWA install prompt, and ElevenLabs widget eligibility live.
- `/craving` — AI craving selector
- `/menu` — menu browsing and customization
- `/cart` — cart review
- `/checkout` — guest checkout
- `/order/:orderId` — order confirmation and tracking timeline
- `/track` — order lookup by ID
- `/support` — WhatsApp and support actions
- `/install` — manual PWA install instructions
- `/admin` — admin dashboard (Overview, Orders, Kanban, Menu, Settings)

Installed PWA instances (home-screen icon) launch directly into `/home`, bypassing the marketing landing page — see `public/manifest.webmanifest`'s `start_url` and the standalone-mode guard script at the top of `public/welcome.html`.

## Data Modes

### localStorage fallback

Used automatically when Supabase environment variables are missing.

Storage keys:

- `cuisinier_menu_items`
- `cuisinier_menu_version`
- `cuisinier_orders`
- `cuisinier_cart`
- `cuisinier_settings`
- `cuisinier_admin_session`

### Supabase mode

Used automatically when both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` exist.

- Menu, orders, order items, and settings load from Supabase
- Orders are created atomically via the `create_order_with_items` Postgres RPC (sequential-insert fallback only if the RPC is missing)
- Admin status updates write to Supabase; tracking reads remote status updates
- Row Level Security is enabled on every table — anon can only read, never write directly; all writes go through the RPC or the server-side admin API (service role)
- Local browser cache refreshes from Supabase for resilience

Schema and seed files:

- [docs/SUPABASE_SCHEMA.sql](docs/SUPABASE_SCHEMA.sql) — tables, RLS policies, atomic order RPC
- [docs/SUPABASE_MENU_SEED.sql](docs/SUPABASE_MENU_SEED.sql) — official 20-item menu, safe to re-run, never touches orders

## Menu System

- Source of truth: `src/data/seedMenu.ts` — 20 items across 7 categories (Shawarma, Burger, Pizza, Pasta, Fries & Snacks, Combos, Drinks), versioned via `MENU_VERSION`.
- Universal add-ons (Extra Cheese ৳50, Extra Sauce ৳30, Extra Spicy ৳20) apply to every item and flow through cart → order → admin detail → WhatsApp forward message.
- To update the menu: edit `seedMenu.ts`, bump `MENU_VERSION`, run typecheck/build, deploy, then run `docs/SUPABASE_MENU_SEED.sql` in the Supabase SQL editor to sync the live database.
- Full details: [docs/DEVELOPER_HANDOFF.md](docs/DEVELOPER_HANDOFF.md)

## PWA Notes

- Manifest: [public/manifest.webmanifest](public/manifest.webmanifest)
- Service worker: [public/service-worker.js](public/service-worker.js) — network-first navigation, cache-first static assets
- Offline page: [public/offline.html](public/offline.html)
- Icons: `192`, `512`, and `maskable-512`
- Install CTA available in the home hero, fallback prompt, and `/install`
- Production PWA validation guide: [docs/PWA_TESTING_GUIDE.md](docs/PWA_TESTING_GUIDE.md)

## Deployment

### Vercel

This project has **no GitHub auto-deploy configured** — deployments are manual via the Vercel CLI:

```bash
vercel --prod
```

1. Install command: `npm install`
2. Build command: `npm run build`
3. Output directory: `dist`
4. Keep [vercel.json](vercel.json) in the project root — it handles the root landing-page redirect, SPA routing for all other paths, service worker/manifest headers, and security headers.
5. Set every environment variable listed above (client-side `VITE_*` and server-side secrets) in Vercel Project Settings.
6. Custom domain `cuisinier.online` / `www.cuisinier.online` must be attached to **this** project (`cuisinier_kimi_fixed`) — if a domain shows the wrong content after deploying, check Project Settings → Domains before assuming a code issue.

### Supabase Setup

1. Create a Supabase project.
2. Run [docs/SUPABASE_SCHEMA.sql](docs/SUPABASE_SCHEMA.sql) in the SQL editor.
3. Run [docs/SUPABASE_MENU_SEED.sql](docs/SUPABASE_MENU_SEED.sql) to seed the official menu.
4. Add the project URL, anon key, and service role key to Vercel environment variables.

## Current Product Rules

- Guest checkout only, no forced login anywhere
- COD, bKash manual, and Nagad manual payment
- bKash and Nagad require sender number and transaction ID
- Fixed delivery fee is `৳100`
- Tracking is a status timeline only — no fake GPS, ever
- Admin can update statuses, forward orders to WhatsApp, manage menu, and manage settings
- Tracking refreshes on live Supabase updates and periodic polling
- Analytics hooks are environment-driven and safe to leave disabled

## Known Limitations

- Rate limiting on `/api/admin/login` is in-memory per serverless instance, not shared across instances — acceptable at current scale, would need persistent storage (Redis/Supabase table) for stricter guarantees under high concurrent traffic
- No customer account system (by design — guest checkout is the product decision, not a gap)
- No screenshot upload for manual bKash/Nagad payment proof
- Order tracking is reachable by anyone who knows the order code (no separate tracking token) — acceptable for current scale per the RLS design notes in `docs/SUPABASE_SCHEMA.sql`

## Exact Next Steps

1. Verify live Supabase order sync across at least two devices/sessions.
2. Run Android Chrome, Desktop Chrome, and iPhone Safari install tests over HTTPS.
3. Monitor `/api/admin/login` for rate-limit false positives if traffic grows (shared IPs behind NAT/proxy).
4. Consider a `tracking_token` column on `orders` for stricter per-customer tracking isolation before very high-volume traffic.
