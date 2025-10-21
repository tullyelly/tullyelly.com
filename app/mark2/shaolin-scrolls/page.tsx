import { makeListGenerateMetadata } from "@/lib/seo/factories";
import ActionBar from "./_components/ActionBar";
import ScrollsPageClient from "./_components/ScrollsPageClient";
import { getScrollsPage, type Sort } from "@/lib/scrolls";
import {
  PAGE_SIZE_OPTIONS,
  coercePage,
  coercePageSize,
} from "@/lib/pagination";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const generateMetadata = makeListGenerateMetadata({
  path: "/mark2/shaolin-scrolls",
  getTitle: (q) => (q ? `Shaolin Scrolls; search: "${q}"` : "Shaolin Scrolls"),
  getDescription: (q) =>
    q
      ? `Browse Shaolin Scrolls filtered by "${q}". Releases, statuses, and dates; queryable and paginated.`
      : "Browse all Shaolin Scrolls. Releases, statuses, and dates; queryable and paginated.",
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
  const params = (await searchParams) ?? {};
  const q = params.q?.trim() ?? "";
  const sort: Sort =
    params.sort === "semver:asc" ? "semver:asc" : "semver:desc";
  const pageSize = coercePageSize(params.pageSize, PAGE_SIZE_OPTIONS[0]);
  let page = coercePage(params.page, 1);

  let offset = (page - 1) * pageSize;
  let response = await getScrollsPage({
    limit: pageSize,
    offset,
    sort,
    q: q || undefined,
  });

  let total = response.page.total;
  let totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;

  if (totalPages > 0 && page > totalPages) {
    page = totalPages;
    offset = (page - 1) * pageSize;
    response = await getScrollsPage({
      limit: pageSize,
      offset,
      sort,
      q: q || undefined,
    });
    total = response.page.total;
    totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
  }

  const { items } = response;

  const meta = {
    page: total > 0 ? page : 0,
    pageSize,
    total,
    totalPages,
    q,
    sort,
  };

  return (
    <div id="scrolls-root" className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
          Shaolin Scrolls
        </h1>
      </header>
      <section className="space-y-6">
        <ActionBar q={q} />
        <ScrollsPageClient rows={items} meta={meta} />
      </section>
    </div>
  );
}
