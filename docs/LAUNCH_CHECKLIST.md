# Cuisinier Launch Checklist

## Before Traffic

1. Set real WhatsApp, bKash, and Nagad numbers in admin settings.
   - WhatsApp: `+8801778307704`
   - bKash Personal: `01778307704`
   - Nagad Personal: `+8801677975845`
2. Set `ADMIN_PASSWORD` (server-side) and `ADMIN_SESSION_SECRET` in Vercel env.
3. Set `ADMIN_SESSION_TTL_MINUTES` to the intended operator session window (default 480).
4. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the live backend.
5. Set `SUPABASE_SERVICE_ROLE_KEY` (server-side only, never expose to browser).
6. Run `docs/SUPABASE_SCHEMA.sql` in Supabase SQL Editor if schema is fresh.
7. Run `docs/SUPABASE_MENU_SEED.sql` in Supabase SQL Editor to seed official menu v2.0.
8. Add the custom domain `cuisinier.online` in Vercel.
9. Configure DNS records at the domain provider and wait for HTTPS to be issued.
10. Confirm the deployed app is running over HTTPS.

## Menu Verification

1. Confirm all 7 categories appear on the menu: Shawarma, Burger, Pizza, Pasta, Fries & Snacks, Combos, Drinks.
2. Confirm all 20 official menu items are visible.
3. Confirm featured items appear on home page / hero section.
4. Confirm Midnight Pick items show the 🌙 badge.
5. Confirm Quick Add button works for each item.
6. Confirm Customize / Item Detail modal opens correctly.
7. Confirm add-ons (Extra Cheese, Extra Sauce, Extra Spicy) show and update the total.
8. Confirm unavailable items are visible but cannot be added to cart.
9. Confirm cart subtotal is correct after adding multiple items with add-ons.
10. Confirm admin menu edit changes reflect on customer menu immediately.

## Customer Flow

1. Place one COD test order.
2. Place one bKash manual test order.
3. Place one Nagad manual test order.
4. Confirm tracking works from the customer side.
5. Confirm WhatsApp support link opens correctly.
6. Confirm bKash and Nagad checkout cards show the correct destination numbers.
7. Confirm checkout order summary shows items, add-ons, notes, subtotal, delivery fee, and total.
8. Confirm order success shows order code and tracking link.

## Admin Flow

1. Log in to `/admin`.
2. Confirm all 20 menu items appear in Menu Manager.
3. Confirm category filter in Menu Manager works.
4. Edit a menu item price and confirm it updates on customer menu.
5. Toggle availability off on an item and confirm it is greyed out on customer menu.
6. Toggle it back on.
7. Add a new test item and confirm it appears.
8. Delete the test item.
9. Confirm new orders appear in order list.
10. Open order details.
11. Forward an order to WhatsApp.
12. Move an order through each live status.
13. Confirm customer tracking reflects the status change.
14. Confirm sender number and transaction ID are visible for manual payments.

## Craving Selector

1. Select Cheesy mood → confirm cheesy items recommended.
2. Select Spicy mood → confirm spicy items recommended.
3. Select Monster Hunger + Group → confirm Combos/Pizza prioritized.
4. Confirm Quick Add and Customize work from craving result cards.

## PWA

1. Test Android Chrome install over HTTPS.
2. Test Desktop Chrome install over HTTPS.
3. Test iPhone Safari Add to Home Screen.
4. Test offline shell behavior after first online load.
5. Test standalone mode badge after install.

## Risk Review

1. Confirm `ADMIN_PASSWORD` is set server-side and `VITE_ADMIN_PASSWORD` is blank in production.
2. Confirm `SUPABASE_SERVICE_ROLE_KEY` is not exposed in any client bundle.
3. Confirm manual payment destination numbers are valid and monitored.
4. Confirm no fake GPS or map experience is shown anywhere.
5. Confirm guest checkout remains primary and no forced login appears.

## Final Go / No-Go

Launch only after:

- build and typecheck are green
- live Supabase sync is verified (menu loads from Supabase, not just localStorage)
- `docs/SUPABASE_MENU_SEED.sql` has been run and all 20 items confirmed in Supabase
- `cuisinier.online` is connected and serving HTTPS
- install behavior is verified on real devices
- admin operations are verified with real numbers
- one full test order placed and received in admin dashboard
