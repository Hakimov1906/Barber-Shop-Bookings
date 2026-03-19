const { pool } = require('./pool');

const barbers = [
  { name: 'AzamatTEST', isActive: true },
  { name: 'BeksultanTEST', isActive: true },
  { name: 'DaniyarTEST', isActive: true }
];

const services = [
  { name: 'Classic haircutTEST', duration: 30, price: 500 },
  { name: 'Fade haircutTEST', duration: 45, price: 700 },
  { name: 'Beard trimTEST', duration: 20, price: 400 }
];

async function upsertBarbers(client) {
  for (const barber of barbers) {
    await client.query(
      'UPDATE barbers SET is_active = $2 WHERE name = $1',
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
      'UPDATE services SET duration_minutes = $2, price = $3 WHERE name = $1',
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

async function refreshSeeds(options = {}) {
  const { resetDemo = false } = options;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (resetDemo) {
      await resetDemoData(client);
    }

    await upsertBarbers(client);
    await upsertServices(client);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { refreshSeeds, barbers, services };
