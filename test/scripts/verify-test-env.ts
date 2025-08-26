import process from 'node:process';

function fail(msg: string, suggestion?: string) {
  console.error(`❌ ${msg}`);
  if (suggestion) console.error(`Fix → ${suggestion}`);
  process.exit(1);
}

const url = (process.env.TEST_DATABASE_URL ?? '').trim();
const fallback = (process.env.DOCKER_FALLBACK ?? 'false').toLowerCase() === 'true';

if (!url && !fallback) {
  fail(
    'TEST_DATABASE_URL is not set and DOCKER_FALLBACK is disabled.',
    'Copy .env.test.sample to .env.test, set TEST_DATABASE_URL, then run: npm run test:db'
  );
}

if (url && !/^postgres(ql)?:\/\//i.test(url)) {
  fail('TEST_DATABASE_URL is set but not a valid Postgres URL.', 'Use postgres://user:password@host:5432/dbname');
}
