import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const file = resolve(process.cwd(), ".next/generated/build-info.json");
    const raw = await readFile(file, "utf8");
    const json = JSON.parse(raw);
    if (!json.commitSha || typeof json.commitSha !== "string") {
      json.commitSha = "unknown";
    }
    json.ok = true;
    return NextResponse.json(json, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "build-info-missing",
        message: "build-info.json not found or unreadable",
      },
      { status: 503 }
    );
  }
}
