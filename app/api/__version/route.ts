import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { buildInfo } = await import("@/lib/build-info");
    return NextResponse.json({
      ok: true,
      buildIso: buildInfo.builtAt ?? "",
      commitSha: buildInfo.commitSha ?? "",
      shortCommit: buildInfo.commitShortSha ?? "",
      branch: buildInfo.ref ?? "",
    });
  } catch {
    return NextResponse.json({
      ok: true,
      buildIso: "",
      commitSha: process.env.GITHUB_SHA ?? "",
      shortCommit: (process.env.GITHUB_SHA || "").slice(0, 7),
      branch: process.env.GITHUB_REF_NAME ?? "",
      _note: "fallback payload",
    });
  }
}
