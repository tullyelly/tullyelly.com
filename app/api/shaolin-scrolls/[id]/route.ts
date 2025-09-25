import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getPool } from "@/db/pool";
import { asDateString } from "@/lib/dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// curl -s http://localhost:3000/api/shaolin-scrolls/1 | jq

type RouteContext = { params: Promise<{ id: string }> };

type ScrollDetailRow = {
  id: number;
  release_name: string;
  semver: string;
  major: number;
  minor: number;
  patch: number;
  year: number;
  month: number;
  label: string | null;
  status: string;
  release_type: string;
  release_date: string | null;
  created_at: string | Date;
  created_by: string | null;
  updated_at: string | Date | null;
  updated_by: string | null;
};

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const sql = `
    SELECT id, release_name, semver,
           major, minor, patch, year, month, label,
           status, release_type,
           release_date, created_at, created_by, updated_at, updated_by
    FROM dojo.v_shaolin_scrolls
    WHERE id = $1;
  `;

  try {
    const db = getPool();
    const { rows } = await db.query<ScrollDetailRow>(sql, [id]);
    const row = rows[0];
    if (!row) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...row,
      description: row.label,
      jira: [] as unknown[],
      commits: [] as unknown[],
      release_date: asDateString(row.release_date),
      created_at:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : row.created_at,
      updated_at:
        row.updated_at instanceof Date
          ? row.updated_at.toISOString()
          : row.updated_at,
    });
  } catch (err) {
    console.error("shaolin-scroll detail query failed", err);
    return NextResponse.json({ error: "database error" }, { status: 500 });
  }
}
