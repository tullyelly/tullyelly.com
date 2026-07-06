import { notFound } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";
import { Card } from "@ui";
import RankingDetailPage, {
  formatBoolean,
  formatRankingDate,
  formatRankingNumber,
  formatRankingSigned,
  rankingTrendField,
} from "@/components/tcdb/RankingDetailPage";
import { getHomieTcdbRankingByRouteKey } from "@/lib/data/tcdb";
import type { ChronicleTagDisplayName } from "@/lib/chronicle-person-tags";
import { listChronicleTagDisplayNames } from "@/lib/chronicle-person-tags";
import type { TagMetadata } from "@/lib/tags-server";
import { getStoredTagMetadataForHrefKind } from "@/lib/tags-server";
import { getHomieTcdbRankingHref } from "@/lib/tcdb-homie-routes";
import { makeDetailGenerateMetadata } from "@/lib/seo/factories";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export const generateMetadata = makeDetailGenerateMetadata({
  pathBase: "/cardattack/homies",
  paramKey: "tagSlugOrId",
  fetcher: async (tagSlugOrId: string) =>
    await getHomieTcdbRankingByRouteKey(tagSlugOrId),
  resolve: (ranking) => {
    const title = `${ranking.name}; Jersey ${ranking.homie_id}`;
    const description = `TCDB ranking for ${ranking.name}; rank ${ranking.ranking} with ${ranking.card_count} cards as of ${ranking.ranking_at}.`;
    return {
      title,
      description,
      canonicalPath: getHomieTcdbRankingHref(ranking),
      index: true,
    };
  },
});

type PageProps = {
  params: Promise<{ tagSlugOrId: string }>;
};

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function HomieChronicleDisplayNamesSection({
  tagMetadata,
  displayNames,
}: {
  tagMetadata: TagMetadata;
  displayNames: ChronicleTagDisplayName[];
}) {
  const tagHref =
    `/shaolin/tags/${encodeURIComponent(tagMetadata.slug)}` as Route;

  return (
    <Card
      as="section"
      className="border-[color:var(--trade-border)] bg-[color:var(--trade-off-white)]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-semibold uppercase leading-tight text-[color:var(--trade-rust-deep)] opacity-80 md:text-[0.72rem]">
            Chronicle names
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[color:var(--trade-charcoal)]">
            Display names for {tagMetadata.displayName}
          </h2>
        </div>
        <Link
          href={tagHref}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--trade-border)] px-4 text-sm font-semibold leading-none text-[color:var(--trade-blue)] transition hover:bg-[color:var(--trade-blue-soft)]"
          prefetch={false}
        >
          Chronicle tag
        </Link>
      </div>

      {displayNames.length > 0 ? (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {displayNames.map((variant) => (
            <li
              key={variant.displayName}
              className="min-w-0 rounded-xl border border-[color:var(--trade-border)] bg-white px-3.5 py-3"
            >
              <div className="truncate text-sm font-semibold text-[color:var(--trade-charcoal)]">
                {variant.displayName}
              </div>
              <div className="mt-1 text-xs font-medium leading-snug text-[color:var(--trade-muted)]">
                {pluralize(variant.count, "mention")} across{" "}
                {pluralize(variant.chronicleCount, "chronicle")}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm leading-6 text-[color:var(--trade-muted)]">
          No Chronicle display names found for this homie tag yet.
        </p>
      )}
    </Card>
  );
}

export default async function Page({ params }: PageProps) {
  const { tagSlugOrId } = await params;
  const ranking = await getHomieTcdbRankingByRouteKey(tagSlugOrId);
  if (!ranking) return notFound();

  const homieHref = getHomieTcdbRankingHref(ranking);
  const tagMetadata = await getStoredTagMetadataForHrefKind({
    slug: ranking.tag_slug,
    href: homieHref,
    hrefKind: "homie",
  });
  const chronicleTagMetadata =
    tagMetadata?.hrefKind === "homie" ? tagMetadata : null;
  const chronicleDisplayNames = chronicleTagMetadata
    ? listChronicleTagDisplayNames(chronicleTagMetadata.slug)
    : [];

  return (
    <RankingDetailPage
      title={ranking.name}
      eyebrow={`Jersey ${ranking.homie_id}`}
      fields={[
        {
          label: "Current Rank",
          value: formatRankingNumber(ranking.ranking),
        },
        {
          label: "Total Cards",
          value: formatRankingNumber(ranking.card_count),
        },
        {
          label: "Jersey / Homie ID",
          value: ranking.homie_id,
        },
        {
          label: "Difference",
          value: formatRankingSigned(ranking.difference),
        },
        {
          label: "Rank Delta",
          value: formatRankingSigned(ranking.rank_delta),
        },
        {
          label: "Difference Delta",
          value: formatRankingSigned(ranking.diff_delta),
        },
        {
          label: "Ranking Updated",
          value: formatRankingDate(ranking.ranking_at),
        },
        {
          label: "Overall Trend",
          value: rankingTrendField(ranking.trend_overall),
        },
        {
          label: "Rank Trend",
          value: rankingTrendField(ranking.trend_rank),
        },
        {
          label: "Diff Sign Changed",
          value: formatBoolean(ranking.diff_sign_changed),
        },
      ]}
    >
      {chronicleTagMetadata ? (
        <HomieChronicleDisplayNamesSection
          tagMetadata={chronicleTagMetadata}
          displayNames={chronicleDisplayNames}
        />
      ) : null}
    </RankingDetailPage>
  );
}
