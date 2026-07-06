import { notFound } from "next/navigation";
import RankingDetailPage, {
  formatBoolean,
  formatRankingDate,
  formatRankingNumber,
  formatRankingSigned,
  rankingTrendField,
} from "@/components/tcdb/RankingDetailPage";
import {
  getHomieTcdbRankingByRouteKey,
} from "@/lib/data/tcdb";
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

export default async function Page({ params }: PageProps) {
  const { tagSlugOrId } = await params;
  const ranking = await getHomieTcdbRankingByRouteKey(tagSlugOrId);
  if (!ranking) return notFound();

  return (
    <RankingDetailPage
      title={ranking.name}
      eyebrow={`Jersey: ${ranking.homie_id}`}
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
    />
  );
}
