import 'server-only';

type VercelEnv = 'production' | 'preview' | 'development';

export function getRuntimeEnv() {
  const vercelEnv = (process.env.VERCEL_ENV as VercelEnv | undefined) ?? 'development';
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const isVercel = Boolean(process.env.VERCEL);
  return { vercelEnv, nodeEnv, isVercel };
}

function must(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export function getDatabaseUrl() {
  const { vercelEnv } = getRuntimeEnv();
  switch (vercelEnv) {
    case 'production':
      return must('DATABASE_URL');
    case 'preview':
      return must('PREVIEW_DATABASE_URL');
    case 'development':
    default:
      return must('TEST_DATABASE_URL');
  }
}
