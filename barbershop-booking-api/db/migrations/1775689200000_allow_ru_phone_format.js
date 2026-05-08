exports.up = async (pgm) => {
  // Allow both Kyrgyzstan (+996) and Russia (+7) phone formats
  await pgm.sql(`
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_kg_format_chk;
    ALTER TABLE users
      ADD CONSTRAINT users_phone_format_chk
      CHECK (phone ~ '^(\\+996|\\+7)\\d{9}$');
  `);

  await pgm.sql(`
    ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_phone_kg_format_chk;
    ALTER TABLE admins
      ADD CONSTRAINT admins_phone_format_chk
      CHECK (phone ~ '^(\\+996|\\+7)\\d{9}$');
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
