import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;

if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = neon(url);
const table = 'homie_tcdb_ranking_rt';

try {
  const rows = await sql`SELECT to_regclass('public.' || ${table}) AS r`;

  if (!rows?.[0]?.r) {
    console.error(`Missing relation: ${table}`);
    process.exit(2);
  }

  console.log(`Found relation: ${table}`);
  process.exit(0);
} catch (err) {
  console.error('Sanity check failed:', err);
  process.exit(3);
}
