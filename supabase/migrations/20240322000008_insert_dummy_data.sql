-- Insert dummy property
INSERT INTO public.properties (
  id,
  name,
  address,
  description,
  property_type,
  bedrooms,
  bathrooms,
  square_feet,
  monthly_rent,
  deposit_amount,
  lease_start_date,
  lease_end_date,
  status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Sunset Apartments Unit 2B',
  '123 Main Street, Apartment 2B, Downtown City, State 12345',
  'Modern 2-bedroom apartment with city views, updated kitchen, and in-unit laundry. Located in the heart of downtown with easy access to public transportation.',
  'apartment',
  2,
  2,
  950,
  1850.00,
  3700.00,
  '2024-01-01',
  '2024-12-31',
  'occupied'
) ON CONFLICT (id) DO NOTHING;

-- Update first user to admin if no admin exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE role = 'admin') THEN
    UPDATE public.users 
    SET role = 'admin', is_active = true 
    WHERE id = (SELECT id FROM public.users ORDER BY created_at LIMIT 1);
  END IF;
END $$;

-- Assign property to first non-admin user (tenant)
INSERT INTO public.tenant_properties (
  id,
  tenant_id,
  property_id,
  lease_start_date,
  lease_end_date,
  monthly_rent,
  deposit_paid,
  status
) 
SELECT 
  '660e8400-e29b-41d4-a716-446655440001',
  u.id,
  '550e8400-e29b-41d4-a716-446655440000',
  '2024-01-01',
  '2024-12-31',
  1850.00,
  3700.00,
  'active'
FROM public.users u 
WHERE (u.role != 'admin' OR u.role IS NULL)
ORDER BY u.created_at
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- Insert dummy inventory items
INSERT INTO public.inventory_items (name, property_id, description, condition, location, quantity, estimated_value) VALUES
('Refrigerator', '550e8400-e29b-41d4-a716-446655440000', 'Stainless steel French door refrigerator', 'excellent', 'Kitchen', 1, 1200.00),
('Dishwasher', '550e8400-e29b-41d4-a716-446655440000', 'Built-in dishwasher', 'good', 'Kitchen', 1, 600.00),
('Microwave', '550e8400-e29b-41d4-a716-446655440000', 'Over-range microwave', 'good', 'Kitchen', 1, 300.00),
('Washer', '550e8400-e29b-41d4-a716-446655440000', 'Front-loading washing machine', 'excellent', 'Laundry Room', 1, 800.00),
('Dryer', '550e8400-e29b-41d4-a716-446655440000', 'Electric dryer', 'excellent', 'Laundry Room', 1, 700.00),
('Air Conditioner', '550e8400-e29b-41d4-a716-446655440000', 'Central air conditioning unit', 'good', 'Living Room', 1, 2500.00),
('Ceiling Fan', '550e8400-e29b-41d4-a716-446655440000', 'Ceiling fan with light', 'good', 'Master Bedroom', 1, 150.00),
('Blinds', '550e8400-e29b-41d4-a716-446655440000', 'Horizontal blinds', 'fair', 'Living Room', 3, 200.00),
('Smoke Detector', '550e8400-e29b-41d4-a716-446655440000', 'Battery-powered smoke detector', 'excellent', 'Hallway', 2, 50.00),
('Thermostat', '550e8400-e29b-41d4-a716-446655440000', 'Programmable thermostat', 'excellent', 'Hallway', 1, 200.00);

-- Insert dummy inventory photos (10 photos)
INSERT INTO public.inventory_photos (inventory_item_id, photo_url, caption) 
SELECT 
  ii.id,
  'https://images.unsplash.com/photo-' || 
  CASE 
    WHEN ii.name = 'Refrigerator' THEN '1556909114-f6e7ad7d3136?w=800&q=80'
    WHEN ii.name = 'Dishwasher' THEN '1556909042-f7bf03757c0?w=800&q=80'
    WHEN ii.name = 'Microwave' THEN '1556909114-f6e7ad7d3136?w=800&q=80'
    WHEN ii.name = 'Washer' THEN '1558618666-fcd25c85cd64?w=800&q=80'
    WHEN ii.name = 'Dryer' THEN '1558618666-fcd25c85cd64?w=800&q=80'
    WHEN ii.name = 'Air Conditioner' THEN '1581833971-f4c48d4c6d6c?w=800&q=80'
    WHEN ii.name = 'Ceiling Fan' THEN '1586023492-4dc4a4038c46?w=800&q=80'
    WHEN ii.name = 'Blinds' THEN '1586023492-4dc4a4038c46?w=800&q=80'
    WHEN ii.name = 'Smoke Detector' THEN '1558618047-3c739c3b8e8c?w=800&q=80'
    ELSE '1586023492-4dc4a4038c46?w=800&q=80'
  END,
  'Inventory photo of ' || ii.name
FROM public.inventory_items ii
WHERE ii.property_id = '550e8400-e29b-41d4-a716-446655440000';

-- Insert dummy payment proofs for the last 6 months
INSERT INTO public.payment_proofs (tenant_property_id, month_year, amount, payment_date, proof_url, status, uploaded_by)
SELECT 
  tp.id,
  to_char(date_trunc('month', CURRENT_DATE - interval '1 month' * s.month_offset), 'YYYY-MM'),
  tp.monthly_rent,
  date_trunc('month', CURRENT_DATE - interval '1 month' * s.month_offset) + interval '1 day',
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
  CASE WHEN s.month_offset < 3 THEN 'approved' ELSE 'pending' END,
  tp.tenant_id
FROM public.tenant_properties tp
CROSS JOIN (SELECT generate_series(0, 5) as month_offset) s
WHERE tp.property_id = '550e8400-e29b-41d4-a716-446655440000';

-- Insert a sample conversation
INSERT INTO public.conversations (property_id, tenant_id, subject, status, priority)
SELECT 
  '550e8400-e29b-41d4-a716-446655440000',
  tp.tenant_id,
  'Kitchen faucet needs repair',
  'open',
  'medium'
FROM public.tenant_properties tp
WHERE tp.property_id = '550e8400-e29b-41d4-a716-446655440000'
LIMIT 1;

-- Insert sample messages
INSERT INTO public.messages (conversation_id, sender_id, message, is_admin)
SELECT 
  c.id,
  c.tenant_id,
  'Hi, the kitchen faucet has been dripping for the past few days. Could someone take a look at it?',
  false
FROM public.conversations c
WHERE c.subject = 'Kitchen faucet needs repair'
LIMIT 1;

-- Insert key handover record
INSERT INTO public.key_handovers (tenant_property_id, handover_type, scheduled_date, status, notes)
SELECT 
  tp.id,
  'move_in',
  tp.lease_start_date + interval '10:00:00',
  'completed',
  'Keys handed over successfully. Tenant received 2 keys and garage remote.'
FROM public.tenant_properties tp
WHERE tp.property_id = '550e8400-e29b-41d4-a716-446655440000'
LIMIT 1;