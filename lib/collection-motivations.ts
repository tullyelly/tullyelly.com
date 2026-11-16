import "server-only";

import { isNextBuild } from "@/lib/env";
import {
  listTypedIdentityRelations,
  type Identity,
} from "@/lib/identity-server";
import { getTagAliasSnapshot } from "@/lib/tag-aliases-server";
import { canonicalTagSlug } from "@/lib/tag-aliases";
import {
  readCollectionReasons,
  type CollectionReason,
} from "@/lib/tag-relationships";

export type CollectionMotivation = {
  id: string;
  subject: Identity;
  person: Identity;
  reasons: CollectionReason[];
  meta: Record<string, unknown>;
};

async function listMotivations(
  slug: string,
  direction: "outgoing" | "incoming",
): Promise<CollectionMotivation[]> {
  if (isNextBuild()) return [];
  const [relations, aliases] = await Promise.all([
    listTypedIdentityRelations(slug, direction, "collected_because_of"),
    getTagAliasSnapshot(),
  ]);
  const byId = new Map<string, CollectionMotivation>();
  const pairs = new Map<string, string>();
  for (const relation of relations) {
    if (
      canonicalTagSlug(relation.source.slug, aliases) !==
        relation.source.slug ||
      canonicalTagSlug(relation.target.slug, aliases) !== relation.target.slug
    ) {
      throw new Error(`Motivation ${relation.id} has noncanonical endpoints`);
    }
    const reasons = readCollectionReasons(relation.meta);
    const motivation: CollectionMotivation = {
      id: relation.id,
      subject: relation.source,
      person: relation.target,
      reasons,
      meta: relation.meta,
    };
    const pair = `${relation.source.id}:${relation.target.id}`;
    const existing = byId.get(motivation.id);
    if (existing) {
      if (JSON.stringify(existing) !== JSON.stringify(motivation))
        throw new Error(`Conflicting motivation ${motivation.id}`);
      continue;
    }
    if (pairs.has(pair))
      throw new Error(`Duplicate motivation endpoints ${pair}`);
    if (
      relation.source.id === relation.target.id ||
      relation.target.metadata.kind !== "person" ||
      !["person", "group"].includes(relation.source.metadata.kind ?? "")
    ) {
      throw new Error(
        `Motivation ${relation.id} has invalid subject/person endpoints`,
      );
    }
    byId.set(motivation.id, motivation);
    pairs.set(pair, motivation.id);
  }
  return [...byId.values()];
}

/** Direct people inspiring this whole subject; never group or motivation traversal. */
export function listCollectionInspirations(
  subjectSlug: string,
): Promise<CollectionMotivation[]> {
  return listMotivations(subjectSlug, "outgoing");
}

/** Direct whole collection subjects inspired by this person. */
export function listCollectionsInspiredBy(
  personSlug: string,
): Promise<CollectionMotivation[]> {
  return listMotivations(personSlug, "incoming");
}
