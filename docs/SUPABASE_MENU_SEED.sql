-- ============================================================
-- Cuisinier Menu Seed — Official Menu v3.0
-- ============================================================
-- SAFE TO RUN MULTIPLE TIMES. Uses INSERT … ON CONFLICT DO UPDATE
-- (upsert) by item name. No tables are dropped or truncated.
-- Existing orders are never touched.
--
-- PREREQUISITE: run docs/SUPABASE_SCHEMA.sql FIRST (or re-run it — it is
-- idempotent). It adds the sizes/flavors/addons/visual_emoji columns this
-- seed writes to, and updates create_order_with_items() to persist
-- selected_size/selected_flavor on order_items. Without that migration,
-- the INSERT below will fail with "column does not exist".
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

-- Old v2.0 items (Shawarma, Combos, generic Pizza/Burger/Pasta names, etc.)
-- are not part of the real menu and are removed so the catalog exactly
-- matches the official menu cards. Safe: orders reference items by name
-- snapshot at order time, not by live FK, so historical orders are unaffected.
DELETE FROM public.menu_items
WHERE name NOT IN (
  'Veggies', 'The Margherita', 'The Pepperoni''s', 'Sea Dive Pizza', 'Four Seasons Pizza',
  'Sausage Fest Pizza', 'BBQ Chicken Pizza', 'Hariyali Chicken Pizza', 'Chicken Alfredo Pizza',
  'Beef Loaded Pizza', 'Mexican Pizza', 'Beef Bolognese Pizza', 'Bacon Bite Pizza',
  'Mint Lemonade', 'Choco Cold Coffee', 'Oreo Crusher',
  'Classic Chicken Burger', 'Classic Beef Burger', 'Chicken Cheese Burger', 'Beef Cheese Burger',
  'Smokey BBQ Chicken Cheese Burger', 'Smokey BBQ Beef Cheese Burger', 'Signature Beef Bacon',
  '2X Chicken Burger', '2X Beef Burger',
  'Smokey BBQ Chicken Wrap', 'Chicken Cheese Wrap', 'Classic Beef Wrap', 'Smoked Beef Bacon Wrap',
  'Chicken Drumsticks Rice Meal', 'Chicken Steak Meal', 'Grilled Dori Meal',
  'Chicken Cashew Nut Salad', 'Greek Salad',
  'Mac N Cheese', 'Italian Pasta', 'American Pasta', 'Fettuccine Alfredo Pasta', 'Spaghetti Beef Bolognese Pasta',
  'French Fries', 'Calamari Fries', 'Fish Finger', 'Fish N Chips', 'Garlic Mushroom',
  '6 Pcs Chicken Wings'
);

-- ── Menu items upsert ────────────────────────────────────────────────────────
-- Uses ON CONFLICT (name) DO UPDATE so:
--   - New items are inserted
--   - Existing items get description/price/tags/flags/sizes/flavors/addons
--     refreshed to v3.0 values
--   - Admin-edited availability IS preserved (is_available not updated on conflict)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.menu_items
  (id, name, category, description, price, tags, is_available, is_featured, is_midnight_pick,
   visual_type, image_url, visual_emoji, sizes, flavors, addons, created_at, updated_at)
VALUES
  -- ══════════════════════════════════════════════════════════════════
  -- 1. CLASSIC FAVORITES (Pizza — 8" / 10" / 12")
  -- ══════════════════════════════════════════════════════════════════
  (uuid_generate_v4(), 'Veggies', 'Classic Favorites',
   'Loaded with mozzarella, cheddar, parmesan, mushroom, black olive, capsicum and sweet corn.',
   290, ARRAY['Cheesy','Popular'], true, true, false, 'image', '/food-pizza.jpg', '🥦',
   '[{"label":"8\"","price":290},{"label":"10\"","price":400},{"label":"12\"","price":530}]'::jsonb,
   NULL,
   '[{"name":"Add More Veggies","priceBySize":{"8\"":30,"10\"":40,"12\"":50}},{"name":"Add More Toppings","priceBySize":{"8\"":50,"10\"":60,"12\"":70}},{"name":"Add More Cheese","priceBySize":{"8\"":80,"10\"":100,"12\"":120}}]'::jsonb,
   now(), now()),
  (uuid_generate_v4(), 'The Margherita', 'Classic Favorites',
   'Tomato base with mozzarella, parmesan, cheddar, oregano and basil.',
   270, ARRAY['Cheesy','Most Popular'], true, true, false, 'image', '/food-pizza.jpg', '🍅',
   '[{"label":"8\"","price":270},{"label":"10\"","price":390},{"label":"12\"","price":540}]'::jsonb,
   NULL,
   '[{"name":"Add More Veggies","priceBySize":{"8\"":30,"10\"":40,"12\"":50}},{"name":"Add More Toppings","priceBySize":{"8\"":50,"10\"":60,"12\"":70}},{"name":"Add More Cheese","priceBySize":{"8\"":80,"10\"":100,"12\"":120}}]'::jsonb,
   now(), now()),
  (uuid_generate_v4(), 'The Pepperoni''s', 'Classic Favorites',
   'Marinara sauce, mozzarella and lots of pepperoni.',
   330, ARRAY['Spicy','Popular'], true, true, true, 'image', '/food-pizza.jpg', '🍕',
   '[{"label":"8\"","price":330},{"label":"10\"","price":450},{"label":"12\"","price":600}]'::jsonb,
   NULL,
   '[{"name":"Add More Veggies","priceBySize":{"8\"":30,"10\"":40,"12\"":50}},{"name":"Add More Toppings","priceBySize":{"8\"":50,"10\"":60,"12\"":70}},{"name":"Add More Cheese","priceBySize":{"8\"":80,"10\"":100,"12\"":120}}]'::jsonb,
   now(), now()),
  (uuid_generate_v4(), 'Sea Dive Pizza', 'Classic Favorites',
   'Tuna, squid, salted shrimp, mushroom, black olive and sweet corn with mozzarella.',
   450, ARRAY['Premium','Group Order'], true, true, false, 'image', '/food-pizza.jpg', '🦑',
   '[{"label":"8\"","price":450},{"label":"10\"","price":610},{"label":"12\"","price":800}]'::jsonb,
   NULL,
   '[{"name":"Add More Veggies","priceBySize":{"8\"":30,"10\"":40,"12\"":50}},{"name":"Add More Toppings","priceBySize":{"8\"":50,"10\"":60,"12\"":70}},{"name":"Add More Cheese","priceBySize":{"8\"":80,"10\"":100,"12\"":120}}]'::jsonb,
   now(), now()),
  (uuid_generate_v4(), 'Four Seasons Pizza', 'Classic Favorites',
   'Choose any four flavors.',
   420, ARRAY['Group Order','Best Value'], true, false, false, 'image', '/food-pizza.jpg', '🍕',
   '[{"label":"8\"","price":420},{"label":"10\"","price":570},{"label":"12\"","price":720}]'::jsonb,
   NULL,
   '[{"name":"Add More Veggies","priceBySize":{"8\"":30,"10\"":40,"12\"":50}},{"name":"Add More Toppings","priceBySize":{"8\"":50,"10\"":60,"12\"":70}},{"name":"Add More Cheese","priceBySize":{"8\"":80,"10\"":100,"12\"":120}}]'::jsonb,
   now(), now()),

  -- ══════════════════════════════════════════════════════════════════
  -- 2. CHICKEN FUSION (Pizza — 8" / 10" / 12")
  -- ══════════════════════════════════════════════════════════════════
  (uuid_generate_v4(), 'Sausage Fest Pizza', 'Chicken Fusion',
   'Spicy chicken, mozzarella, sausage, capsicum, onion, black olive and oregano.',
   360, ARRAY['Spicy','Heavy Meal'], true, true, true, 'image', '/food-pizza.jpg', '🌭',
   '[{"label":"8\"","price":360},{"label":"10\"","price":460},{"label":"12\"","price":650}]'::jsonb,
   NULL,
   '[{"name":"Add More Veggies","priceBySize":{"8\"":30,"10\"":40,"12\"":50}},{"name":"Add More Toppings","priceBySize":{"8\"":50,"10\"":60,"12\"":70}},{"name":"Add More Cheese","priceBySize":{"8\"":80,"10\"":100,"12\"":120}}]'::jsonb,
   now(), now()),
  (uuid_generate_v4(), 'BBQ Chicken Pizza', 'Chicken Fusion',
   'BBQ sauce, smokey BBQ chicken, mozzarella, capsicum, onion and green chili.',
   380, ARRAY['Popular','Spicy'], true, true, false, 'image', '/food-pizza.jpg', '🍗',
   '[{"label":"8\"","price":380},{"label":"10\"","price":470},{"label":"12\"","price":640}]'::jsonb,
   NULL,
   '[{"name":"Add More Veggies","priceBySize":{"8\"":30,"10\"":40,"12\"":50}},{"name":"Add More Toppings","priceBySize":{"8\"":50,"10\"":60,"12\"":70}},{"name":"Add More Cheese","priceBySize":{"8\"":80,"10\"":100,"12\"":120}}]'::jsonb,
   now(), now()),
  (uuid_generate_v4(), 'Hariyali Chicken Pizza', 'Chicken Fusion',
   'Mozzarella, hariyali chicken kabab, capsicum, onion and green chili.',
   350, ARRAY['Spicy'], true, false, false, 'image', '/food-pizza.jpg', '🌿',
   '[{"label":"8\"","price":350},{"label":"10\"","price":480},{"label":"12\"","price":660}]'::jsonb,
   NULL,
   '[{"name":"Add More Veggies","priceBySize":{"8\"":30,"10\"":40,"12\"":50}},{"name":"Add More Toppings","priceBySize":{"8\"":50,"10\"":60,"12\"":70}},{"name":"Add More Cheese","priceBySize":{"8\"":80,"10\"":100,"12\"":120}}]'::jsonb,
   now(), now()),
  (uuid_generate_v4(), 'Chicken Alfredo Pizza', 'Chicken Fusion',
   'Alfredo sauce, chicken, mozzarella, black olive and baby corn.',
   330, ARRAY['Cheesy','Premium'], true, true, false, 'image', '/food-pizza.jpg', '🧀',
   '[{"label":"8\"","price":330},{"label":"10\"","price":480},{"label":"12\"","price":610}]'::jsonb,
   NULL,
   '[{"name":"Add More Veggies","priceBySize":{"8\"":30,"10\"":40,"12\"":50}},{"name":"Add More Toppings","priceBySize":{"8\"":50,"10\"":60,"12\"":70}},{"name":"Add More Cheese","priceBySize":{"8\"":80,"10\"":100,"12\"":120}}]'::jsonb,
   now(), now()),

  -- ══════════════════════════════════════════════════════════════════
  -- 3. BEEF BONANZA (Pizza — 8" / 10" / 12")
  -- ══════════════════════════════════════════════════════════════════
  (uuid_generate_v4(), 'Beef Loaded Pizza', 'Beef Bonanza',
   'Minced beef, mozzarella, parmesan, beef bacon, pepperoni, mushroom, black olive and capsicum.',
   460, ARRAY['Heavy Meal','Premium'], true, true, true, 'image', '/food-pizza.jpg', '🥩',
   '[{"label":"8\"","price":460},{"label":"10\"","price":610},{"label":"12\"","price":740}]'::jsonb,
   NULL,
   '[{"name":"Add More Veggies","priceBySize":{"8\"":30,"10\"":40,"12\"":50}},{"name":"Add More Toppings","priceBySize":{"8\"":50,"10\"":60,"12\"":70}},{"name":"Add More Cheese","priceBySize":{"8\"":80,"10\"":100,"12\"":120}}]'::jsonb,
   now(), now()),
  (uuid_generate_v4(), 'Mexican Pizza', 'Beef Bonanza',
   'Spicy minced beef, mozzarella, sausage, pickled jalapeño, onion and green chili.',
   380, ARRAY['Spicy','Heavy Meal'], true, false, false, 'image', '/food-pizza.jpg', '🌶️',
   '[{"label":"8\"","price":380},{"label":"10\"","price":470},{"label":"12\"","price":640}]'::jsonb,
   NULL,
   '[{"name":"Add More Veggies","priceBySize":{"8\"":30,"10\"":40,"12\"":50}},{"name":"Add More Toppings","priceBySize":{"8\"":50,"10\"":60,"12\"":70}},{"name":"Add More Cheese","priceBySize":{"8\"":80,"10\"":100,"12\"":120}}]'::jsonb,
   now(), now()),
  (uuid_generate_v4(), 'Beef Bolognese Pizza', 'Beef Bonanza',
   'Beef bolognese sauce, mozzarella, parmesan and oregano or chili flakes.',
   380, ARRAY['Heavy Meal'], true, false, false, 'image', '/food-pizza.jpg', '🍝',
   '[{"label":"8\"","price":380},{"label":"10\"","price":520},{"label":"12\"","price":660}]'::jsonb,
   NULL,
   '[{"name":"Add More Veggies","priceBySize":{"8\"":30,"10\"":40,"12\"":50}},{"name":"Add More Toppings","priceBySize":{"8\"":50,"10\"":60,"12\"":70}},{"name":"Add More Cheese","priceBySize":{"8\"":80,"10\"":100,"12\"":120}}]'::jsonb,
   now(), now()),
  (uuid_generate_v4(), 'Bacon Bite Pizza', 'Beef Bonanza',
   'Marinara sauce, minced beef, mozzarella, beef bacon and oregano.',
   360, ARRAY['Heavy Meal','Midnight Pick'], true, true, true, 'image', '/food-pizza.jpg', '🥓',
   '[{"label":"8\"","price":360},{"label":"10\"","price":510},{"label":"12\"","price":650}]'::jsonb,
   NULL,
   '[{"name":"Add More Veggies","priceBySize":{"8\"":30,"10\"":40,"12\"":50}},{"name":"Add More Toppings","priceBySize":{"8\"":50,"10\"":60,"12\"":70}},{"name":"Add More Cheese","priceBySize":{"8\"":80,"10\"":100,"12\"":120}}]'::jsonb,
   now(), now()),

  -- ══════════════════════════════════════════════════════════════════
  -- 4. DRINKS (Small / Large)
  -- ══════════════════════════════════════════════════════════════════
  (uuid_generate_v4(), 'Mint Lemonade', 'Drinks',
   'Refreshing house-made mint lemonade.',
   80, ARRAY['Add-on','Quick Bite'], true, false, false, 'image', '/food-combo.jpg', '🍋',
   '[{"label":"Small","price":80},{"label":"Large","price":100}]'::jsonb, NULL, NULL, now(), now()),
  (uuid_generate_v4(), 'Choco Cold Coffee', 'Drinks',
   'Chilled chocolate cold coffee.',
   100, ARRAY['Add-on'], true, false, true, 'image', '/food-combo.jpg', '☕',
   '[{"label":"Small","price":100},{"label":"Large","price":130}]'::jsonb, NULL, NULL, now(), now()),
  (uuid_generate_v4(), 'Oreo Crusher', 'Drinks',
   'Blended Oreo cookies and cream shake.',
   140, ARRAY['Add-on','Popular'], true, true, true, 'image', '/food-combo.jpg', '🍪',
   '[{"label":"Small","price":140},{"label":"Large","price":190}]'::jsonb, NULL, NULL, now(), now()),

  -- ══════════════════════════════════════════════════════════════════
  -- 5. BURGERS (flat price)
  -- ══════════════════════════════════════════════════════════════════
  (uuid_generate_v4(), 'Classic Chicken Burger', 'Burgers',
   'Crispy chicken fillet, fresh lettuce, house sauce.',
   170, ARRAY['Quick Bite','Popular'], true, false, false, 'image', '/food-burger.jpg', '🍔', NULL, NULL, NULL, now(), now()),
  (uuid_generate_v4(), 'Classic Beef Burger', 'Burgers',
   'Juicy beef patty, fresh lettuce, house sauce.',
   190, ARRAY['Quick Bite'], true, false, false, 'image', '/food-burger.jpg', '🍔', NULL, NULL, NULL, now(), now()),
  (uuid_generate_v4(), 'Chicken Cheese Burger', 'Burgers',
   'Crispy chicken fillet with melted cheese.',
   200, ARRAY['Cheesy','Popular'], true, true, false, 'image', '/food-burger.jpg', '🧀', NULL, NULL, NULL, now(), now()),
  (uuid_generate_v4(), 'Beef Cheese Burger', 'Burgers',
   'Juicy beef patty with melted cheese.',
   220, ARRAY['Cheesy'], true, false, false, 'image', '/food-burger.jpg', '🧀', NULL, NULL, NULL, now(), now()),
  (uuid_generate_v4(), 'Smokey BBQ Chicken Cheese Burger', 'Burgers',
   'Chicken fillet, smokey BBQ sauce, melted cheese.',
   220, ARRAY['Cheesy','Spicy','Most Popular'], true, true, true, 'image', '/food-burger.jpg', '🔥', NULL, NULL, NULL, now(), now()),
  (uuid_generate_v4(), 'Smokey BBQ Beef Cheese Burger', 'Burgers',
   'Beef patty, smokey BBQ sauce, melted cheese.',
   240, ARRAY['Cheesy','Spicy'], true, true, true, 'image', '/food-burger.jpg', '🔥', NULL, NULL, NULL, now(), now()),
  (uuid_generate_v4(), 'Signature Beef Bacon', 'Burgers',
   'Beef patty loaded with crispy beef bacon.',
   330, ARRAY['Premium','Heavy Meal'], true, true, false, 'image', '/food-burger.jpg', '🥓', NULL, NULL, NULL, now(), now()),
  (uuid_generate_v4(), '2X Chicken Burger', 'Burgers',
   'Double chicken patty for double hunger.',
   290, ARRAY['Heavy Meal'], true, false, false, 'image', '/food-burger.jpg', '🍔', NULL, NULL, NULL, now(), now()),
  (uuid_generate_v4(), '2X Beef Burger', 'Burgers',
   'Double beef patty for serious hunger.',
   400, ARRAY['Heavy Meal','Group Order'], true, false, true, 'image', '/food-burger.jpg', '🍔', NULL, NULL, NULL, now(), now()),

  -- ══════════════════════════════════════════════════════════════════
  -- 6. WRAPS (flat price)
  -- ══════════════════════════════════════════════════════════════════
  (uuid_generate_v4(), 'Smokey BBQ Chicken Wrap', 'Wraps',
   'Grilled chicken, smokey BBQ sauce, wrapped fresh.',
   170, ARRAY['Quick Bite','Spicy'], true, false, false, 'image', '/food-shawarma.jpg', '🌯', NULL, NULL, NULL, now(), now()),
  (uuid_generate_v4(), 'Chicken Cheese Wrap', 'Wraps',
   'Grilled chicken with melted cheese, wrapped fresh.',
   190, ARRAY['Cheesy','Quick Bite'], true, true, false, 'image', '/food-shawarma.jpg', '🧀', NULL, NULL, NULL, now(), now()),
  (uuid_generate_v4(), 'Classic Beef Wrap', 'Wraps',
   'Seasoned beef strips, fresh veggies, wrapped fresh.',
   210, ARRAY['Quick Bite'], true, false, false, 'image', '/food-shawarma.jpg', '🌯', NULL, NULL, NULL, now(), now()),
  (uuid_generate_v4(), 'Smoked Beef Bacon Wrap', 'Wraps',
   'Smoked beef bacon, fresh veggies, wrapped fresh.',
   230, ARRAY['Midnight Pick'], true, false, true, 'image', '/food-shawarma.jpg', '🥓', NULL, NULL, NULL, now(), now()),

  -- ══════════════════════════════════════════════════════════════════
  -- 7. SET MENU (flat price)
  -- ══════════════════════════════════════════════════════════════════
  (uuid_generate_v4(), 'Chicken Drumsticks Rice Meal', 'Set Menu',
   'Grilled chicken drumsticks served with rice and vegetables.',
   230, ARRAY['Heavy Meal'], true, false, false, 'image', '/food-combo.jpg', '🍚', NULL, NULL, NULL, now(), now()),
  (uuid_generate_v4(), 'Chicken Steak Meal', 'Set Menu',
   'Pan-seared chicken steak with sides.',
   340, ARRAY['Premium','Heavy Meal'], true, true, false, 'image', '/food-combo.jpg', '🍗', NULL, NULL, NULL, now(), now()),
  (uuid_generate_v4(), 'Grilled Dori Meal', 'Set Menu',
   'Grilled dori fish fillet with sides.',
   390, ARRAY['Premium'], true, false, false, 'image', '/food-combo.jpg', '🐟', NULL, NULL, NULL, now(), now()),

  -- ══════════════════════════════════════════════════════════════════
  -- 8. SALADS (flat price)
  -- ══════════════════════════════════════════════════════════════════
  (uuid_generate_v4(), 'Chicken Cashew Nut Salad', 'Salads',
   'Grilled chicken, fresh greens, roasted cashew nuts.',
   270, ARRAY['Premium'], true, false, false, 'image', '/food-combo.jpg', '🥗', NULL, NULL, NULL, now(), now()),
  (uuid_generate_v4(), 'Greek Salad', 'Salads',
   'Fresh greens, olives, feta, tomato, cucumber.',
   380, ARRAY['Premium'], true, false, false, 'image', '/food-combo.jpg', '🫒', NULL, NULL, NULL, now(), now()),

  -- ══════════════════════════════════════════════════════════════════
  -- 9. PASTA (flat price)
  -- ══════════════════════════════════════════════════════════════════
  (uuid_generate_v4(), 'Mac N Cheese', 'Pasta',
   'Classic macaroni in a rich, melty cheese sauce.',
   270, ARRAY['Cheesy','Popular'], true, true, false, 'image', '/food-pasta.jpg', '🧀', NULL, NULL, NULL, now(), now()),
  (uuid_generate_v4(), 'Italian Pasta', 'Pasta',
   'Pasta tossed in classic Italian herbs and tomato sauce.',
   240, ARRAY['Quick Bite'], true, false, false, 'image', '/food-pasta.jpg', '🍝', NULL, NULL, NULL, now(), now()),
  (uuid_generate_v4(), 'American Pasta', 'Pasta',
   'Creamy American-style pasta with chicken.',
   260, ARRAY['Cheesy'], true, false, false, 'image', '/food-pasta.jpg', '🍝', NULL, NULL, NULL, now(), now()),
  (uuid_generate_v4(), 'Fettuccine Alfredo Pasta', 'Pasta',
   'Fettuccine in a smooth, creamy Alfredo sauce.',
   320, ARRAY['Cheesy','Premium'], true, true, false, 'image', '/food-pasta.jpg', '🧈', NULL, NULL, NULL, now(), now()),
  (uuid_generate_v4(), 'Spaghetti Beef Bolognese Pasta', 'Pasta',
   'Spaghetti in a rich, slow-cooked beef bolognese sauce.',
   330, ARRAY['Heavy Meal'], true, true, true, 'image', '/food-pasta.jpg', '🥩', NULL, NULL, NULL, now(), now()),

  -- ══════════════════════════════════════════════════════════════════
  -- 10. FRIES & SIDES (flat price)
  -- ══════════════════════════════════════════════════════════════════
  (uuid_generate_v4(), 'French Fries', 'Fries & Sides',
   'Crispy golden fries, perfectly salted.',
   140, ARRAY['Quick Bite'], true, false, false, 'image', '/food-fries.jpg', '🍟', NULL, NULL, NULL, now(), now()),
  (uuid_generate_v4(), 'Calamari Fries', 'Fries & Sides',
   'Crispy fried calamari rings, served hot.',
   270, ARRAY['Premium'], true, true, false, 'image', '/food-fries.jpg', '🦑', NULL, NULL, NULL, now(), now()),
  (uuid_generate_v4(), 'Fish Finger', 'Fries & Sides',
   'Crispy breaded fish fingers, served hot.',
   240, ARRAY['Quick Bite'], true, false, false, 'image', '/food-fries.jpg', '🐟', NULL, NULL, NULL, now(), now()),
  (uuid_generate_v4(), 'Fish N Chips', 'Fries & Sides',
   'Crispy battered fish with a side of golden fries.',
   280, ARRAY['Heavy Meal'], true, false, false, 'image', '/food-fries.jpg', '🐟', NULL, NULL, NULL, now(), now()),
  (uuid_generate_v4(), 'Garlic Mushroom', 'Fries & Sides',
   'Sautéed mushrooms in garlic butter.',
   240, ARRAY['Quick Bite'], true, false, false, 'image', '/food-fries.jpg', '🍄', NULL, NULL, NULL, now(), now()),

  -- ══════════════════════════════════════════════════════════════════
  -- 11. CHICKEN WINGS (flat price, flavor choice)
  -- ══════════════════════════════════════════════════════════════════
  (uuid_generate_v4(), '6 Pcs Chicken Wings', 'Chicken Wings',
   'Six crispy chicken wings. Choose your flavor: BBQ, Naga, or Crispy.',
   230, ARRAY['Spicy','Midnight Pick'], true, true, true, 'image', '/food-fries.jpg', '🍗',
   NULL,
   '[{"label":"BBQ"},{"label":"Naga"},{"label":"Crispy"}]'::jsonb,
   NULL, now(), now())

ON CONFLICT (name) DO UPDATE SET
  category         = EXCLUDED.category,
  description      = EXCLUDED.description,
  price            = EXCLUDED.price,
  tags             = EXCLUDED.tags,
  -- DO NOT update is_available — admin may have toggled it intentionally
  is_featured      = EXCLUDED.is_featured,
  is_midnight_pick = EXCLUDED.is_midnight_pick,
  visual_type      = EXCLUDED.visual_type,
  image_url        = EXCLUDED.image_url,
  visual_emoji     = EXCLUDED.visual_emoji,
  sizes            = EXCLUDED.sizes,
  flavors          = EXCLUDED.flavors,
  addons           = EXCLUDED.addons,
  updated_at       = now();

-- ============================================================
-- Verification query — run after seeding to confirm counts
-- ============================================================
-- SELECT category, count(*) FROM public.menu_items GROUP BY category ORDER BY category;
-- Expected: 11 categories, 45 total items.
-- ============================================================
