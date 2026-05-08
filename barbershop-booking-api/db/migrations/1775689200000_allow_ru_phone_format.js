exports.up = async (pgm) => {
  // Users: drop ANY existing CHECK constraints on phone column (named or unnamed)
  // Initially the constraint was unnamed (system name like 'users_phone_check')
  // Later it was renamed to 'users_phone_kg_format_chk' but the original may still exist
  await pgm.sql(`
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'users'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE 'CHECK%phone%'
      LOOP
        EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', r.conname);
      END LOOP;
    END
    $$;
  `);

  await pgm.sql(`
    ALTER TABLE users
      ADD CONSTRAINT users_phone_format_chk
      CHECK (phone ~ '^(\\+996\\d{9}|\\+7\\d{10})$');
  `);

  // Admins: similarly drop ANY existing CHECK constraints on phone column
  await pgm.sql(`
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'admins'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE 'CHECK%phone%'
      LOOP
        EXECUTE format('ALTER TABLE admins DROP CONSTRAINT %I', r.conname);
      END LOOP;
    END
    $$;
  `);

  await pgm.sql(`
    ALTER TABLE admins
      ADD CONSTRAINT admins_phone_format_chk
      CHECK (phone ~ '^(\\+996\\d{9}|\\+7\\d{10})$');
  `);
};

exports.down = async (pgm) => {
  // Revert to Kyrgyzstan-only format: drop any existing phone constraints and restore KG-only
  await pgm.sql(`
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'users'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE 'CHECK%phone%'
      LOOP
        EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', r.conname);
      END LOOP;
    END
    $$;
  `);

  await pgm.sql(`
    ALTER TABLE users
      ADD CONSTRAINT users_phone_kg_format_chk
      CHECK (phone ~ '^\\+996\\d{9}$');
  `);

  await pgm.sql(`
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'admins'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE 'CHECK%phone%'
      LOOP
        EXECUTE format('ALTER TABLE admins DROP CONSTRAINT %I', r.conname);
      END LOOP;
    END
    $$;
  `);

  await pgm.sql(`
    ALTER TABLE admins
      ADD CONSTRAINT admins_phone_kg_format_chk
      CHECK (phone ~ '^\\+996\\d{9}$');
  `);
};
