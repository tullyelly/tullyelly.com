import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import type { PoolClient } from "pg";
import { z } from "zod";

import { getPool } from "@/db/pool";
import { writeAudit } from "@/lib/audit/log";
import { getCurrentUser } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import {
  AuthzForbiddenError,
  AuthzUnauthenticatedError,
} from "@/lib/authz/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const snapshotSchema = z.object({
  homie_id: z.union([
    z.coerce.number().int().min(1, { message: "invalid homie id" }),
    z.string().uuid({ message: "invalid homie uuid" }),
  ]),
  card_count: z.coerce.number().int().min(0),
  ranking: z.coerce.number().int().min(1),
  difference: z.coerce.number().int(),
  ranking_at: z.coerce.date(),
});

type SnapshotInput = z.infer<typeof snapshotSchema>;

type InsertRow = { id: string };

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = snapshotSchema.safeParse(payload);
  if (!parsed.success) {
    const { fieldErrors } = parsed.error.flatten();
    return NextResponse.json(
      { error: "INVALID_INPUT", fieldErrors },
      { status: 400 },
    );
  }

  try {
    await requirePermission("tcdb.snapshot.create");
  } catch (error) {
    if (error instanceof AuthzUnauthenticatedError) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    if (error instanceof AuthzForbiddenError) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    throw error;
  }

  const user = await getCurrentUser();
  const actorId = user?.id ?? null;

  const input: SnapshotInput = parsed.data;
  const rankingAtDate = input.ranking_at;
  const rankingAtDateOnly = rankingAtDate.toISOString().slice(0, 10);
  const metadata = {
    homie_id: input.homie_id,
    card_count: input.card_count,
    ranking: input.ranking,
    difference: input.difference,
    ranking_at: rankingAtDateOnly,
  } satisfies Record<string, unknown>;

  const pool = getPool() as unknown as {
    connect: () => Promise<PoolClient>;
  };

  if (typeof pool?.connect !== "function") {
    console.error("[tcdb] database pool does not support transactions");
    return NextResponse.json(
      { error: "SNAPSHOT_CREATE_FAILED" },
      { status: 500 },
    );
  }

  const client = await pool.connect();
  let insertedId: string | null = null;

  try {
    await client.query("BEGIN");

    const homieIdCast =
      typeof input.homie_id === "number" ? "::bigint" : "::uuid";
    const insertResult = await client.query<InsertRow>(
      `
      INSERT INTO dojo.homie_tcdb_snapshot (homie_id, card_count, ranking, difference, ranking_at)
      VALUES ($1${homieIdCast}, $2::int, $3::int, $4::int, $5::date)
      RETURNING id::text AS id
      `,
      [
        input.homie_id,
        input.card_count,
        input.ranking,
        input.difference,
        rankingAtDateOnly,
      ],
    );

    insertedId = insertResult.rows[0]?.id ?? null;
    if (!insertedId) {
      throw new Error("Snapshot insert did not return an id");
    }

    await client.query("SELECT refresh_homie_tcdb_ranking_rt();");
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch((rollbackError: unknown) => {
      console.error("[tcdb] snapshot rollback failed", rollbackError);
    });
    console.error("[tcdb] snapshot transaction failed", error);
    return NextResponse.json(
      { error: "SNAPSHOT_CREATE_FAILED" },
      { status: 500 },
    );
  } finally {
    client.release();
  }

  revalidateTag("tcdb-rankings");

  try {
    await writeAudit({
      action: "tcdb.snapshot.create",
      actorId,
      targetTable: "dojo.homie_tcdb_snapshot",
      targetId: insertedId,
      metadata,
    });
  } catch (error) {
    console.error("[tcdb] audit log write failed", error);
    return NextResponse.json(
      { error: "SNAPSHOT_CREATE_FAILED" },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: insertedId, status: "ok" }, { status: 201 });
}
