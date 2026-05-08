exports.up = async (pgm) => {
  // Users: drop any existing phone format constraints (unnamed or named)
  // The initial schema created an unnamed constraint, which gets a system name like "users_phone_check"
  // Later migrations renamed it to "users_phone_kg_format_chk". Drop all variants.
  await pgm.sql(`
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_check;
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_kg_format_chk;
    ALTER TABLE users
      ADD CONSTRAINT users_phone_format_chk
      CHECK (phone ~ '^(\\+996\\d{9}|\\+7\\d{10})$');
  `);

  // Admins: similarly drop any existing phone constraints
  await pgm.sql(`
    ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_phone_check;
    ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_phone_kg_format_chk;
    ALTER TABLE admins
      ADD CONSTRAINT admins_phone_format_chk
      CHECK (phone ~ '^(\\+996\\d{9}|\\+7\\d{10})$');
  `);
};

exports.down = async (pgm) => {
  // Revert to Kyrgyzstan-only format
  await pgm.sql(`
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_format_chk;
    ALTER TABLE users
      ADD CONSTRAINT users_phone_kg_format_chk
      CHECK (phone ~ '^\\+996\\d{9}$');
  `);

  await pgm.sql(`
    ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_phone_format_chk;
    ALTER TABLE admins
      ADD CONSTRAINT admins_phone_kg_format_chk
      CHECK (phone ~ '^\\+996\\d{9}$');
  `);
};

exports.down = async (pgm) => {
  // Revert to Kyrgyzstan-only format
  await pgm.sql(`
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_format_chk;
    ALTER TABLE users
      ADD CONSTRAINT users_phone_kg_format_chk
      CHECK (phone ~ '^\\+996\\d{9}$');
  `);

  await pgm.sql(`
    ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_phone_format_chk;
    ALTER TABLE admins
      ADD CONSTRAINT admins_phone_kg_format_chk
      CHECK (phone ~ '^\\+996\\d{9}$');
  `);
};
