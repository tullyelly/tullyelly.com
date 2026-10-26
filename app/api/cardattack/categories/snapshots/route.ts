import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import type { PoolClient } from "pg";
import { getPool } from "@/db/pool";
import { getCurrentUser } from "@/lib/auth/session";
import { must } from "@/lib/authz";
import {
  AuthzForbiddenError,
  AuthzUnauthenticatedError,
} from "@/lib/authz/types";
import {
  CATEGORY_CACHE_TAG,
  createCategorySnapshotSchema,
  correctCategorySnapshotSchema,
} from "@/lib/card-categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SavedRow = {
  id: string;
  category_id: string;
  slug: string;
  measured_on: string;
  card_count: number;
  ranking: number | null;
  difference: number | null;
};
const responseError = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

async function save(req: Request, correction: boolean) {
  const action = correction
    ? "tcdb.category.snapshot.correct"
    : "tcdb.category.snapshot.create";
  let actorId: string;
  try {
    const user = await getCurrentUser();
    await must(user, action, { strict: true });
    if (!user?.id) return responseError("UNAUTHENTICATED", 401);
    actorId = user.id;
  } catch (error) {
    if (error instanceof AuthzUnauthenticatedError)
      return responseError("UNAUTHENTICATED", 401);
    if (error instanceof AuthzForbiddenError)
      return responseError("FORBIDDEN", 403);
    return responseError("SERVICE_UNAVAILABLE", 503);
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return responseError("INVALID_JSON", 400);
  }
  const schema = correction
    ? correctCategorySnapshotSchema
    : createCategorySnapshotSchema;
  const parsed = schema.safeParse(payload);
  if (!parsed.success)
    return NextResponse.json(
      {
        error: "INVALID_INPUT",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );

  let client: PoolClient | undefined;
  let saved: SavedRow;
  try {
    const pool = getPool() as unknown as { connect: () => Promise<PoolClient> };
    client = await pool.connect();
    await client.query("BEGIN");
    let before: number | null = null;
    let beforeRanking: number | null = null;
    let beforeDifference: number | null = null;
    if ("snapshot_id" in parsed.data) {
      const existing = await client.query<SavedRow>(
        `SELECT snapshot.id::text, snapshot.category_id::text, category.slug,
        snapshot.measured_on::text, snapshot.card_count, snapshot.ranking, snapshot.difference FROM dojo.card_category_snapshot AS snapshot
        JOIN dojo.card_category AS category ON category.id = snapshot.category_id
        WHERE snapshot.id = $1::bigint FOR UPDATE OF snapshot`,
        [parsed.data.snapshot_id],
      );
      const row = existing.rows[0];
      if (!row) {
        await client.query("ROLLBACK");
        return responseError("SNAPSHOT_NOT_FOUND", 404);
      }
      before = row.card_count;
      beforeRanking = row.ranking ?? null;
      beforeDifference = row.difference ?? null;
      await client.query(
        `UPDATE dojo.card_category_snapshot SET card_count = $1::int,
          ranking = CASE WHEN $3::boolean THEN $4::int ELSE ranking END,
          difference = CASE WHEN $5::boolean THEN $6::int ELSE difference END WHERE id = $2::bigint`,
        [
          parsed.data.card_count,
          row.id,
          parsed.data.ranking !== undefined,
          parsed.data.ranking ?? null,
          parsed.data.difference !== undefined,
          parsed.data.difference ?? null,
        ],
      );
      saved = {
        ...row,
        card_count: parsed.data.card_count,
        ranking:
          parsed.data.ranking === undefined
            ? beforeRanking
            : parsed.data.ranking,
        difference:
          parsed.data.difference === undefined
            ? beforeDifference
            : parsed.data.difference,
      };
    } else {
      const category = await client.query<{ id: string; slug: string }>(
        "SELECT id::text, slug FROM dojo.card_category WHERE slug = $1",
        [parsed.data.category],
      );
      const row = category.rows[0];
      if (!row) {
        await client.query("ROLLBACK");
        return responseError("CATEGORY_NOT_FOUND", 404);
      }
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO dojo.card_category_snapshot (category_id, measured_on, card_count, ranking, difference)
        VALUES ($1::bigint, $2::date, $3::int, $4::int, $5::int) RETURNING id::text`,
        [
          row.id,
          parsed.data.measured_on,
          parsed.data.card_count,
          parsed.data.ranking ?? null,
          parsed.data.difference ?? null,
        ],
      );
      if (!inserted.rows[0]) throw new Error("Missing snapshot id");
      saved = {
        id: inserted.rows[0].id,
        category_id: row.id,
        slug: row.slug,
        measured_on: parsed.data.measured_on,
        card_count: parsed.data.card_count,
        ranking: parsed.data.ranking ?? null,
        difference: parsed.data.difference ?? null,
      };
    }
    // Use the existing audit_log contract on this same client, before COMMIT.
    await client.query(
      `INSERT INTO dojo.audit_log (action, actor_user_id, feature_key, effect, meta)
      VALUES ($1, $2::uuid, $1, 'success', $3::jsonb)`,
      [
        action,
        actorId,
        JSON.stringify({
          target_table: "dojo.card_category_snapshot",
          target_id: saved.id,
          category_id: saved.category_id,
          measured_on: saved.measured_on,
          before_count: before,
          after_count: saved.card_count,
          before_ranking: beforeRanking,
          after_ranking: saved.ranking,
          before_difference: beforeDifference,
          after_difference: saved.difference,
        }),
      ],
    );
    await client.query("COMMIT");
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => undefined);
    const { code, constraint } = error as {
      code?: string;
      constraint?: string;
    };
    if (
      !correction &&
      code === "23505" &&
      constraint === "card_category_snapshot_category_date_key"
    )
      return responseError("SNAPSHOT_ALREADY_EXISTS", 409);
    console.error("[card-categories] snapshot transaction failed", {
      code: code ?? "UNKNOWN",
    });
    return responseError("SNAPSHOT_SAVE_FAILED", 503);
  } finally {
    client?.release();
  }

  let freshness: "fresh" | "pending" = "fresh";
  for (const invalidate of [
    () => revalidateTag(CATEGORY_CACHE_TAG, { expire: 0 }),
    () => revalidatePath("/cardattack/categories", "layout"),
    () => revalidatePath("/shaolin", "layout"),
    () => revalidatePath("/unclejimmy/bricks", "layout"),
  ]) {
    try {
      invalidate();
    } catch {
      // Persistence and audit succeeded; keep the save outcome truthful.
      freshness = "pending";
    }
  }
  if (freshness === "pending")
    console.warn("[card-categories] saved; cache invalidation pending");
  return NextResponse.json(
    { id: saved.id, status: "ok", freshness },
    { status: correction ? 200 : 201 },
  );
}
export async function POST(req: Request) {
  return save(req, false);
}
export async function PATCH(req: Request) {
  return save(req, true);
}
