-- Run this once in Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run).

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: bump updated_date on every UPDATE
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.touch_updated_date()
returns trigger as $$
begin
  new.updated_date = now();
  return new;
end;
$$ language plpgsql;

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles  (one row per auth user, holds role + display name)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  full_name    text,
  role         text not null default 'agent' check (role in ('admin', 'agent')),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_date();

-- Auto-create a profile row whenever a new auth user signs up.
-- First user becomes admin; everyone after defaults to agent.
create or replace function public.handle_new_auth_user()
returns trigger as $$
declare
  user_count int;
  default_role text;
begin
  select count(*) into user_count from public.profiles;
  default_role := case when user_count = 0 then 'admin' else 'agent' end;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    default_role
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- customers
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.customers (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  contact_number   text,
  complete_address text,
  landmark         text,
  facebook_link    text,
  facebook_page    text,
  tags             text[] not null default '{}',
  created_date     timestamptz not null default now(),
  updated_date     timestamptz not null default now()
);

drop trigger if exists customers_touch on public.customers;
create trigger customers_touch before update on public.customers
  for each row execute function public.touch_updated_date();

-- ─────────────────────────────────────────────────────────────────────────────
-- products
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  product_name text not null,
  sku          text,
  price        numeric not null default 0,
  status       text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_date();

-- ─────────────────────────────────────────────────────────────────────────────
-- orders
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  customer_id      uuid references public.customers(id) on delete set null,
  customer_name    text not null,
  contact_number   text,
  complete_address text,
  landmark         text,
  facebook_link    text,
  facebook_page    text,
  order_day        date,
  order_product    text,
  order_quantity   numeric default 1,
  amount           numeric default 0,
  order_type       text,
  sales_count      numeric,
  order_source     text check (order_source in ('JNT','LBC','Rider','Abandoned','Upsell','TikTok','Chat Support','Shopee')),
  team_department  text check (team_department in ('Webcake 1','Webcake 2','Re-Order','TikTok','Legal')),
  order_status     text not null check (order_status in ('On Going','Delivered','RTS','Cancel','Waiting Encashment','Paid Penalty Cancel','Paid Penalty RTS','Reship')),
  assigned_agent   text,
  agent_name       text,
  agent_facebook   text,
  agent_notes      text,
  admin_notes      text,
  edit_history     jsonb not null default '[]'::jsonb,
  last_updated_by  text,
  created_date     timestamptz not null default now(),
  updated_date     timestamptz not null default now()
);

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_date();

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- Any authenticated user can read/write any row. The app handles role-based UI
-- (admin-only Settings, etc.) on the client. Tighten later if needed.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.profiles  enable row level security;
alter table public.customers enable row level security;
alter table public.products  enable row level security;
alter table public.orders    enable row level security;

-- profiles: everyone authenticated can read; only admins can update/delete others.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated using (id = auth.uid());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- customers / products / orders: any authenticated user has full CRUD.
drop policy if exists customers_all on public.customers;
create policy customers_all on public.customers
  for all to authenticated using (true) with check (true);

drop policy if exists products_all on public.products;
create policy products_all on public.products
  for all to authenticated using (true) with check (true);

drop policy if exists orders_all on public.orders;
create policy orders_all on public.orders
  for all to authenticated using (true) with check (true);
