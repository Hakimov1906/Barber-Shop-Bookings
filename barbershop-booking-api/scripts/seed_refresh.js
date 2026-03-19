require('dotenv').config();

const { pool } = require('../src/db/pool');
const { refreshSeeds } = require('../src/db/seed');

async function main() {
  try {
    await refreshSeeds({ resetDemo: process.env.RESET_DEMO === 'true' });
    console.log('Seed refresh completed');
  } catch (err) {
    console.error('Seed refresh failed', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
