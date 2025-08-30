import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-static";

function fallbackEnv() {
  const sha = process.env.GITHUB_SHA ?? "";
  return {
    ok: true,
    buildIso: "",
    commitSha: sha,
    shortCommit: sha.slice(0, 7),
    branch: process.env.GITHUB_REF_NAME ?? "",
    _note: "fallback payload",
  };
}

export async function GET() {
  try {
    const { buildInfo } = await import("@/lib/build-info");
    return NextResponse.json({
      ok: true,
      buildIso: buildInfo.buildIso ?? "",
      commitSha: buildInfo.commit ?? "",
      shortCommit: buildInfo.shortCommit ?? "",
      branch: buildInfo.branch ?? "",
      ciRunId: buildInfo.ciRunId ?? null,
    });
  } catch {
    return NextResponse.json(fallbackEnv());
  }
}
