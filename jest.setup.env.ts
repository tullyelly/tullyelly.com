import dotenv from 'dotenv';

// Load test env first
dotenv.config({ path: '.env.test' });

if (!process.env.TEST_DATABASE_URL) {
  throw new Error('Missing env var: TEST_DATABASE_URL');
}

// Simulate Vercel environment for tests (non-prod)
if (!process.env.VERCEL_ENV) {
  process.env.VERCEL_ENV = 'development';
}