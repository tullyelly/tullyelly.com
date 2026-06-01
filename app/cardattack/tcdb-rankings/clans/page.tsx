import { makeListGenerateMetadata } from "@/lib/seo/factories";
import {
  renderTcdbClanRankingsPage,
  type ClanSearchParams,
} from "./renderTcdbClanRankingsPage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const generateMetadata = makeListGenerateMetadata({
  path: "/cardattack/tcdb-rankings/clans",
  getTitle: (q, page) => {
    const base = "cardattack; TCDb clan rankings";
    const withQuery = q ? `${base}; search: "${q}"` : base;
    return page && page !== "1" ? `${withQuery}; page ${page}` : withQuery;
  },
  getDescription: (q, page) => {
    const base = q
      ? `Cardattack TCDb clan rankings filtered by "${q}"; review clan snapshots and handmade trends`
      : "Cardattack TCDb clan rankings; review clan snapshots and handmade trends";
    return page && page !== "1" ? `${base} (page ${page}).` : `${base}.`;
  },
});

type PageProps = {
  searchParams: Promise<ClanSearchParams | undefined>;
};

export default async function Page({ searchParams }: PageProps) {
  return renderTcdbClanRankingsPage(searchParams);
}
