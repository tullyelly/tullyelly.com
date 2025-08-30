import { NextResponse } from 'next/server';
import { Env } from '@/lib/env';
import { buildInfo } from '@/lib/build-info';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const commitSha = buildInfo.commitSha || Env.COMMIT_SHA || 'unknown';
  const buildTime = buildInfo.buildTime || new Date().toISOString();
  const version = buildInfo.version || undefined;
  const payload = { ok: true, commitSha, buildTime, ...(version ? { version } : {}) } as const;
  return NextResponse.json(payload, { status: 200 });
}
