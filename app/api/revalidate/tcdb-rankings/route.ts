import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  if (!process.env.REVALIDATE_TOKEN || auth !== `Bearer ${process.env.REVALIDATE_TOKEN}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  revalidateTag('tcdb-rankings');
  return NextResponse.json({ ok: true });
}
