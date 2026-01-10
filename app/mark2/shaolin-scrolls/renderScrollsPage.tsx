import ActionBar from "./_components/ActionBar";
import ReleaseTypeLegend from "./_components/ReleaseTypeLegend";
import ScrollsPageClient from "./_components/ScrollsPageClient";
import { getReleaseTypes, getScrollsPage, type Sort } from "@/lib/scrolls";
import {
  PAGE_SIZE_OPTIONS,
  coercePage,
  coercePageSize,
} from "@/lib/pagination";

export type ScrollsSearchParams = Promise<{
  q?: string;
  sort?: string;
  page?: string;
  pageSize?: string;
}>;

export async function renderScrollsPage(searchParams: ScrollsSearchParams) {
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
  const releaseTypes = await getReleaseTypes();

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
      <section className="flex flex-col-reverse gap-3 md:flow-root">
        <div className="md:float-right md:ml-6 md:mb-4 w-full md:w-[240px]">
          <ReleaseTypeLegend releaseTypes={releaseTypes} />
        </div>
        <div className="space-y-3">
          <p className="text-[16px] md:text-[18px] text-muted-foreground">
            The shaolin scrolls app was created to help me manage all of my
            personal projects through one release system. This has allowed me to
            bucket work into my alter egos and continue to release card sorting,
            documentation, development, storytelling, and any number of other
            things on a relatively predictable schedule.
          </p>
          <p className="text-[16px] md:text-[18px] text-muted-foreground">
            The major.minor.patch structure I landed on is flexible and suits my
            needs. By pushing my work through this structure, it helps me to
            consider when things will get done, and more importantly, is the
            work completed or not. Sometimes you need to close the book on an
            idea that is good enough and this helps me do just that.
          </p>
          <p className="text-[16px] md:text-[18px] text-muted-foreground">
            2026-01-10: Added the Release Type Legend to help me quickly find
            the right ID......point being, the release creation process needs
            some help. It's too annoying. Not, unlike me.
          </p>
          <p className="text-[16px] md:text-[18px] text-muted-foreground">
            Iterate.
          </p>
        </div>
      </section>
      <section className="space-y-6">
        <ActionBar q={q} />
        <ScrollsPageClient rows={items} meta={meta} />
      </section>
    </div>
  );
}
