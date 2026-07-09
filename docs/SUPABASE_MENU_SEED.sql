-- ============================================================
-- Cuisinier Menu Seed — Official Menu v2.0
-- ============================================================
-- SAFE TO RUN MULTIPLE TIMES. Uses INSERT … ON CONFLICT DO UPDATE
-- (upsert) by item name. No tables are dropped or truncated.
-- Existing orders are never touched.
--
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Upsert requires a unique constraint on name. Add it if missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'menu_items_name_key' AND conrelid = 'public.menu_items'::regclass
  ) THEN
    ALTER TABLE public.menu_items ADD CONSTRAINT menu_items_name_key UNIQUE (name);
  END IF;
END
$$;

-- ── Menu items upsert ────────────────────────────────────────────────────────
-- Uses ON CONFLICT (name) DO UPDATE so:
--   - New items are inserted
--   - Existing items get description/price/tags/flags refreshed to v2.0 values
--   - Admin-edited availability IS preserved (is_available not updated on conflict)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.menu_items
  (id, name, category, description, price, tags, is_available, is_featured, is_midnight_pick, visual_type, image_url, created_at, updated_at)
VALUES
  -- Shawarma
  (uuid_generate_v4(), 'Classic Chicken Shawarma',  'Shawarma',       'Soft wrap, juicy chicken, creamy sauce, fresh veggies.',                 180,  ARRAY['Quick Bite','Popular'],           true, false, false, 'emoji', '🌯', now(), now()),
  (uuid_generate_v4(), 'Cheese Chicken Shawarma',   'Shawarma',       'Extra creamy, cheesy, hot and wrapped for midnight cravings.',           220,  ARRAY['Cheesy','Most Popular'],          true, true,  true,  'emoji', '🌯', now(), now()),
  (uuid_generate_v4(), 'Spicy Chicken Shawarma',    'Shawarma',       'Loaded chicken wrap with spicy kick and smoky sauce.',                   220,  ARRAY['Spicy','Midnight Pick'],          true, true,  true,  'emoji', '🌯', now(), now()),
  -- Burger
  (uuid_generate_v4(), 'Classic Chicken Burger',    'Burger',         'Crispy chicken, soft bun, house sauce, fresh crunch.',                   250,  ARRAY['Popular','Quick Bite'],           true, true,  false, 'emoji', '🍔', now(), now()),
  (uuid_generate_v4(), 'Cheese Burger',             'Burger',         'Melty cheese, juicy chicken, creamy sauce, premium bite.',               300,  ARRAY['Cheesy','Most Popular'],          true, true,  true,  'emoji', '🍔', now(), now()),
  (uuid_generate_v4(), 'Double Patty Burger',       'Burger',         'Double chicken, double hunger control, heavy midnight fuel.',             420,  ARRAY['Heavy Meal'],                     true, true,  false, 'emoji', '🍔', now(), now()),
  -- Pizza
  (uuid_generate_v4(), 'Chicken Cheese Pizza',      'Pizza',          'Cheesy chicken pizza built for group cravings.',                         550,  ARRAY['Cheesy','Group Order'],           true, true,  false, 'emoji', '🍕', now(), now()),
  (uuid_generate_v4(), 'Spicy Chicken Pizza',       'Pizza',          'Spicy chicken, rich cheese, hot midnight energy.',                       580,  ARRAY['Spicy','Midnight Combo'],         true, true,  true,  'emoji', '🍕', now(), now()),
  (uuid_generate_v4(), 'BBQ Chicken Pizza',         'Pizza',          'Smoky BBQ chicken, cheese pull, premium flavor hit.',                    620,  ARRAY['Popular','Group Order'],          true, true,  false, 'emoji', '🍕', now(), now()),
  -- Pasta
  (uuid_generate_v4(), 'Creamy Chicken Pasta',      'Pasta',          'Creamy, cheesy, comforting pasta with chicken.',                         350,  ARRAY['Cheesy','Heavy Meal'],            true, true,  false, 'emoji', '🍝', now(), now()),
  (uuid_generate_v4(), 'Spicy Red Sauce Pasta',     'Pasta',          'Red sauce pasta with a bold spicy kick.',                                330,  ARRAY['Spicy'],                          true, false, false, 'emoji', '🍝', now(), now()),
  (uuid_generate_v4(), 'Alfredo Pasta',             'Pasta',          'Smooth Alfredo sauce, chicken, premium creamy finish.',                  380,  ARRAY['Cheesy','Premium'],               true, true,  false, 'emoji', '🍝', now(), now()),
  -- Fries & Snacks
  (uuid_generate_v4(), 'French Fries',              'Fries & Snacks', 'Crispy golden fries for a quick bite.',                                  150,  ARRAY['Quick Bite'],                     true, false, false, 'emoji', '🍟', now(), now()),
  (uuid_generate_v4(), 'Loaded Fries',              'Fries & Snacks', 'Fries loaded with sauce, cheese, and flavor.',                           280,  ARRAY['Cheesy','Midnight Pick'],         true, true,  true,  'emoji', '🍟', now(), now()),
  (uuid_generate_v4(), 'Chicken Nuggets',           'Fries & Snacks', 'Crispy chicken bites with dip.',                                         260,  ARRAY['Quick Bite'],                     true, false, false, 'emoji', '🍟', now(), now()),
  -- Combos
  (uuid_generate_v4(), 'Midnight Solo Combo',       'Combos',         'One-person late-night hunger fix.',                                       450,  ARRAY['Midnight Combo','Best Value'],    true, true,  true,  'emoji', '🌙', now(), now()),
  (uuid_generate_v4(), 'Couple Craving Combo',      'Combos',         'Two-person combo for shared cravings.',                                   850,  ARRAY['Group Order','Best Value'],       true, true,  false, 'emoji', '⚡', now(), now()),
  (uuid_generate_v4(), 'Monster Hunger Combo',      'Combos',         'Heavy group combo for serious midnight hunger.',                          1200, ARRAY['Heavy Meal','Group Order'],       true, true,  true,  'emoji', '🌙', now(), now()),
  -- Drinks
  (uuid_generate_v4(), 'Soft Drink',                'Drinks',         'Cold drink to complete your meal.',                                       60,   ARRAY['Add-on'],                         true, false, false, 'emoji', '🥤', now(), now()),
  (uuid_generate_v4(), 'Water',                     'Drinks',         'Fresh bottled water.',                                                    30,   ARRAY['Add-on'],                         true, false, false, 'emoji', '🥤', now(), now())

ON CONFLICT (name) DO UPDATE SET
  category        = EXCLUDED.category,
  description     = EXCLUDED.description,
  price           = EXCLUDED.price,
  tags            = EXCLUDED.tags,
  -- DO NOT update is_available — admin may have toggled it intentionally
  is_featured     = EXCLUDED.is_featured,
  is_midnight_pick = EXCLUDED.is_midnight_pick,
  visual_type     = EXCLUDED.visual_type,
  image_url       = EXCLUDED.image_url,
  updated_at      = now();

-- ============================================================
-- Verification query — run after seeding to confirm counts
-- ============================================================
-- SELECT category, count(*) FROM public.menu_items GROUP BY category ORDER BY category;
-- Expected: 7 categories, 20 total items.
-- ============================================================
