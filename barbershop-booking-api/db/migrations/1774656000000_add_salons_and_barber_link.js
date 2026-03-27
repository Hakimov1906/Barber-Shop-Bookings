exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
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

    ALTER TABLE barbers ADD COLUMN IF NOT EXISTS salon_id INT;

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

    CREATE INDEX IF NOT EXISTS salons_active_idx ON salons(is_active);
    CREATE INDEX IF NOT EXISTS salons_sort_order_idx ON salons(sort_order);
    CREATE INDEX IF NOT EXISTS barbers_salon_idx ON barbers(salon_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS barbers_salon_idx;
    DROP INDEX IF EXISTS salons_sort_order_idx;
    DROP INDEX IF EXISTS salons_active_idx;
    ALTER TABLE barbers DROP CONSTRAINT IF EXISTS barbers_salon_id_fkey;
    ALTER TABLE barbers DROP COLUMN IF EXISTS salon_id;
    DROP TABLE IF EXISTS salons;
  `);
};
