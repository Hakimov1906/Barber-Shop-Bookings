INSERT INTO barbers (
  name,
  role,
  experience_years,
  rating,
  reviews_count,
  image_url,
  is_available,
  specialties,
  location,
  bio
)
VALUES
  (
    'Azamat Jusupov',
    'Barber',
    8,
    4.9,
    342,
    '/assets/master-1.jpg',
    TRUE,
    ARRAY['Men haircut', 'Shave', 'Styling'],
    'Center',
    'Senior barber focused on clean fades and natural styling.'
  ),
  (
    'Aigul Satybaldieva',
    'Stylist',
    12,
    5.0,
    518,
    '/assets/master-2.jpg',
    TRUE,
    ARRAY['Women haircut', 'Styling', 'Care'],
    'Center',
    'Lead stylist for event looks and premium haircare routines.'
  ),
  (
    'Daniyar Kasymov',
    'Barber',
    5,
    4.8,
    189,
    '/assets/master-3.jpg',
    FALSE,
    ARRAY['Men haircut', 'Beard design'],
    'North',
    'Modern cuts specialist with strong attention to detail.'
  ),
  (
    'Elnura Toktosunova',
    'Colorist',
    10,
    4.9,
    427,
    '/assets/master-4.jpg',
    TRUE,
    ARRAY['Coloring', 'Highlights', 'Balayage'],
    'South',
    'Certified colorist focused on natural tones and healthy shine.'
  )
ON CONFLICT (name) DO UPDATE SET
  role = EXCLUDED.role,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  reviews_count = EXCLUDED.reviews_count,
  image_url = EXCLUDED.image_url,
  is_available = EXCLUDED.is_available,
  specialties = EXCLUDED.specialties,
  location = EXCLUDED.location,
  bio = EXCLUDED.bio,
  is_active = TRUE;

INSERT INTO services (name, duration_minutes, price)
VALUES
  ('Classic haircut', 30, 500),
  ('Fade haircut', 45, 700),
  ('Beard trim', 20, 400),
  ('Hair coloring', 60, 1500),
  ('Hair styling', 35, 900)
ON CONFLICT (name) DO UPDATE SET
  duration_minutes = EXCLUDED.duration_minutes,
  price = EXCLUDED.price,
  is_active = TRUE;

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
    'Volume shampoo',
    'Professional shampoo for thin hair. Adds volume and shine.',
    650,
    '/assets/product-1.jpg',
    'unisex',
    'Care',
    30
  ),
  (
    'Styling cream',
    'Light hold with matte finish for natural texture.',
    850,
    '/assets/product-2.jpg',
    'men',
    'Styling',
    25
  ),
  (
    'Hair oil',
    'Nourishing argan oil that restores and protects hair.',
    1100,
    '/assets/product-3.jpg',
    'women',
    'Care',
    20
  ),
  (
    'Scalp detox shampoo',
    'Detox formula for oily scalp and deep cleansing.',
    550,
    '/assets/product-4.jpg',
    'men',
    'Care',
    28
  ),
  (
    'Heat protection spray',
    'Protects hair up to 230C and keeps smooth finish.',
    750,
    '/assets/product-1.jpg',
    'women',
    'Protection',
    24
  ),
  (
    'Beard wax',
    'Medium hold wax for beard shape and hydration.',
    480,
    '/assets/product-2.jpg',
    'men',
    'Styling',
    32
  )
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category,
  type = EXCLUDED.type,
  stock_qty = EXCLUDED.stock_qty,
  is_active = TRUE;
