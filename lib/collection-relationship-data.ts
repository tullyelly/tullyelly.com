import "server-only";
import { cache } from "react";
import { isNextBuild } from "@/lib/env";
import {
  listCollectionInspirations,
  listCollectionsInspiredBy,
  type CollectionMotivation,
} from "@/lib/collection-motivations";
import {
  listTypedIdentityRelations,
  type Identity,
} from "@/lib/identity-server";
import { getHomieTcdbRankingByRouteKey } from "@/lib/data/tcdb";
import { getTcdbClanRankingsBySlug } from "@/lib/data/tcdb-clans";
import { formatClanSportLabel } from "@/lib/tcdb-clan-format";

export type CollectionCount = {
  label: string;
  cardCount: number;
  rankingAt: string;
};
export type CollectionRelationshipEntry = {
  motivation: CollectionMotivation;
  counts: CollectionCount[];
};
export type CollectionRelationshipData = {
  available: boolean;
  entries: CollectionRelationshipEntry[];
  aliases: Identity[];
};
export type CollectionRelationshipMode = "person" | "subject";

const readCounts = cache(
  async (slug: string, role: string): Promise<CollectionCount[]> => {
    try {
      if (role === "homie") {
        const row = await getHomieTcdbRankingByRouteKey(slug);
        return row
          ? [
              {
                label: "Cards",
                cardCount: row.card_count,
                rankingAt: row.ranking_at,
              },
            ]
          : [];
      }
      if (role === "clan") {
        const rows = await getTcdbClanRankingsBySlug(slug);
        return rows.map((row) => ({
          label: formatClanSportLabel(row.sport),
          cardCount: row.card_count,
          rankingAt: row.ranking_at,
        }));
      }
      return [];
    } catch (error) {
      console.warn(
        `[collection-relationships] Count unavailable for ${slug}`,
        error,
      );
      return [];
    }
  },
);

export async function loadCollectionRelationshipData(
  slug: string,
  mode: CollectionRelationshipMode,
): Promise<CollectionRelationshipData> {
  if (isNextBuild()) return { available: true, entries: [], aliases: [] };
  const aliasPromise = listTypedIdentityRelations(slug, "incoming", "alias_of")
    .then((edges) => [
      ...new Map(edges.map((edge) => [edge.source.id, edge.source])).values(),
    ])
    .catch((error: unknown) => {
      console.warn(
        "[collection-relationships] Alternate names unavailable",
        error,
      );
      return [];
    });
  try {
    const motivations = await (mode === "person"
      ? listCollectionsInspiredBy(slug)
      : listCollectionInspirations(slug));
    const entries = await Promise.all(
      motivations.map(async (motivation) => ({
        motivation,
        counts:
          mode === "person"
            ? await readCounts(
                motivation.subject.slug,
                motivation.subject.metadata.contexts.cardattack?.role ?? "",
              )
            : [],
      })),
    );
    return { available: true, entries, aliases: await aliasPromise };
  } catch (error) {
    console.warn(
      "[collection-relationships] Direct motivations unavailable",
      error,
    );
    return { available: false, entries: [], aliases: await aliasPromise };
  }
}
