# Cuisinier Developer Handoff

## Architecture

- Vite single-page app
- React Router handles public and admin routes
- `src/data/storage.ts` is the local persistence layer
- `src/data/repository.ts` is the active repository boundary
- Repository uses Supabase when env vars exist and localStorage when they do not
- PWA assets live in `public/`

## Important Files

- [src/App.tsx](/F:/HQ/Codex/Cuisinier/cuisinier_kimi_fixed/src/App.tsx)
- [src/main.tsx](/F:/HQ/Codex/Cuisinier/cuisinier_kimi_fixed/src/main.tsx)
- [src/data/storage.ts](/F:/HQ/Codex/Cuisinier/cuisinier_kimi_fixed/src/data/storage.ts)
- [src/data/repository.ts](/F:/HQ/Codex/Cuisinier/cuisinier_kimi_fixed/src/data/repository.ts)
- [src/lib/supabase.ts](/F:/HQ/Codex/Cuisinier/cuisinier_kimi_fixed/src/lib/supabase.ts)
- [src/lib/adminAuth.ts](/F:/HQ/Codex/Cuisinier/cuisinier_kimi_fixed/src/lib/adminAuth.ts)
- [src/lib/analytics.ts](/F:/HQ/Codex/Cuisinier/cuisinier_kimi_fixed/src/lib/analytics.ts)
- [src/components/customer/HomeHero.tsx](/F:/HQ/Codex/Cuisinier/cuisinier_kimi_fixed/src/components/customer/HomeHero.tsx)
- [src/components/customer/CheckoutPage.tsx](/F:/HQ/Codex/Cuisinier/cuisinier_kimi_fixed/src/components/customer/CheckoutPage.tsx)
- [src/components/customer/TrackingPage.tsx](/F:/HQ/Codex/Cuisinier/cuisinier_kimi_fixed/src/components/customer/TrackingPage.tsx)
- [src/components/admin/AdminDashboard.tsx](/F:/HQ/Codex/Cuisinier/cuisinier_kimi_fixed/src/components/admin/AdminDashboard.tsx)
- [public/manifest.webmanifest](/F:/HQ/Codex/Cuisinier/cuisinier_kimi_fixed/public/manifest.webmanifest)
- [public/service-worker.js](/F:/HQ/Codex/Cuisinier/cuisinier_kimi_fixed/public/service-worker.js)

## Repository Layer

Reads and writes go through `src/data/repository.ts`.

- `menuRepository`
- `orderRepository`
- `settingsRepository`

Supabase mode:

- Loads menu, orders, order items, and settings from Supabase
- Writes orders, order items, and status logs to Supabase
- Updates status by `order_code`
- Normalizes remote order item writes so local-only IDs are not inserted into UUID columns

Fallback mode:

- Uses localStorage only
- Emits `cuisinier:data` so screens refresh in the same browser tab

## Local Storage Keys

- `cuisinier_menu_items`
- `cuisinier_orders`
- `cuisinier_cart`
- `cuisinier_settings`
- `cuisinier_admin_session`

## Admin Auth

- Password uses `VITE_ADMIN_PASSWORD` when provided
- Local fallback remains `cuisinier-admin` when env is missing
- Session TTL uses `VITE_ADMIN_SESSION_TTL_MINUTES`
- Session state is stored locally and validated on route entry

Risk:

- This is still client-side admin protection, not production-grade server-side auth

Recommended hardening:

1. Move admin mutations behind server-side functions
2. Add Supabase Auth for operators
3. Restrict table writes with RLS and role-aware policies

## PWA

- Installable manifest is configured
- Service worker is registered from app entry
- Offline fallback page exists
- Install prompt has dismissal persistence
- `/install` explains manual install steps
- Standalone mode badge appears when launched as an installed app

## ElevenLabs Widget

- Customer-only widget component: [src/components/customer/ElevenLabsAgentWidget.tsx](/F:/HQ/Codex/Cuisinier/Cuisinier_github_push/src/components/customer/ElevenLabsAgentWidget.tsx)
- Custom element: `<elevenlabs-convai>`
- Agent ID: `agent_6801krp4gs21fm49n6jdxv19s0qb`
- Script URL: `https://unpkg.com/@elevenlabs/convai-widget-embed`
- Visible on customer routes only: `/`, `/menu`, `/cart`, `/checkout`, `/track`, `/order/:orderId`, `/support`, `/install`
- Excluded from `/admin` and all admin subroutes
- The script loads asynchronously and only once; if ElevenLabs is blocked or unavailable, the rest of the app still works normally
- No private API key is required or stored
- Do not add the widget script to the service worker precache

## Performance

- Public and admin screens are lazy-loaded
- Vendor chunks are split in `vite.config.ts`
- Keep additional dependencies lightweight

## Continue Safely

1. Preserve the repository boundary
2. Keep localStorage fallback intact
3. Do not force customer login
4. Do not add fake GPS tracking
5. Re-run `npm run typecheck` and `npm run build` after each substantial change
