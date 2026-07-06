import { makeListGenerateMetadata } from "@/lib/seo/factories";
import { renderTcdbRankingsPage } from "../tcdb-rankings/renderTcdbRankingsPage";
import type { SearchParams } from "../tcdb-rankings/renderTcdbRankingsPage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const generateMetadata = makeListGenerateMetadata({
  path: "/cardattack/homies",
  getTitle: (q, page) => {
    const base = "cardattack; homies";
    const withQuery = q ? `${base}; search: "${q}"` : base;
    return page && page !== "1" ? `${withQuery}; page ${page}` : withQuery;
  },
  getDescription: (q, page) => {
    const base = q
      ? `Cardattack homies filtered by "${q}"; review player snapshots and handmade trends`
      : "Cardattack homies; review player snapshots and handmade trends";
    return page && page !== "1" ? `${base} (page ${page}).` : `${base}.`;
  },
});

type PageProps = {
  searchParams: Promise<SearchParams | undefined>;
};

export default async function Page({ searchParams }: PageProps) {
  return renderTcdbRankingsPage(searchParams);
}
