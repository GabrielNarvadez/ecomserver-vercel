-- Run this in Supabase SQL Editor to allow the anon key to read/write all tables.
-- Reverse later by running schema.sql again (which re-enables RLS).

alter table public.customers disable row level security;
alter table public.products  disable row level security;
alter table public.orders    disable row level security;
alter table public.profiles  disable row level security;
