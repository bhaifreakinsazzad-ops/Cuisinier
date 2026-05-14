# Cuisinier Launch Checklist

## Before Traffic

1. Set real WhatsApp, bKash, and Nagad numbers in admin settings.
   - WhatsApp: `+8801778307704`
   - bKash Personal: `01778307704`
   - Nagad Personal: `+8801677975845`
2. Set `VITE_ADMIN_PASSWORD` in the deployment environment.
3. Set `VITE_ADMIN_SESSION_TTL_MINUTES` to the intended operator session window.
4. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the live backend.
5. Add the custom domain `cuisinier.online` in Vercel.
6. Configure DNS records at the domain provider and wait for HTTPS to be issued.
7. Confirm the deployed app is running over HTTPS.

## Customer Flow

1. Place one COD test order.
2. Place one bKash manual test order.
3. Place one Nagad manual test order.
4. Confirm tracking works from the customer side.
5. Confirm WhatsApp support link opens correctly.
6. Confirm bKash and Nagad checkout cards show the correct destination numbers.

## Admin Flow

1. Log in to `/admin`.
2. Confirm the new orders appear.
3. Open order details.
4. Forward an order to WhatsApp.
5. Move an order through each live status used operationally.
6. Confirm customer tracking reflects the status change.
7. Confirm sender number and transaction ID are visible for manual payments.

## PWA

1. Test Android Chrome install over HTTPS.
2. Test Desktop Chrome install over HTTPS.
3. Test iPhone Safari Add to Home Screen.
4. Test offline shell behavior after first online load.
5. Test standalone mode badge after install.

## Risk Review

1. Confirm admin operators understand that auth is still client-side unless server-side protection or Supabase Auth/RLS is added.
2. Confirm manual payment destination numbers are valid and monitored.
3. Confirm no fake GPS or map experience is shown anywhere.
4. Confirm guest checkout remains primary and no forced login appears.

## Final Go / No-Go

Launch only after:

- build and typecheck are green
- live Supabase sync is verified
- `cuisinier.online` is connected and serving HTTPS
- install behavior is verified on real devices
- admin operations are verified with real numbers
