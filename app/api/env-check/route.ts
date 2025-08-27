export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
  const data: Record<(typeof VARS)[number], string | null> = {
    DATABASE_URL: null,
    POSTGRES_URL: null,
    POSTGRES_PRISMA_URL: null,
    NEON_DATABASE_URL: null,
    PGDATABASE_URL: null,
  };
  for (const key of VARS) {
    const raw = process.env[key];
    data[key] = redact(raw);
  }
  return Response.json(data);
}

export default function NotFound() {
  return new Response('Not Found', { status: 404 });
}
