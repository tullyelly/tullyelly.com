import { makeListGenerateMetadata } from "@/lib/seo/factories";
import { renderTcdbRankingsPage } from "./renderTcdbRankingsPage";
import type { SearchParams } from "./renderTcdbRankingsPage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const generateMetadata = makeListGenerateMetadata({
  path: "/cardattack/tcdb-rankings",
  getTitle: (q, page) => {
    const base = "cardattack; TCDb rankings";
    const withQuery = q ? `${base}; search: "${q}"` : base;
    return page && page !== "1" ? `${withQuery}; page ${page}` : withQuery;
  },
  getDescription: (q, page) => {
    const base = q
      ? `Cardattack TCDb rankings filtered by "${q}"; review snapshots and handmade trends`
      : "Cardattack TCDb rankings; review snapshots and handmade trends";
    return page && page !== "1" ? `${base} (page ${page}).` : `${base}.`;
  },
});

type PageProps = {
  searchParams: Promise<SearchParams | undefined>;
};

export default async function Page({ searchParams }: PageProps) {
  return renderTcdbRankingsPage(searchParams);
}
