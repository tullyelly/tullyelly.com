import "server-only";

import ScrollsPageClient from "@/app/shaolin-scrolls/_components/ScrollsPageClient";
import { getScrollsPage, type Sort } from "@/lib/scrolls";

export default async function ScrollsTablePanel({
  limit = 20,
  offset = 0,
  sort = "semver:desc",
  q,
}: {
  limit?: number;
  offset?: number;
  sort?: Sort;
  q?: string;
}) {
  const response = await getScrollsPage({ limit, offset, sort, q });
  const { items, page } = response;
  const total = page.total;
  const pageSize = page.limit;
  const currentPage = total > 0 ? Math.floor(page.offset / pageSize) + 1 : 0;
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
  return (
    <ScrollsPageClient
      rows={items}
      meta={{
        page: currentPage,
        pageSize,
        total,
        totalPages,
        q: q ?? "",
        sort,
      }}
    />
  );
}
