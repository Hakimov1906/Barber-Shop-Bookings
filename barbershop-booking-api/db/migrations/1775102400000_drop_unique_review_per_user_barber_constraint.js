exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_barber_user_uidx;
    DROP INDEX IF EXISTS reviews_barber_user_uidx;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    CREATE UNIQUE INDEX IF NOT EXISTS reviews_barber_user_uidx
    ON reviews (barber_id, user_id)
    WHERE user_id IS NOT NULL;
  `);
};
