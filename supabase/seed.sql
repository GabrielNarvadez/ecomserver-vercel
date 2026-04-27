-- Demo data. Run once in Supabase SQL Editor.
-- Re-running will create duplicates; truncate first if you want a clean reset.

-- ─── Products ───
insert into public.products (product_name, sku, price, status) values
  ('Webcake Classic',     'WC-001', 350,  'Active'),
  ('Webcake Deluxe',      'WC-002', 550,  'Active'),
  ('Re-Order Bundle',     'RO-001', 999,  'Active'),
  ('TikTok Promo Pack',   'TT-001', 299,  'Active'),
  ('Legacy Item',         'LG-001', 199,  'Inactive');

-- ─── Customers ───
insert into public.customers (name, contact_number, complete_address, landmark, facebook_link, facebook_page, tags) values
  ('Maria Santos',     '+639171234567', '123 Rizal Street, Quezon City', 'Near SM North',     'https://facebook.com/mariasantos',     'Maria''s Page',     '{"VIP","Repeat"}'),
  ('Juan Dela Cruz',   '+639189876543', '456 Bonifacio Ave, Makati',     'Beside 7-Eleven',   'https://facebook.com/juandc',          'Juan Online',       '{"New"}'),
  ('Ana Reyes',        '+639205556677', '789 Aguinaldo Hwy, Cavite',     'Front of City Hall','https://facebook.com/anareyes',        'Ana Boutique',      '{"VIP"}'),
  ('Carlo Mendoza',    '+639331112233', '321 Mabini St, Pasig',          'Across Mercury',     'https://facebook.com/carlom',          NULL,                '{"Inactive"}'),
  ('Liza Aquino',      '+639427778888', '12 Roxas Blvd, Manila',         'Behind LRT station','https://facebook.com/lizaa',           'Liza Mart',         '{"New","TikTok"}');

-- ─── Orders ───
-- Pull customer IDs into variables so we can link orders to customers.
do $$
declare
  c_maria   uuid := (select id from public.customers where name = 'Maria Santos' limit 1);
  c_juan    uuid := (select id from public.customers where name = 'Juan Dela Cruz' limit 1);
  c_ana     uuid := (select id from public.customers where name = 'Ana Reyes' limit 1);
  c_carlo   uuid := (select id from public.customers where name = 'Carlo Mendoza' limit 1);
  c_liza    uuid := (select id from public.customers where name = 'Liza Aquino' limit 1);
begin
  insert into public.orders (
    customer_id, customer_name, contact_number, complete_address, landmark,
    facebook_link, facebook_page, order_day, order_product, order_quantity,
    amount, order_total, order_type, sales_count, order_source, team_department,
    order_status, assigned_agent, agent_name, agent_facebook, agent_notes, admin_notes
  ) values
    (c_maria, 'Maria Santos',   '+639171234567', '123 Rizal Street, Quezon City', 'Near SM North',
     'https://facebook.com/mariasantos', 'Maria''s Page', current_date - 2, 'Webcake Classic', 2,
     700,  700,  'Standard', 1, 'JNT',         'Webcake 1', 'On Going',          'agent01', 'Carla',  'fb.com/agent.carla', 'Customer prefers JNT', 'Priority delivery'),

    (c_juan,  'Juan Dela Cruz', '+639189876543', '456 Bonifacio Ave, Makati',     'Beside 7-Eleven',
     'https://facebook.com/juandc',      'Juan Online',  current_date - 1, 'Webcake Deluxe', 1,
     550,  550,  'Standard', 1, 'LBC',         'Webcake 2', 'Delivered',         'agent02', 'Rico',   'fb.com/agent.rico',  'Smooth transaction',   NULL),

    (c_ana,   'Ana Reyes',      '+639205556677', '789 Aguinaldo Hwy, Cavite',     'Front of City Hall',
     'https://facebook.com/anareyes',    'Ana Boutique', current_date,     'Re-Order Bundle', 1,
     999,  999,  'Repeat',   3, 'Rider',       'Re-Order',  'On Going',          'agent01', 'Carla',  'fb.com/agent.carla', 'Repeat customer',      'Apply VIP discount'),

    (c_liza,  'Liza Aquino',    '+639427778888', '12 Roxas Blvd, Manila',         'Behind LRT station',
     'https://facebook.com/lizaa',       'Liza Mart',    current_date - 4, 'TikTok Promo Pack', 3,
     897,  897,  'Promo',    1, 'TikTok',      'TikTok',    'Waiting Encashment','agent03', 'Mia',    'fb.com/agent.mia',   'Came from TikTok ad',  NULL),

    (c_carlo, 'Carlo Mendoza',  '+639331112233', '321 Mabini St, Pasig',          'Across Mercury',
     'https://facebook.com/carlom',      NULL,           current_date - 7, 'Webcake Classic', 1,
     350,  350,  'Standard', 1, 'JNT',         'Webcake 1', 'RTS',               'agent02', 'Rico',   'fb.com/agent.rico',  'Customer unreachable', 'Charge RTS fee'),

    (c_juan,  'Juan Dela Cruz', '+639189876543', '456 Bonifacio Ave, Makati',     'Beside 7-Eleven',
     'https://facebook.com/juandc',      'Juan Online',  current_date - 5, 'Webcake Deluxe', 2,
     1100, 1100, 'Upsell',   2, 'Upsell',      'Webcake 2', 'Delivered',         'agent02', 'Rico',   'fb.com/agent.rico',  'Upsold from classic',  NULL),

    (NULL,    'Walk-in Buyer',  '+639998887766', '999 Quezon Ave, Manila',        NULL,
     NULL,                                NULL,           current_date,     'Webcake Classic', 1,
     350,  350,  'Standard', 1, 'Chat Support','Webcake 1', 'On Going',          NULL,      NULL,     NULL,                 'No FB profile yet',    'Manual entry');
end $$;
