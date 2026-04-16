exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE users DROP COLUMN IF EXISTS email;
    DROP INDEX IF EXISTS users_email_idx;

    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_kg_format_chk;
    ALTER TABLE users
      ADD CONSTRAINT users_phone_kg_format_chk
      CHECK (phone ~ '^\\+996\\d{9}$');
  `);

  pgm.sql(`
    CREATE TABLE IF NOT EXISTS cart_items (
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INT NOT NULL CHECK (quantity > 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, product_id)
    );

    CREATE INDEX IF NOT EXISTS cart_items_user_idx ON cart_items(user_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS cart_items;

    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_kg_format_chk;

    ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
    UPDATE users
    SET email = CONCAT('user', id, '@example.com')
    WHERE email IS NULL;

    ALTER TABLE users ALTER COLUMN email SET NOT NULL;
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
    ALTER TABLE users
      ADD CONSTRAINT users_email_key UNIQUE (email);

    CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
  `);
};
