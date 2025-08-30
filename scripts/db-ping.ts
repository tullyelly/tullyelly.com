import { config } from 'dotenv';

config({ path: '.env.local', override: true });

const { DATABASE_URL } = await import('../lib/env');
const url = DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not set. Define it in .env.local');
}

console.log('DB user:', new URL(url).username);

// Usage: npm run db:ping
async function main() {
  const { getPool } = await import('../db/pool');
  const db = getPool();
  try {
    const res = await db.query('SELECT 1');
    console.log('DB response:', res.rows[0]);
  } finally {
    await db.end();
  }
}

main().catch((err) => {
  console.error('DB ping failed', err);
  process.exit(1);
});

