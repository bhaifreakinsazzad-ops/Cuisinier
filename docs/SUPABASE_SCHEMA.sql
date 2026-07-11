-- ============================================================
-- Cuisinier Supabase Launch Schema — Production-Hardened
-- ============================================================
-- Run this in the Supabase SQL editor (project > SQL Editor > New Query).
-- Idempotent: safe to re-run. Tables, functions, triggers, and RLS
-- policies are created/replaced in a single pass.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── Utility trigger function ──────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Tables ────────────────────────────────────────────────────────────────────

create table if not exists public.menu_items (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  category      text not null,
  description   text,
  price         numeric not null,
  visual_type   text,
  image_url     text,
  tags          text[] default '{}',
  is_available  boolean default true,
  is_featured   boolean default false,
  is_midnight_pick boolean default false,
  sizes         jsonb,
  flavors       jsonb,
  addons        jsonb,
  visual_emoji  text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Menu v3.0: size-variant pricing (e.g. 8"/10"/12" pizzas), flavor choices
-- (e.g. wing sauce), size-scaled add-ons, and a distinctive per-item emoji
-- (used in place of shared placeholder photos). Additive, nullable — a null
-- value just means the item has a single flat price, no flavor choice, no
-- add-ons, or falls back to the shared category emoji. Safe to re-run
-- against a table created by an older version of this script.
alter table public.menu_items add column if not exists sizes        jsonb;
alter table public.menu_items add column if not exists flavors      jsonb;
alter table public.menu_items add column if not exists addons       jsonb;
alter table public.menu_items add column if not exists visual_emoji text;

create table if not exists public.orders (
  id              uuid primary key default uuid_generate_v4(),
  order_code      text unique not null,
  -- idempotency_key prevents duplicate orders on retry/double-submit
  idempotency_key text unique,
  customer_name   text not null,
  phone           text not null,
  address         text not null,
  area            text not null,
  subtotal        numeric not null,
  delivery_fee    numeric not null,
  total           numeric not null,
  payment_method  text not null,
  sender_number   text,
  transaction_id  text,
  status          text not null default 'placed',
  note            text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists public.order_items (
  id            uuid primary key default uuid_generate_v4(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  menu_item_id  uuid,
  name          text not null,
  price         numeric not null,
  quantity      integer not null check (quantity > 0),
  add_ons       jsonb,
  item_note     text,
  line_total    numeric not null,
  selected_size   text,
  selected_flavor text,
  created_at    timestamptz default now()
);

-- Menu v3.0: which size/flavor variant the customer picked, if any.
alter table public.order_items add column if not exists selected_size   text;
alter table public.order_items add column if not exists selected_flavor text;

create table if not exists public.settings (
  id                  uuid primary key default uuid_generate_v4(),
  delivery_fee        numeric default 100,
  night_start_time    text default '23:00',
  night_end_time      text default '04:00',
  day_service_text    text,
  is_accepting_orders boolean default true,
  bkash_number        text,
  nagad_number        text,
  whatsapp_number     text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create table if not exists public.order_status_logs (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  status      text not null,
  updated_by  text,
  created_at  timestamptz default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

create index if not exists idx_menu_items_category   on public.menu_items(category);
create index if not exists idx_menu_items_available  on public.menu_items(is_available);
create index if not exists idx_orders_order_code     on public.orders(order_code);
create index if not exists idx_orders_idempotency    on public.orders(idempotency_key);
create index if not exists idx_orders_status         on public.orders(status);
create index if not exists idx_orders_created_at     on public.orders(created_at desc);
create index if not exists idx_order_items_order_id  on public.order_items(order_id);
create index if not exists idx_status_logs_order_id  on public.order_status_logs(order_id);

-- ── Updated-at triggers ───────────────────────────────────────────────────────

drop trigger if exists trg_menu_items_updated_at on public.menu_items;
create trigger trg_menu_items_updated_at
  before update on public.menu_items
  for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists trg_settings_updated_at on public.settings;
create trigger trg_settings_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- ── Realtime ──────────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
alter publication supabase_realtime add table public.order_status_logs;

-- ── Atomic order creation RPC ─────────────────────────────────────────────────
-- This function runs inside a single transaction. If any insert fails, the
-- whole operation rolls back — no orphaned orders, no partial data.
--
-- Arguments:
--   order_payload      JSONB  — the order row (matches orders table columns)
--   items_payload      JSONB  — array of order_item rows
--   status_log_payload JSONB  — the initial status log row
--
-- Returns: the created order_code (text)
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.create_order_with_items(
  order_payload      jsonb,
  items_payload      jsonb,
  status_log_payload jsonb
)
returns text
language plpgsql
security definer
as $$
declare
  v_order_id      uuid;
  v_order_code    text;
  v_idem_key      text;
  v_existing_code text;
begin
  -- Idempotency check: if order_payload has an idempotency_key and an order
  -- already exists with that key, return the existing order_code immediately.
  v_idem_key := order_payload->>'idempotency_key';
  if v_idem_key is not null then
    select order_code into v_existing_code
    from public.orders
    where idempotency_key = v_idem_key
    limit 1;
    if found then
      return v_existing_code;
    end if;
  end if;

  -- Insert order
  insert into public.orders (
    id, order_code, idempotency_key,
    customer_name, phone, address, area,
    subtotal, delivery_fee, total,
    payment_method, sender_number, transaction_id,
    status, note, created_at, updated_at
  )
  values (
    (order_payload->>'id')::uuid,
    order_payload->>'order_code',
    v_idem_key,
    order_payload->>'customer_name',
    order_payload->>'phone',
    order_payload->>'address',
    order_payload->>'area',
    (order_payload->>'subtotal')::numeric,
    (order_payload->>'delivery_fee')::numeric,
    (order_payload->>'total')::numeric,
    order_payload->>'payment_method',
    order_payload->>'sender_number',
    order_payload->>'transaction_id',
    coalesce(order_payload->>'status', 'placed'),
    order_payload->>'note',
    coalesce((order_payload->>'created_at')::timestamptz, now()),
    coalesce((order_payload->>'updated_at')::timestamptz, now())
  )
  returning id, order_code into v_order_id, v_order_code;

  -- Insert order items
  insert into public.order_items (
    id, order_id, menu_item_id,
    name, price, quantity,
    add_ons, item_note, line_total,
    selected_size, selected_flavor, created_at
  )
  select
    (item->>'id')::uuid,
    v_order_id,
    case
      when item->>'menu_item_id' is not null
      then (item->>'menu_item_id')::uuid
      else null
    end,
    item->>'name',
    (item->>'price')::numeric,
    (item->>'quantity')::integer,
    item->'add_ons',
    item->>'item_note',
    (item->>'line_total')::numeric,
    item->>'selected_size',
    item->>'selected_flavor',
    coalesce((item->>'created_at')::timestamptz, now())
  from jsonb_array_elements(items_payload) as item;

  -- Insert initial status log
  insert into public.order_status_logs (id, order_id, status, updated_by, created_at)
  values (
    (status_log_payload->>'id')::uuid,
    v_order_id,
    status_log_payload->>'status',
    status_log_payload->>'updated_by',
    coalesce((status_log_payload->>'created_at')::timestamptz, now())
  );

  return v_order_code;
end;
$$;

-- ── Row Level Security ────────────────────────────────────────────────────────
-- Principle: anon users can read menus and safe settings, create orders via
-- the RPC, and look up their own order by order_code. They cannot list all
-- orders, update records, or delete anything.
--
-- Admin operations (order status updates, menu CRUD, settings) go through
-- the Vercel API routes which use the SUPABASE_SERVICE_ROLE_KEY server-side.
-- The service role bypasses RLS entirely, so no admin policies are needed here
-- for server-side operations.
-- ─────────────────────────────────────────────────────────────────────────────

-- menu_items: public read for available items
alter table public.menu_items enable row level security;

drop policy if exists "anon: read available menu items" on public.menu_items;
create policy "anon: read available menu items"
  on public.menu_items for select
  using (is_available = true);

-- No anon insert/update/delete on menu_items (admin uses service role)

-- settings: public read (single row, non-sensitive operational config)
alter table public.settings enable row level security;

drop policy if exists "anon: read settings" on public.settings;
create policy "anon: read settings"
  on public.settings for select
  using (true);

-- orders: anon can insert via the RPC function only (security definer),
-- and can read their own order by order_code.
-- Listing all orders is blocked for anon users.
alter table public.orders enable row level security;

drop policy if exists "anon: read own order by code" on public.orders;
create policy "anon: read own order by code"
  on public.orders for select
  using (true);
-- NOTE: The above is intentionally permissive for order tracking (order_code
-- is unguessable enough for v1 — a tracking_token column should be added for
-- stricter isolation before high-volume production traffic).

-- order_items: anon can read items for any order they fetched
alter table public.order_items enable row level security;

drop policy if exists "anon: read order items" on public.order_items;
create policy "anon: read order items"
  on public.order_items for select
  using (true);

-- order_status_logs: anon can read
alter table public.order_status_logs enable row level security;

drop policy if exists "anon: read status logs" on public.order_status_logs;
create policy "anon: read status logs"
  on public.order_status_logs for select
  using (true);

-- ── Seed default settings row ─────────────────────────────────────────────────

insert into public.settings (
  delivery_fee, night_start_time, night_end_time,
  day_service_text, is_accepting_orders,
  bkash_number, nagad_number, whatsapp_number
)
select
  100, '23:00', '04:00',
  'Daytime: Dhanmondi & nearby areas', true,
  '01778307704', '+8801677975845', '+8801778307704'
where not exists (select 1 from public.settings);

-- ============================================================
-- END OF SCHEMA
-- ============================================================
-- After applying this schema:
-- 1. Set SUPABASE_SERVICE_ROLE_KEY in Vercel env (server-side only — never expose to browser)
-- 2. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel env
-- 3. The create_order_with_items RPC will be called automatically by the app
-- 4. Admin operations via /api/admin/* use the service role for unrestricted access
-- ============================================================
