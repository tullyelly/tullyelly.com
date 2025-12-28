import { makeListGenerateMetadata } from "@/lib/seo/factories";
import { renderScrollsPage } from "./renderScrollsPage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const generateMetadata = makeListGenerateMetadata({
  path: "/mark2/shaolin-scrolls",
  getTitle: (q, page) => {
    const base = "Shaolin Scrolls";
    const withQuery = q ? `${base}; search: \"${q}\"` : base;
    return page && page !== "1" ? `${withQuery}; page ${page}` : withQuery;
  },
  getDescription: (q, page) => {
    const base = q
      ? `Browse Shaolin Scrolls filtered by \"${q}\". Releases, statuses, and dates; queryable and paginated`
      : "Browse all Shaolin Scrolls. Releases, statuses, and dates; queryable and paginated";
    return page && page !== "1" ? `${base} (page ${page}).` : `${base}.`;
  },
});

interface PageProps {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    page?: string;
    pageSize?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  return renderScrollsPage(searchParams);
}
