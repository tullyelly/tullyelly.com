import { getPool } from '../db/pool';

// Usage: npx tsx scripts/db-ping.ts
async function main() {
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
