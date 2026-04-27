-- Run in Supabase SQL Editor whenever the app expects a column the schema doesn't have.

-- 2026-04-27: orders needs order_total + admin_name (used in OrderDetail.jsx)
alter table public.orders add column if not exists order_total numeric;
alter table public.orders add column if not exists admin_name  text;
