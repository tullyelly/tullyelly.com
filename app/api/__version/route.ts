import { NextResponse } from "next/server";
import { buildInfo } from "@/lib/build-info";

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
    return NextResponse.json({
      ok: true,
      buildIso: buildInfo.buildTime ?? "",
      commitSha: buildInfo.commit ?? "",
      shortCommit: (buildInfo.commit ?? "").slice(0, 7),
      branch: buildInfo.branch ?? "",
      version: buildInfo.version ?? "",
    });
  } catch {
    return NextResponse.json(fallbackEnv());
  }
}
