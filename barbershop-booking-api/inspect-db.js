require('dotenv').config();
const { pool } = require('./src/db/pool');

async function inspect() {
  const client = await pool.connect();
  try {
    // Tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('=== TABLES ===');
    tables.rows.forEach(r => console.log(' -', r.table_name));

    // Users
    const users = await client.query('SELECT id, full_name, phone, created_at FROM users ORDER BY id LIMIT 10');
    console.log('\n=== USERS (first 10) ===');
    users.rows.forEach(u => console.log(` #${u.id} ${u.full_name} (${u.phone})`));

    // Salons
    const salons = await client.query('SELECT id, name, address FROM salons ORDER BY id');
    console.log('\n=== SALONS ===');
    salons.rows.forEach(s => console.log(` #${s.id} ${s.name} - ${s.address}`));

    // Barbers
    const barbers = await client.query('SELECT id, name, role, salon_id FROM barbers ORDER BY id LIMIT 10');
    console.log('\n=== BARBERS (first 10) ===');
    barbers.rows.forEach(b => console.log(` #${b.id} ${b.name} (${b.role}) → salon_id:${b.salon_id}`));

    // Services
    const services = await client.query('SELECT id, name, duration_minutes, price FROM services ORDER BY id');
    console.log('\n=== SERVICES ===');
    services.rows.forEach(s => console.log(` #${s.id} ${s.name} - ${s.duration_minutes}min - ${s.price}₸`));

    // Products
    const products = await client.query('SELECT id, name, price, category FROM products ORDER BY id LIMIT 10');
    console.log('\n=== PRODUCTS (first 10) ===');
    products.rows.forEach(p => console.log(` #${p.id} ${p.name} (${p.category}) - ${p.price}₸`));

    // Bookings
    const bookings = await client.query('SELECT id, user_id, barber_id, date, time FROM bookings ORDER BY created_at DESC LIMIT 10');
    console.log('\n=== BOOKINGS (last 10) ===');
    bookings.rows.forEach(b => console.log(` #${b.id} user:${b.user_id} barber:${b.barber_id} ${b.date} ${b.time}`));

  } catch (err) {
    console.error('ERROR:', err.message);
    console.error('Stack:', err.stack);
  } finally {
    await pool.end();
  }
}

inspect();
