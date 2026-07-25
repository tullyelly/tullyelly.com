import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import type { PoolClient } from "pg";
import { z } from "zod";

import { getPool } from "@/db/pool";
import { getCurrentUser } from "@/lib/auth/session";
import { requireTcdbHomieUpdate } from "@/lib/auth/permissions";
import {
  AuthzForbiddenError,
  AuthzUnauthenticatedError,
} from "@/lib/authz/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const inputSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    tag_slug: z
      .union([z.string().trim().max(100), z.null()])
      .transform((value) => value || null)
      .refine((value) => value === null || slugPattern.test(value), {
        message: "Use lowercase letters, numbers, and single hyphens.",
      }),
    drafted: z.coerce.number().int().min(0).max(65535),
    expected_updated_at: z.union([z.string().datetime(), z.null()]),
  })
  .strict();

type HomieValues = {
  id: number;
  name: string;
  tag_slug: string | null;
  drafted: number;
  updated_at: Date | string | null;
};

function jsonError(
  status: number,
  error: string,
  fieldErrors?: Record<string, string[]>,
) {
  return NextResponse.json({ error, fieldErrors }, { status });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const idResult = z.coerce.number().int().positive().safeParse(rawId);
  if (!idResult.success)
    return jsonError(400, "INVALID_INPUT", { id: ["Invalid id."] });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "INVALID_JSON");
  }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "INVALID_INPUT", parsed.error.flatten().fieldErrors);
  }

  try {
    await requireTcdbHomieUpdate();
  } catch (error) {
    if (error instanceof AuthzUnauthenticatedError)
      return jsonError(401, "UNAUTHENTICATED");
    if (error instanceof AuthzForbiddenError)
      return jsonError(403, "FORBIDDEN");
    throw error;
  }

  const actor = await getCurrentUser();
  const client = await (
    getPool() as unknown as { connect(): Promise<PoolClient> }
  ).connect();
  try {
    await client.query("BEGIN");
    const beforeResult = await client.query<HomieValues>(
      `SELECT id, name, tag_slug, drafted, updated_at
         FROM dojo.homie WHERE id = $1::bigint FOR UPDATE`,
      [idResult.data],
    );
    const before = beforeResult.rows[0];
    if (!before) {
      await client.query("ROLLBACK");
      return jsonError(404, "HOMIE_NOT_FOUND");
    }

    const expected = parsed.data.expected_updated_at;
    const current = before.updated_at
      ? new Date(before.updated_at).toISOString()
      : null;
    if (current !== expected) {
      await client.query("ROLLBACK");
      return jsonError(409, "STALE_HOMIE", {
        expected_updated_at: ["This homie changed. Refresh before saving."],
      });
    }

    const updatedResult = await client.query<HomieValues>(
      `UPDATE dojo.homie
          SET name = $2, tag_slug = $3, drafted = $4
        WHERE id = $1::bigint
        RETURNING id, name, tag_slug, drafted, updated_at`,
      [
        idResult.data,
        parsed.data.name,
        parsed.data.tag_slug,
        parsed.data.drafted,
      ],
    );
    const updated = updatedResult.rows[0];
    const metadata = JSON.stringify({
      homie_id: idResult.data,
      before: {
        name: before.name,
        tag_slug: before.tag_slug,
        drafted: before.drafted,
      },
      after: {
        name: updated.name,
        tag_slug: updated.tag_slug,
        drafted: updated.drafted,
      },
      target_table: "dojo.homie",
      target_id: idResult.data,
    });
    await client.query(
      `INSERT INTO dojo.audit_log
        (action, actor_user_id, feature_key, effect, meta)
       VALUES ($1, $2, $1, 'success', $3)`,
      ["tcdb.homie.update", actor?.id ?? null, metadata],
    );
    await client.query("COMMIT");

    for (const tag of ["homies", "homie-options"]) {
      revalidateTag(tag, { expire: 0 });
    }
    return NextResponse.json({
      ...updated,
      updated_at: updated.updated_at
        ? new Date(updated.updated_at).toISOString()
        : null,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    if ((error as { code?: string }).code === "23505") {
      return jsonError(409, "DUPLICATE_TAG_SLUG", {
        tag_slug: ["That tag slug is already in use."],
      });
    }
    console.error("[homies] update failed", error);
    return jsonError(500, "HOMIE_UPDATE_FAILED");
  } finally {
    client.release();
  }
}
