import dotenv from 'dotenv';

// Load test env first
dotenv.config({ path: '.env.test' });

// Provide a harmless fallback to avoid abrupt failures when the
// secret is missing in local or forked environments
if (!process.env.TEST_DATABASE_URL) {
  process.env.TEST_DATABASE_URL = 'postgresql://dummy:dummy@127.0.0.1:5432/dummy';
}

// Simulate Vercel environment for tests (non-prod)
if (!process.env.VERCEL_ENV) {
  process.env.VERCEL_ENV = 'development';
}