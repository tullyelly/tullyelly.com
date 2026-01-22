"use server";

import { updateTag } from "next/cache";
import { must } from "@/lib/authz";
import { ensureAuthzInvalidationListener } from "@/lib/authz/invalidation";
import { getCurrentUser } from "@/lib/auth/session";
import { sql } from "@/lib/db";
import { isNextBuild } from "@/lib/env";

if (!isNextBuild()) {
  ensureAuthzInvalidationListener();
}

type MembershipRow = {
  user_id: string;
  email: string | null;
  app_slug: string | null;
  role: string;
  granted_at: string;
};

async function ensureNotSelfLockout(
  actorId: string,
  userId: string,
  role: string,
  appSlug: string | null,
): Promise<void> {
  const normalizedRole = role.trim().toLowerCase();
  const normalizedApp = appSlug?.trim().toLowerCase() ?? null;
  const isSelfTarget =
    actorId === userId &&
    normalizedRole === "admin" &&
    normalizedApp === "admin";
  if (!isSelfTarget) return;

  const [row] = await sql<{ n: number }>`
    SELECT COUNT(*)::int AS n
    FROM dojo.v_authz_memberships
    WHERE role = 'admin' AND app_slug = 'admin'
  `;
  if (!row || row.n <= 1) {
    throw new Error("Refusing to remove the last admin on the admin app.");
  }
}

export async function listMemberships(): Promise<MembershipRow[]> {
  const actor = await getCurrentUser();
  await must(actor, "admin.membership.manage", { strict: true });
  const rows = await sql<MembershipRow>`
    SELECT user_id, email, app_slug, role, granted_at
    FROM dojo.v_authz_memberships
    ORDER BY email, app_slug NULLS FIRST, role
  `;
  return rows.map((row) => ({
    ...row,
    app_slug: row.app_slug === "*global*" ? null : row.app_slug,
  }));
}

type MutationInput = {
  userId: string;
  role: string;
  appSlug?: string | null;
};

function normalizeMutationInput(input: MutationInput): {
  userId: string;
  role: string;
  appSlug: string | null;
} {
  const userId = input.userId.trim();
  const role = input.role.trim();
  const appSlug = input.appSlug?.trim() || null;

  if (!userId) {
    throw new Error("User ID is required.");
  }
  if (!role) {
    throw new Error("Role is required.");
  }

  return { userId, role, appSlug };
}

export async function grantRole(rawInput: MutationInput): Promise<void> {
  const actor = await getCurrentUser();
  await must(actor, "admin.membership.manage", { strict: true });
  const { userId, role, appSlug } = normalizeMutationInput(rawInput);
  if (!actor?.id) throw new Error("Actor is required.");
  await sql`
    SELECT dojo.authz_grant_role(${actor.id}::uuid, ${userId}::uuid, ${role}, ${appSlug})
  `;
  updateTag(`auth:user:${userId}`);
}

export async function revokeRole(rawInput: MutationInput): Promise<void> {
  const actor = await getCurrentUser();
  await must(actor, "admin.membership.manage", { strict: true });
  const { userId, role, appSlug } = normalizeMutationInput(rawInput);
  if (!actor?.id) throw new Error("Actor is required.");
  await ensureNotSelfLockout(actor.id, userId, role, appSlug);
  await sql`
    SELECT dojo.authz_revoke_role(${actor.id}::uuid, ${userId}::uuid, ${role}, ${appSlug})
  `;
  updateTag(`auth:user:${userId}`);
}
