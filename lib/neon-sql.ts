import { neon } from "@neondatabase/serverless";

if (
  process.env.NEON_HTTP_URL &&
  /0\.0\.1\/sql/.test(process.env.NEON_HTTP_URL)
) {
  delete process.env.NEON_HTTP_URL;
}

const databaseUrl =
  process.env.DATABASE_URL ?? process.env.TEST_DATABASE_URL ?? null;
if (!databaseUrl) {
  throw new Error(
    "Missing DATABASE_URL/TEST_DATABASE_URL (set locally in .env.test or via CI secrets).",
  );
}

export const sql = neon(databaseUrl);

export default sql;
