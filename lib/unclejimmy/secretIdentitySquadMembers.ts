import "server-only";

import { sql } from "@/lib/db";

const RESERVED_SQUAD_MEMBER_SLUGS = [
  "jeff-meff",
  "bonnibel",
  "volleyball",
] as const;
const RESERVED_SQUAD_MEMBER_SLUG_SET = new Set<string>(
  RESERVED_SQUAD_MEMBER_SLUGS,
);

type SecretIdentityMemberParamRow = {
  user_id: string;
  tag_slug: string | null;
};

type SecretIdentityMemberProfileRow = {
  user_id: string;
  tag_id: number | null;
  tag_slug: string | null;
  name: string | null;
};

export type SecretIdentitySquadMember = {
  userId: string;
  tagId: number;
  tagSlug: string;
  displayName: string;
};

function normalizeMemberSlug(memberSlug: string): string {
  return memberSlug.trim().toLowerCase();
}

function isReservedSquadMemberSlug(memberSlug: string): boolean {
  return RESERVED_SQUAD_MEMBER_SLUG_SET.has(memberSlug);
}

export async function listDynamicSquadMemberParams(): Promise<
  Array<{ member: string }>
> {
  const rows = await sql<SecretIdentityMemberParamRow>`
    SELECT
      u.id AS user_id,
      t.slug AS tag_slug
    FROM auth.users u
    JOIN dojo.tags t
      ON t.id = u.secret_identity_tag_id
    WHERE u.secret_identity_tag_id IS NOT NULL
      AND t.slug IS NOT NULL
      AND t.slug NOT IN (
        ${RESERVED_SQUAD_MEMBER_SLUGS[0]},
        ${RESERVED_SQUAD_MEMBER_SLUGS[1]},
        ${RESERVED_SQUAD_MEMBER_SLUGS[2]}
      )
    ORDER BY t.slug, u.id
  `;

  const seen = new Set<string>();
  const params: Array<{ member: string }> = [];

  for (const row of rows) {
    const memberSlug = normalizeMemberSlug(row.tag_slug ?? "");
    if (!memberSlug || seen.has(memberSlug)) continue;
    seen.add(memberSlug);
    params.push({ member: memberSlug });
  }

  return params;
}

export async function getSecretIdentitySquadMember(
  memberSlug: string,
): Promise<SecretIdentitySquadMember | null> {
  const normalizedMemberSlug = normalizeMemberSlug(memberSlug);

  if (
    !normalizedMemberSlug ||
    isReservedSquadMemberSlug(normalizedMemberSlug)
  ) {
    return null;
  }

  const [row] = await sql<SecretIdentityMemberProfileRow>`
    SELECT
      u.id AS user_id,
      t.id AS tag_id,
      t.slug AS tag_slug,
      p.name
    FROM auth.users u
    JOIN dojo.tags t
      ON t.id = u.secret_identity_tag_id
    JOIN dojo.v_user_profile p
      ON p.user_id = u.id
    WHERE u.secret_identity_tag_id IS NOT NULL
      AND LOWER(t.slug) = ${normalizedMemberSlug}
      AND t.slug NOT IN (
        ${RESERVED_SQUAD_MEMBER_SLUGS[0]},
        ${RESERVED_SQUAD_MEMBER_SLUGS[1]},
        ${RESERVED_SQUAD_MEMBER_SLUGS[2]}
      )
    ORDER BY u.id
    LIMIT 1
  `;

  const tagSlug = normalizeMemberSlug(row?.tag_slug ?? "");

  if (!row || !tagSlug || typeof row.tag_id !== "number") {
    return null;
  }

  return {
    userId: row.user_id,
    tagId: row.tag_id,
    tagSlug,
    displayName: row.name?.trim() || tagSlug,
  };
}
