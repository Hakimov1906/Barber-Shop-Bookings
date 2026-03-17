require('dotenv').config();

const { pool } = require('../src/db/pool');

const barbers = [
  { name: 'Azamat', isActive: true },
  { name: 'Beksultan', isActive: true },
  { name: 'Daniyar', isActive: true }
];

const services = [
  { name: 'Classic haircut', duration: 30, price: 500 },
  { name: 'Fade haircut', duration: 45, price: 700 },
  { name: 'Beard trim', duration: 20, price: 400 }
];

async function upsertBarbers(client) {
  for (const barber of barbers) {
    await client.query(
      `UPDATE barbers SET is_active = $2 WHERE name = $1`,
      [barber.name, barber.isActive]
    );

    await client.query(
      `INSERT INTO barbers (name, is_active)
       SELECT $1, $2
       WHERE NOT EXISTS (SELECT 1 FROM barbers WHERE name = $1)`,
      [barber.name, barber.isActive]
    );
  }
}

async function upsertServices(client) {
  for (const service of services) {
    await client.query(
      `UPDATE services SET duration_minutes = $2, price = $3 WHERE name = $1`,
      [service.name, service.duration, service.price]
    );

    await client.query(
      `INSERT INTO services (name, duration_minutes, price)
       SELECT $1, $2, $3
       WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = $1)`,
      [service.name, service.duration, service.price]
    );
  }
}

async function resetDemoData(client) {
  await client.query('TRUNCATE bookings, slots RESTART IDENTITY');
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (process.env.RESET_DEMO === 'true') {
      await resetDemoData(client);
    }

    await upsertBarbers(client);
    await upsertServices(client);

    await client.query('COMMIT');
    console.log('Seed refresh completed');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed refresh failed', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
