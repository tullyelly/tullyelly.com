import { NextResponse } from 'next/server';
import { buildInfo } from '@/lib/build-info';

export async function GET() {
  return NextResponse.json({
    ok: true,
    buildIso: buildInfo.buildIso,
    commitSha: buildInfo.commit,
    shortCommit: buildInfo.shortCommit,
    branch: buildInfo.branch,
  });
}
