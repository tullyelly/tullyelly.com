export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function redact(u: string | null | undefined) {
  if (!u) return null;
  try {
    const url = new URL(u);
    const hasUser = Boolean(url.username);
    return `${url.protocol}//${hasUser ? '****@' : ''}${url.host}${url.pathname}`;
  } catch {
    return 'INVALID_URL';
  }
}

const VARS = [
  'DATABASE_URL',
  'POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'NEON_DATABASE_URL',
  'PGDATABASE_URL',
] as const;

export async function GET() {
  if (process.env.NEXT_PUBLIC_DEBUG_DB_META !== '1') {
    return new Response('Not Found', { status: 404 });
  }
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown';
  const data: { vercelEnv: string } & Record<(typeof VARS)[number], string | null> = {
    vercelEnv: env,
    DATABASE_URL: null,
    POSTGRES_URL: null,
    POSTGRES_PRISMA_URL: null,
    NEON_DATABASE_URL: null,
    PGDATABASE_URL: null,
  };
  for (const key of VARS) {
    data[key] = redact(process.env[key]);
  }
  return Response.json(data);
}
