import { neon } from "@neondatabase/serverless";

if (
  process.env.NEON_HTTP_URL &&
  /0\.0\.1\/sql/.test(process.env.NEON_HTTP_URL)
) {
  delete process.env.NEON_HTTP_URL;
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL for Neon client.");
}

export const sql = neon(databaseUrl);

export default sql;
