WITH source(code, name, address, work_hours, latitude, longitude, sort_order) AS (
  VALUES
    (
      'center',
      'HairLine Center',
      'Chuy Ave, 150',
      '09:00 - 21:00',
      42.876731,
      74.606215,
      1
    ),
    (
      'north',
      'HairLine North',
      'Jibek Jolu, 42',
      '10:00 - 20:00',
      42.889112,
      74.628954,
      2
    ),
    (
      'south',
      'HairLine South',
      'Akhunbaev St, 98',
      '09:00 - 21:00',
      42.833481,
      74.602614,
      3
    )
),
updated AS (
  UPDATE salons s
  SET
    code = source.code,
    address = source.address,
    work_hours = source.work_hours,
    latitude = source.latitude,
    longitude = source.longitude,
    sort_order = source.sort_order,
    is_active = TRUE,
    updated_at = NOW()
  FROM source
  WHERE s.name = source.name
)
INSERT INTO salons (
  code,
  name,
  address,
  work_hours,
  latitude,
  longitude,
  sort_order
)
SELECT code, name, address, work_hours, latitude, longitude, sort_order
FROM source
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  work_hours = EXCLUDED.work_hours,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  sort_order = EXCLUDED.sort_order,
  is_active = TRUE,
  updated_at = NOW();

UPDATE salons
SET is_active = FALSE, updated_at = NOW()
WHERE code NOT IN ('center', 'north', 'south');

INSERT INTO barbers (
  name,
  role,
  experience_years,
  rating,
  reviews_count,
  image_url,
  is_available,
  specialties,
  salon_id,
  location,
  bio
)
VALUES
  (
    'Timur Karimov',
    'Senior Barber',
    11,
    4.9,
    328,
    'https://placehold.co/600x600/png?text=Timur+K',
    TRUE,
    ARRAY['Skin fade', 'Classic cut', 'Beard styling'],
    (SELECT id FROM salons WHERE code = 'center'),
    'Chuy Ave, 150',
    'Focuses on precision fades and modern men styles.'
  ),
  (
    'Aida Omurbekova',
    'Top Stylist',
    9,
    4.8,
    274,
    'https://placehold.co/600x600/png?text=Aida+O',
    TRUE,
    ARRAY['Layered cuts', 'Styling', 'Hair care'],
    (SELECT id FROM salons WHERE code = 'center'),
    'Chuy Ave, 150',
    'Creates soft forms and practical daily styling routines.'
  ),
  (
    'Nursultan Imanov',
    'Barber',
    6,
    4.7,
    183,
    'https://placehold.co/600x600/png?text=Nursultan+I',
    TRUE,
    ARRAY['Taper fade', 'Beard trim', 'Contour line'],
    (SELECT id FROM salons WHERE code = 'north'),
    'Jibek Jolu, 42',
    'Strong at clean lines and quick, consistent execution.'
  ),
  (
    'Elena Petrova',
    'Color Specialist',
    12,
    5.0,
    412,
    'https://placehold.co/600x600/png?text=Elena+P',
    TRUE,
    ARRAY['Coloring', 'Balayage', 'Hair recovery'],
    (SELECT id FROM salons WHERE code = 'south'),
    'Akhunbaev St, 98',
    'Works with natural shades and restorative color techniques.'
  ),
  (
    'Bekzat Sadykov',
    'Barber',
    4,
    4.6,
    96,
    'https://placehold.co/600x600/png?text=Bekzat+S',
    TRUE,
    ARRAY['Buzz cut', 'Kids haircut', 'Simple styling'],
    (SELECT id FROM salons WHERE code = 'north'),
    'Jibek Jolu, 42',
    'Fast service and good choice for regular maintenance cuts.'
  ),
  (
    'Madina Ryskulova',
    'Stylist',
    7,
    4.8,
    205,
    'https://placehold.co/600x600/png?text=Madina+R',
    TRUE,
    ARRAY['Evening styling', 'Texture', 'Volume'],
    (SELECT id FROM salons WHERE code = 'south'),
    'Akhunbaev St, 98',
    'Builds long-lasting volume and polished final look.'
  )
ON CONFLICT (name) DO UPDATE SET
  role = EXCLUDED.role,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  reviews_count = EXCLUDED.reviews_count,
  image_url = EXCLUDED.image_url,
  is_available = EXCLUDED.is_available,
  specialties = EXCLUDED.specialties,
  salon_id = EXCLUDED.salon_id,
  location = EXCLUDED.location,
  bio = EXCLUDED.bio,
  is_active = TRUE;

UPDATE barbers
SET is_active = FALSE
WHERE name NOT IN (
  'Timur Karimov',
  'Aida Omurbekova',
  'Nursultan Imanov',
  'Elena Petrova',
  'Bekzat Sadykov',
  'Madina Ryskulova'
);

INSERT INTO services (name, duration_minutes, price)
VALUES
  ('Classic haircut', 35, 700),
  ('Skin fade', 45, 950),
  ('Beard trim', 25, 500),
  ('Royal shave', 30, 650),
  ('Scissors cut', 40, 850),
  ('Hair wash and styling', 25, 550),
  ('Kids haircut', 25, 600),
  ('Coloring', 90, 2400),
  ('Tone correction', 70, 1800),
  ('Keratin care', 80, 2100)
ON CONFLICT (name) DO UPDATE SET
  duration_minutes = EXCLUDED.duration_minutes,
  price = EXCLUDED.price,
  is_active = TRUE;

UPDATE services
SET is_active = FALSE
WHERE name NOT IN (
  'Classic haircut',
  'Skin fade',
  'Beard trim',
  'Royal shave',
  'Scissors cut',
  'Hair wash and styling',
  'Kids haircut',
  'Coloring',
  'Tone correction',
  'Keratin care'
);

INSERT INTO products (
  name,
  description,
  price,
  image_url,
  category,
  type,
  stock_qty
)
VALUES
  (
    'Matte Clay',
    'Flexible hold with matte finish for everyday styling.',
    890,
    'https://placehold.co/600x600/png?text=Matte+Clay',
    'men',
    'Styling',
    42
  ),
  (
    'Sea Salt Spray',
    'Adds texture and volume without heavy residue.',
    760,
    'https://placehold.co/600x600/png?text=Sea+Salt+Spray',
    'unisex',
    'Styling',
    35
  ),
  (
    'Repair Shampoo',
    'Daily shampoo for damaged and dry hair.',
    980,
    'https://placehold.co/600x600/png?text=Repair+Shampoo',
    'unisex',
    'Care',
    30
  ),
  (
    'Beard Oil',
    'Softens beard and hydrates skin under it.',
    670,
    'https://placehold.co/600x600/png?text=Beard+Oil',
    'men',
    'Care',
    28
  ),
  (
    'Heat Shield Mist',
    'Protects hair from heat up to 220C.',
    840,
    'https://placehold.co/600x600/png?text=Heat+Shield',
    'women',
    'Protection',
    26
  ),
  (
    'Curl Defining Cream',
    'Shapes curls with medium hold and soft touch.',
    920,
    'https://placehold.co/600x600/png?text=Curl+Cream',
    'women',
    'Styling',
    24
  ),
  (
    'Scalp Detox',
    'Deep-clean treatment for oily scalp.',
    730,
    'https://placehold.co/600x600/png?text=Scalp+Detox',
    'unisex',
    'Care',
    21
  ),
  (
    'Strong Hold Gel',
    'Long-lasting hold for neat and slick looks.',
    610,
    'https://placehold.co/600x600/png?text=Strong+Gel',
    'men',
    'Styling',
    50
  ),
  (
    'Leave-in Conditioner',
    'Light moisture support and easier detangling.',
    990,
    'https://placehold.co/600x600/png?text=Conditioner',
    'women',
    'Care',
    33
  ),
  (
    'Volume Powder',
    'Instant lift at roots with natural finish.',
    780,
    'https://placehold.co/600x600/png?text=Volume+Powder',
    'unisex',
    'Styling',
    31
  )
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category,
  type = EXCLUDED.type,
  stock_qty = EXCLUDED.stock_qty,
  is_active = TRUE;

UPDATE products
SET is_active = FALSE
WHERE name NOT IN (
  'Matte Clay',
  'Sea Salt Spray',
  'Repair Shampoo',
  'Beard Oil',
  'Heat Shield Mist',
  'Curl Defining Cream',
  'Scalp Detox',
  'Strong Hold Gel',
  'Leave-in Conditioner',
  'Volume Powder'
);

INSERT INTO users (full_name, phone, password_hash)
VALUES
  (
    'Ivan Petrov',
    '+996555100001',
    '$2a$10$cl7uvxDsDH./lX07w3Zn1.vbRUnDpV40RjaOftlMNKdLPWfUOJw9i'
  ),
  (
    'Aida User',
    '+996555100002',
    '$2a$10$cl7uvxDsDH./lX07w3Zn1.vbRUnDpV40RjaOftlMNKdLPWfUOJw9i'
  ),
  (
    'Test Client',
    '+996555100003',
    '$2a$10$2zOm8J.QW7vLlj3D4BYmSuw2J58iPFteVwJJ0EcVh4PeTRkp58DOq'
  )
ON CONFLICT (phone) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  password_hash = EXCLUDED.password_hash;

WITH review_data(barber_name, user_phone, author_name, rating, comment, created_at) AS (
  VALUES
    ('Timur Karimov', '+996555100001', 'Ivan Petrov', 5.0, 'Very clean fade, exactly as requested.', '2026-03-01T10:20:00Z'::timestamptz),
    ('Timur Karimov', '+996555100002', 'Aida User', 4.8, 'Fast service and good attention to detail.', '2026-03-04T12:15:00Z'::timestamptz),
    ('Aida Omurbekova', '+996555100003', 'Test Client', 4.9, 'Loved the styling tips, very practical.', '2026-03-05T16:05:00Z'::timestamptz),
    ('Elena Petrova', '+996555100001', 'Ivan Petrov', 5.0, 'Color result looks natural and healthy.', '2026-03-08T14:40:00Z'::timestamptz),
    ('Nursultan Imanov', '+996555100002', 'Aida User', 4.6, 'Trim and contour were accurate, will come back.', '2026-03-09T09:30:00Z'::timestamptz),
    ('Madina Ryskulova', '+996555100003', 'Test Client', 4.8, 'Great volume and the hairstyle lasted all day.', '2026-03-12T11:10:00Z'::timestamptz)
)
INSERT INTO reviews (barber_id, user_id, author_name, rating, comment, created_at)
SELECT b.id, u.id, rd.author_name, rd.rating, rd.comment, rd.created_at
FROM review_data rd
JOIN barbers b ON b.name = rd.barber_name
LEFT JOIN users u ON u.phone = rd.user_phone
ON CONFLICT (barber_id, author_name, comment) DO UPDATE SET
  rating = EXCLUDED.rating,
  created_at = EXCLUDED.created_at;

UPDATE barbers AS b
SET
  rating = stats.avg_rating,
  reviews_count = stats.total_count
FROM (
  SELECT barber_id, ROUND(AVG(rating)::numeric, 1) AS avg_rating, COUNT(*)::int AS total_count
  FROM reviews
  GROUP BY barber_id
) AS stats
WHERE b.id = stats.barber_id;

DELETE FROM slots
WHERE date < CURRENT_DATE
  AND status = 'available';

WITH barber_ids AS (
  SELECT id
  FROM barbers
  WHERE is_active = TRUE
),
days AS (
  SELECT (CURRENT_DATE + offset_day)::date AS slot_date
  FROM generate_series(0, 13) AS offset_day
),
times AS (
  SELECT t::time AS slot_time
  FROM (VALUES
    ('10:00'),
    ('10:30'),
    ('11:00'),
    ('11:30'),
    ('12:00'),
    ('12:30'),
    ('14:00'),
    ('14:30'),
    ('15:00'),
    ('15:30'),
    ('16:00'),
    ('16:30'),
    ('17:00'),
    ('17:30')
  ) AS source(t)
)
INSERT INTO slots (barber_id, date, time, status)
SELECT barber_ids.id, days.slot_date, times.slot_time, 'available'
FROM barber_ids
CROSS JOIN days
CROSS JOIN times
ON CONFLICT (barber_id, date, time) DO NOTHING;
