# Cuisinier Developer Handoff

## Architecture

- Vite single-page app
- React Router handles public and admin routes
- `src/data/storage.ts` is the local persistence layer
- `src/data/repository.ts` is the active repository boundary
- Repository uses Supabase when env vars exist and localStorage when they do not
- PWA assets live in `public/`

## Important Files

- `src/App.tsx`
- `src/main.tsx`
- `src/data/storage.ts`
- `src/data/repository.ts`
- `src/lib/supabase.ts`
- `src/lib/adminAuth.ts`
- `src/lib/analytics.ts`
- `src/components/customer/HomeHero.tsx`
- `src/components/customer/CheckoutPage.tsx`
- `src/components/customer/TrackingPage.tsx`
- `src/components/admin/AdminDashboard.tsx`
- `public/manifest.webmanifest`
- `public/service-worker.js`

## Menu System

### Source of truth

`src/data/seedMenu.ts` — contains all 20 official menu items, v2.0.

Export `MENU_VERSION = '2.0'` — bumping this triggers normalization for returning users with stale localStorage data.

### Menu structure

- 7 categories: Shawarma, Burger, Pizza, Pasta, Fries & Snacks, Combos, Drinks
- 20 items total
- Each item has: id, name, category, description, price, tags, image, visualEmoji, available, featured, midnightPick, createdAt

### Add-ons (universal)

Defined in `src/components/customer/ItemDetailModal.tsx`:
- Extra Cheese: ৳50
- Extra Sauce: ৳30
- Extra Spicy: ৳20

Add-ons flow into `CartItem.addons`, `OrderItem.addons`, Supabase `order_items.add_ons`, admin detail view, and WhatsApp forward message.

### How to update the menu

1. Edit `src/data/seedMenu.ts` with updated items.
2. Bump `MENU_VERSION` (e.g. `'2.1'`).
3. Run `npm run typecheck && npm run build`.
4. Deploy via `git push origin main`.
5. Run `docs/SUPABASE_MENU_SEED.sql` in Supabase SQL Editor to sync Supabase.

### Supabase menu seeding

`docs/SUPABASE_MENU_SEED.sql` — safe upsert by item name. Run after schema setup or any time menu changes. Does NOT delete existing orders.

Run verification query at the bottom to confirm 7 categories and 20 items.

### localStorage menu behavior

- If no menu in localStorage → seed from `SEED_MENU_ITEMS` and write `cuisinier_menu_version = 2.0`.
- If version matches → use stored data as-is (admin may have edited availability/price).
- If version is stale → normalize fields, merge any new items from seed, write new version.
- If stored data is corrupted (< 5 items) → reset to seed entirely.

### Menu normalization

Implemented in `src/data/storage.ts` → `getMenuItems()`:
- Repairs corrupted category/tag values
- Deduplicates by name
- Adds missing seed items that don't exist in stored data
- Preserves admin-edited prices and availability

## Craving Recommendation Logic

Defined in `src/components/customer/CravingSelector.tsx` → `recommendedItems` useMemo:

**Mood → Tags mapping:**
- cheesy → `['Cheesy']`
- spicy → `['Spicy']`
- quick_bite → `['Quick Bite']`
- midnight_combo → `['Midnight Combo', 'Midnight Pick']`
- heavy_meal → `['Heavy Meal']`
- best_value → `['Best Value']`
- most_popular → `['Most Popular', 'Popular']`

**Hunger → Categories:**
- light → Shawarma, Fries & Snacks, Drinks
- medium → Burger, Pasta, Shawarma
- monster → Burger, Pizza, Combos

**People → Categories:**
- solo → Shawarma, Burger, Fries & Snacks, Combos
- two → Burger, Pizza, Pasta, Combos
- group → Pizza, Combos, Fries & Snacks, Drinks

Fallback chain: tag-matched available items → featured items → first 6 available items.

## Repository Layer

Reads and writes go through `src/data/repository.ts`.

- `menuRepository` — list, upsert, remove
- `orderRepository` — list, getByCode, create (via atomic RPC or sequential fallback), updateStatus, subscribeToOrders
- `settingsRepository` — get, save

Supabase mode:
- Loads menu, orders, order items, and settings from Supabase
- Writes orders atomically via `create_order_with_items` RPC (falls back to sequential inserts on PGRST202)
- Updates status by `order_code`

Fallback mode:
- Uses localStorage only
- Emits `cuisinier:data` so screens refresh in the same browser tab

## Local Storage Keys

- `cuisinier_menu_items`
- `cuisinier_menu_version`
- `cuisinier_orders`
- `cuisinier_cart`
- `cuisinier_settings`
- `cuisinier_admin_session`

## Admin Auth

- Admin login calls `/api/admin/login` (Vercel serverless) which reads `ADMIN_PASSWORD` server-side
- Session is an HMAC-signed token stored in an HttpOnly cookie (`cuisinier_admin`)
- `VITE_ADMIN_PASSWORD` is used only as a local dev fallback; must be blank in production
- Rate limited: 5 attempts per IP per 15 minutes

## Landing Page (root domain)

- `cuisinier.online` (`/`) is redirected via `vercel.json` (a `redirects` entry, not `rewrites` — a rewrite silently loses to Vercel's static-file resolution since `dist/index.html` genuinely exists at that path) to `public/welcome.html`, a fully standalone static HTML file with no build step and no dependency on any `src/` code.
- The React app itself is unaffected and still fully reachable — the existing `*` wildcard route in `App.tsx` renders `HomePage` at any unmatched path, so `/home` now serves exactly what `/` used to.
- Installed PWA instances skip the landing page and launch straight into `/home`: `manifest.webmanifest`'s `start_url` is `/home`, and `welcome.html` has a pre-paint inline script that detects `display-mode: standalone` and redirects instantly, as a safety net for already-installed shortcuts whose OS-cached `start_url` may still be the old `/`.
- Any component that hardcodes a list of "customer-facing" or "install-eligible" routes must include `/home` alongside `/` — `PWAInstallPrompt.tsx`'s `ELIGIBLE_ROUTES` and `ElevenLabsAgentWidget.tsx`'s `CUSTOMER_PATHS` both do this. If you add another such route allowlist, remember the same gap.
- To update the landing page: edit `public/welcome.html` directly. It's a single self-contained file (inline CSS/JS) — changing it can never break ordering, checkout, or admin.

## PWA

- Installable manifest is configured
- Service worker is registered from app entry
- Offline fallback page exists
- Install prompt has dismissal persistence
- `/install` explains manual install steps
- Standalone mode badge appears when launched as an installed app

## ElevenLabs Widget

- Customer-only widget component: `src/components/customer/ElevenLabsAgentWidget.tsx`
- Custom element: `<elevenlabs-convai>`
- Agent ID: `agent_6801krp4gs21fm49n6jdxv19s0qb`
- Visible on customer routes only — excluded from `/admin`

## Analytics (Meta Pixel + GA4)

- Pixel ID: `983944370699450` (set via `VITE_META_PIXEL_ID`)
- Events fired: `ViewContent` (item modal open), `AddToCart`, `InitiateCheckout`, `Purchase`, `Contact`
- SPA route tracking: `trackPageView()` called on every `location.pathname` change in `App.tsx`
- External fbq script loaded once; bootstrap stub prevents dropped calls

## Performance

- Public and admin screens are lazy-loaded
- Vendor chunks are split in `vite.config.ts`
- Menu filtering/search uses `useMemo` — no re-renders on unrelated state changes
- Keep additional dependencies lightweight

## Continue Safely

1. Preserve the repository boundary (`src/data/repository.ts`)
2. Keep localStorage fallback intact
3. Do not force customer login
4. Do not add fake GPS tracking
5. Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the browser
6. Re-run `npm run typecheck` and `npm run build` after each substantial change
