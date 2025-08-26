import { query } from '@/app/lib/db';

// curl -s http://localhost:3000/api/_health

type NowRow = { now: string };

export async function GET() {
  const { rows } = await query<NowRow>('SELECT now() AS now');
  const now = rows[0]?.now;
  return Response.json({ now });
}
