import { NextResponse } from 'next/server';
import {
  getReleases,
  ORDER_BY,
  type Sort,
  type ReleaseListResponse,
  type ReleaseRow,
  type PageMeta,
} from '@/lib/releases';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

class InputError extends Error {}

function parseQuery(url: string) {
  const { searchParams } = new URL(url);

  const limitRaw = searchParams.get('limit');
  let limit = 20;
  if (limitRaw !== null) {
    const num = Number.parseInt(limitRaw, 10);
    if (Number.isNaN(num)) throw new InputError('invalid limit');
    limit = num;
  }
  limit = Math.min(Math.max(limit, 1), 100);

  const offsetRaw = searchParams.get('offset');
  let offset = 0;
  if (offsetRaw !== null) {
    const num = Number.parseInt(offsetRaw, 10);
    if (Number.isNaN(num) || num < 0) throw new InputError('invalid offset');
    offset = num;
  }

  const sortRaw = searchParams.get('sort') ?? 'semver:desc';
  if (!(sortRaw in ORDER_BY)) {
    throw new InputError('invalid sort');
  }
  const sort = sortRaw as Sort;

  const qRaw = searchParams.get('q');
  const q = qRaw ? qRaw.trim() : undefined;

  return { limit, offset, sort, q };
}

export async function GET(req: Request) {
  try {
    const { limit, offset, sort, q } = parseQuery(req.url);
    console.log('[API:/releases] params', { limit, offset, sort, q }); // eslint-disable-line no-console

    const { items, page } = await getReleases({ limit, offset, sort, q });

    return NextResponse.json(
      { items, page } satisfies ReleaseListResponse,
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err) {
    if (err instanceof InputError) {
      console.error('[API:/releases] bad input', err); // eslint-disable-line no-console
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('[API:/releases] unexpected error', err); // eslint-disable-line no-console
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}

export type { ReleaseRow, ReleaseListResponse, PageMeta } from '@/lib/releases';
