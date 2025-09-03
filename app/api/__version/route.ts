import { NextResponse } from "next/server";
import { getBuildInfo } from "@/lib/build-info";

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
    const info = await getBuildInfo();
    return NextResponse.json({
      ok: true,
      buildIso: info.builtAt ?? "",
      commitSha: info.commit ?? "",
      shortCommit: info.commit ?? "",
      branch: info.branch ?? "",
      version: info.version ?? "",
    });
  } catch {
    return NextResponse.json(fallbackEnv());
  }
}
