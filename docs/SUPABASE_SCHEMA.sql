-- ============================================================
-- Cuisinier Supabase Launch Schema
-- ============================================================
-- Run this in the Supabase SQL editor.
-- The schema matches the current repository layer:
-- menu_items, orders, order_items, settings, order_status_logs
-- ============================================================

create extension if not exists "uuid-ossp";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.menu_items (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null,
  description text,
  price numeric not null,
  visual_type text,
  image_url text,
  tags text[] default '{}',
  is_available boolean default true,
  is_featured boolean default false,
  is_midnight_pick boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  order_code text unique not null,
  customer_name text not null,
  phone text not null,
  address text not null,
  area text not null,
  subtotal numeric not null,
  delivery_fee numeric not null,
  total numeric not null,
  payment_method text not null,
  sender_number text,
  transaction_id text,
  status text not null,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade,
  menu_item_id uuid,
  name text not null,
  price numeric not null,
  quantity integer not null,
  add_ons jsonb,
  item_note text,
  line_total numeric not null,
  created_at timestamptz default now()
);

create table if not exists public.settings (
  id uuid primary key default uuid_generate_v4(),
  delivery_fee numeric default 100,
  night_start_time text default '23:00',
  night_end_time text default '04:00',
  day_service_text text,
  is_accepting_orders boolean default true,
  bkash_number text,
  nagad_number text,
  whatsapp_number text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.order_status_logs (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade,
  status text not null,
  updated_by text,
  created_at timestamptz default now()
);

create index if not exists idx_menu_items_category on public.menu_items(category);
create index if not exists idx_menu_items_available on public.menu_items(is_available);
create index if not exists idx_orders_order_code on public.orders(order_code);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_status_logs_order_id on public.order_status_logs(order_id);

drop trigger if exists trg_menu_items_updated_at on public.menu_items;
create trigger trg_menu_items_updated_at
before update on public.menu_items
for each row
execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

drop trigger if exists trg_settings_updated_at on public.settings;
create trigger trg_settings_updated_at
before update on public.settings
for each row
execute function public.set_updated_at();

alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
alter publication supabase_realtime add table public.order_status_logs;

-- Optional starter row for settings
insert into public.settings (
  delivery_fee,
  night_start_time,
  night_end_time,
  day_service_text,
  is_accepting_orders,
  bkash_number,
  nagad_number,
  whatsapp_number
)
select
  100,
  '23:00',
  '04:00',
  'Daytime: Dhanmondi & nearby areas',
  true,
  '01778307704',
  '+8801677975845',
  '+8801778307704'
where not exists (
  select 1 from public.settings
);

