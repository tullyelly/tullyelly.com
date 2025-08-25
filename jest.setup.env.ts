import dotenv from 'dotenv';

// Load test env first
dotenv.config({ path: '.env.test' });

// Map TEST_DATABASE_URL -> DATABASE_URL for the app code
if (process.env.TEST_DATABASE_URL && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

// Simulate Vercel environment for tests (non-prod)
if (!process.env.VERCEL_ENV) {
  process.env.VERCEL_ENV = 'development';
}