import { NextResponse } from 'next/server';
import { logger } from '@/app/lib/server-logger';
import { getReleases } from '@/lib/releases';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || '20', 10), 1),
      100
    );
    const releases = await getReleases(limit);
    return NextResponse.json({ releases });
  } catch (e) {
    logger.error('[API:/releases]', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
