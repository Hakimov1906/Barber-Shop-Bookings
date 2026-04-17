-- Snapshot schema (source of truth for changes lives in db/migrations)

CREATE TABLE IF NOT EXISTS salons (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  work_hours TEXT NOT NULL DEFAULT '09:00 - 21:00',
  latitude NUMERIC(9,6) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude NUMERIC(9,6) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS barbers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Barber',
  experience_years INT NOT NULL DEFAULT 1 CHECK (experience_years > 0),
  rating NUMERIC(2,1) NOT NULL DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  reviews_count INT NOT NULL DEFAULT 0 CHECK (reviews_count >= 0),
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  specialties TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  salon_id INT REFERENCES salons(id) ON DELETE SET NULL,
  location TEXT,
  bio TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE barbers ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'Barber';
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS experience_years INT NOT NULL DEFAULT 1 CHECK (experience_years > 0);
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) NOT NULL DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5);
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS reviews_count INT NOT NULL DEFAULT 0 CHECK (reviews_count >= 0);
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS specialties TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS salon_id INT;
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS bio TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'barbers_salon_id_fkey'
  ) THEN
    ALTER TABLE barbers
      ADD CONSTRAINT barbers_salon_id_fkey
      FOREIGN KEY (salon_id)
      REFERENCES salons(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  category TEXT NOT NULL CHECK (category IN ('men', 'women', 'unisex')),
  type TEXT NOT NULL,
  stock_qty INT NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE CHECK (phone ~ '^\+996\d{9}$'),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE CHECK (phone ~ '^\+996\d{9}$'),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS salons_active_idx ON salons(is_active);
CREATE INDEX IF NOT EXISTS salons_sort_order_idx ON salons(sort_order);
CREATE INDEX IF NOT EXISTS barbers_salon_idx ON barbers(salon_id);
CREATE UNIQUE INDEX IF NOT EXISTS barbers_name_uidx ON barbers(name);
CREATE UNIQUE INDEX IF NOT EXISTS services_name_uidx ON services(name);
CREATE UNIQUE INDEX IF NOT EXISTS products_name_uidx ON products(name);
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);
CREATE INDEX IF NOT EXISTS products_active_idx ON products(is_active);
CREATE INDEX IF NOT EXISTS admins_phone_idx ON admins(phone);

CREATE TABLE IF NOT EXISTS slots (
  id SERIAL PRIMARY KEY,
  barber_id INT NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (barber_id, date, time)
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  service_id INT NOT NULL REFERENCES services(id),
  barber_id INT NOT NULL REFERENCES barbers(id),
  slot_id INT NOT NULL REFERENCES slots(id),
  date DATE NOT NULL,
  time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  barber_id INT NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  rating NUMERIC(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (barber_id, author_name, comment)
);

CREATE INDEX IF NOT EXISTS bookings_date_idx ON bookings(date);
CREATE INDEX IF NOT EXISTS bookings_barber_idx ON bookings(barber_id);
CREATE INDEX IF NOT EXISTS bookings_user_idx ON bookings(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS bookings_slot_uidx ON bookings(slot_id);
CREATE INDEX IF NOT EXISTS slots_date_idx ON slots(date);
CREATE INDEX IF NOT EXISTS reviews_barber_idx ON reviews(barber_id);
CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON reviews(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS reviews_barber_user_uidx ON reviews(barber_id, user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS cart_items_user_idx ON cart_items(user_id);
