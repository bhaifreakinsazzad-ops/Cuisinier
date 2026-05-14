# Cuisinier QA Checklist

## Customer

- Home loads
- Start Food Mission works
- Craving flow works
- Recommendations render
- Quick Add works
- Customize modal works
- Menu search works
- Category filter works
- Tag filter works
- Unavailable menu items are shown clearly
- Add-ons update totals
- Item note saves
- Cart persists after refresh
- Quantity update works
- Remove item works
- Delivery fee shows as `BDT 100` by default
- COD checkout works
- bKash validation works
- Nagad validation works
- Invalid phone is blocked
- Invalid sender number is blocked
- Invalid transaction ID is blocked
- Missing payment destination number blocks manual payment
- Order ID generates correctly
- Order saves
- Cart clears after successful order
- Success and tracking page show correct data
- `/order/:orderId` works
- WhatsApp support works
- Install CTA works or fallback instruction shows

## Admin

- Admin login works
- Env password works
- Dev fallback works only if env is missing
- Session TTL works
- Logout works
- Orders appear
- Order detail opens
- Payment details show
- Status update works
- Customer tracking reflects status update
- WhatsApp forward works
- Menu add works
- Menu edit works
- Menu delete works
- Menu availability toggle works
- Featured toggle works
- Midnight Pick toggle works
- Settings save works
- Accepting orders toggle disables checkout
- Overview stats calculate correctly

## Backend

- localStorage fallback works
- Supabase mode remains supported
- Missing env vars do not crash the app
- Orders do not corrupt between localStorage and Supabase paths
- Remote order item writes do not send invalid UUID values
- Status update targets `order_code`
- Tracking polling and subscription remain stable

## PWA

- Manifest exists
- Service worker exists
- Service worker registration works
- Offline fallback exists
- Install CTA works or fallback instruction shows
- `/install` route works
- Standalone badge works
- Theme color is `#ff7a00`
- Background color is `#080808`
- Icons are referenced correctly
- Install prompt does not keep reappearing after dismissal

## Deployment

- `npm install` passes
- `npm run typecheck` passes
- `npm run build` passes
- HTTPS deploy is available
- Real-device install testing is completed
- Real Supabase sync is verified on deployed environment
