import { notFound } from "next/navigation";
import { getTcdbRanking } from "@/lib/data/tcdb";
import { makeDetailGenerateMetadata } from "@/lib/seo/factories";
import { renderTcdbRankingsPage } from "../renderTcdbRankingsPage";
import type { SearchParams } from "../renderTcdbRankingsPage";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export const generateMetadata = makeDetailGenerateMetadata({
  pathBase: "/cardattack/tcdb-rankings",
  fetcher: async (id: string) => await getTcdbRanking(id),
  resolve: (ranking) => {
    const id = String(ranking.homie_id);
    const title = `${ranking.name}; Jersey ${id}`;
    const description = `TCDB ranking for ${ranking.name}; rank ${ranking.ranking} with ${ranking.card_count} cards as of ${ranking.ranking_at}.`;
    return {
      title,
      description,
      canonicalPath: `/cardattack/tcdb-rankings/${id}`,
      index: true,
    };
  },
});

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams | undefined>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const ranking = await getTcdbRanking(id);
  if (!ranking) return notFound();
  return renderTcdbRankingsPage(searchParams);
}
