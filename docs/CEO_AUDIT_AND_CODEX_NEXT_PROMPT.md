# Cuisinier Kimi Build Audit + Codex Next Prompt

## Status
This package is a cleaned and build-tested version of the Kimi Agent Cuisinier PWA project.

## Fixes applied after Kimi output
- Removed unused shadcn/Radix UI component files that forced many unnecessary dependencies.
- Reduced `package.json` to the actual runtime dependencies used by the Cuisinier app.
- Removed the non-portable `kimi-plugin-inspect-react` Vite plugin from `vite.config.ts`.
- Fixed the router import in `src/main.tsx` to use `react-router-dom`.
- Removed the unavailable `tailwindcss-animate` plugin from Tailwind config.
- Verified production build successfully with `npm run build`.
- Verified local preview serves the app and manifest.

## Build verification
Command tested:

```bash
npm install
npm run build
npm run preview
```

Build result: successful.

## Core routes
- `/` — Home / Start Food Mission
- `/craving` — AI craving selector
- `/menu` — Menu browsing
- `/cart` — Cart
- `/checkout` — Checkout
- `/order/:orderId` — Order tracking
- `/track` — Track by order ID
- `/support` — Support
- `/install` — Install guide
- `/admin` — Admin dashboard

Admin password:

```text
cuisinier-admin
```

## PWA files present
- `public/manifest.webmanifest`
- `public/service-worker.js`
- `public/offline.html`
- `public/icons/icon-192.png`
- `public/icons/icon-512.png`
- `public/icons/maskable-512.png`

## Remaining production-level improvements for Codex
1. Test every customer flow in-browser: add to cart, customize item, checkout, tracking, admin status update.
2. Improve mobile bottom-sheet cart if it still behaves like a full page in some states.
3. Add toast notifications for cart/order/admin actions.
4. Improve form validation messages in checkout.
5. Add Supabase integration behind the existing localStorage repository layer.
6. Add environment variables for WhatsApp, bKash, Nagad, Supabase URL/key.
7. Add safer admin authentication before real production launch.
8. Replace placeholder food/logo assets with official brand assets.
9. Run Lighthouse PWA audit after deployment over HTTPS.
10. Deploy to Vercel/Netlify and test Android Chrome install + iOS Safari Add to Home Screen.

---

# Codex Master Prompt

You are the senior production engineer for Cuisinier, an installable PWA food-ordering platform for an AI-powered cloud kitchen in Dhaka.

You are given an existing Vite + React + TypeScript + Tailwind Cuisinier PWA project that already builds successfully. Do not rebuild from scratch unless absolutely necessary. Your job is to audit, fix, polish, and prepare it for production.

## Business rules
- Brand: Cuisinier
- Tagline: AI-Powered Cloud Kitchen
- Night service: 11 PM – 4 AM
- Daytime: Dhanmondi and nearby areas
- Delivery fee: ৳100 fixed
- Payment: COD, bKash Manual, Nagad Manual
- bKash/Nagad require Sender Number + Transaction ID
- Guest checkout is primary; do not force customer login
- Admin password for prototype: `cuisinier-admin`
- Tracking must be status timeline only, not fake GPS
- Cooking/delivery are handled by a third-party partner

## First actions
1. Run `npm install`.
2. Run `npm run build`.
3. Run `npm run preview`.
4. Audit the app manually in browser.
5. Fix any broken route, state, validation, PWA, admin, or tracking issue.

## Must preserve
- Installable PWA structure
- Manifest and service worker
- Offline page
- Customer ordering flow
- Craving selector
- Menu search/filter
- Cart and checkout
- Order success and tracking
- Admin dashboard
- Status update reflecting in tracking
- WhatsApp support/forward logic
- Menu CRUD and settings
- Dark futuristic Midnight AI Kitchen UI

## Production polish priorities
1. Make the app feel extremely premium and interactive on mobile.
2. Keep checkout fast and simple.
3. Make cart actions clear and reliable.
4. Add toast feedback for every important action.
5. Improve empty/error/success states.
6. Ensure all localStorage data updates are reactive.
7. Ensure PWA install prompt works where supported.
8. Ensure Lighthouse PWA basics pass after deployment.
9. Add Supabase adapter but keep localStorage fallback.
10. Keep code modular and easy to maintain.

## Supabase integration plan
Add optional Supabase support without breaking the local prototype:
- `.env.example` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- `src/lib/supabase.ts`
- repository functions that can switch between localStorage and Supabase
- SQL schema already exists in `docs/SUPABASE_SCHEMA.sql`

## Do not
- Do not remove PWA features.
- Do not force customer signup.
- Do not add fake GPS tracking.
- Do not replace the UI with a generic template.
- Do not remove the Cuisinier brand system.
- Do not leave broken flows.

Final output should be a fully working, production-polished, mobile-first installable Cuisinier PWA ready for deployment and further backend integration.
