import type { Route } from "next";
import Link from "next/link";
import { Badge } from "@/app/ui/Badge";
import { getBadgeClass } from "@/app/ui/badge-maps";
import FlowersInline from "@/components/flowers/FlowersInline";
import { SectionDivider } from "@/components/SectionDivider";
import { Card } from "@ui";
import { getPublishedPosts, getTagsWithCounts, paginate } from "@/lib/blog";
import { fmtDate } from "@/lib/datetime";
import { makeListGenerateMetadata } from "@/lib/seo/factories";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PER_PAGE = 10;
const ALTER_EGO_TAGS = [
  "mark2",
  "cardattack",
  "theabbott",
  "unclejimmy",
  "tullyelly",
] as const;
type AlterEgoTag = (typeof ALTER_EGO_TAGS)[number];

function isAlterEgoTag(value: string | undefined): value is AlterEgoTag {
  return (ALTER_EGO_TAGS as readonly string[]).includes(value ?? "");
}

export const generateMetadata = makeListGenerateMetadata({
  path: "/shaolin",
  getTitle: (_q, page) => {
    const base = "Shaolin Chronicles | tullyelly";
    return page && page !== "1" ? `${base}; page ${page}` : base;
  },
  getDescription: (_q, page) => {
    const base =
      "Browse the latest shaolin chronicles; tags, pagination, and archives for ongoing experiments";
    return page && page !== "1" ? `${base} (page ${page}).` : `${base}.`;
  },
});

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; alterEgo?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const alterEgoFilter = (() => {
    const raw = resolvedSearchParams?.alterEgo?.toString().trim().toLowerCase();
    return isAlterEgoTag(raw) ? raw : undefined;
  })();
  const pageNum = Number(resolvedSearchParams?.page ?? "1");
  const posts = getPublishedPosts();
  const filteredPosts = alterEgoFilter
    ? posts.filter((post) =>
        (post.tags ?? []).map((t) => t.toLowerCase()).includes(alterEgoFilter),
      )
    : posts;
  const tags = Object.entries(getTagsWithCounts(filteredPosts)).sort(
    ([tagA, countA], [tagB, countB]) =>
      countB - countA || tagA.localeCompare(tagB),
  );
  const { items, pages, current } = paginate(filteredPosts, pageNum, PER_PAGE);

  const alterEgoQuery = alterEgoFilter
    ? `alterEgo=${encodeURIComponent(alterEgoFilter)}`
    : "";
  const pageHref = (page: number) => {
    const base =
      page === 1 ? "/shaolin" : `/shaolin?page=${encodeURIComponent(page)}`;
    if (!alterEgoQuery) return base as Route;
    const joiner = base.includes("?") ? "&" : "?";
    return `${base}${joiner}${alterEgoQuery}` as Route;
  };

  return (
    <main className="max-w-4xl mx-auto space-y-12 py-6 md:py-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold">chronicles</h1>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Welcome to my barely off the ground blog. Much will change. Styling is
          kinda janky. Stay tuned.
        </p>
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-medium leading-snug">
            Filter by alter-ego
          </h2>
          {alterEgoFilter ? (
            <Link
              href={"/shaolin" as Route}
              className="text-sm link-blue"
              prefetch={false}
            >
              Clear filter
            </Link>
          ) : null}
        </div>
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
          <Link
            href={"/shaolin" as Route}
            className="inline-flex flex-shrink-0"
            prefetch={false}
            aria-current={alterEgoFilter ? undefined : "page"}
          >
            <Badge
              className={[
                getBadgeClass(alterEgoFilter ? "archived" : "planned"),
                "whitespace-nowrap",
              ].join(" ")}
            >
              All alter-egos
            </Badge>
          </Link>
          {ALTER_EGO_TAGS.map((tag) => {
            const href = `/shaolin?alterEgo=${encodeURIComponent(
              tag,
            )}` as Route;
            const isActive = alterEgoFilter === tag;
            return (
              <Link
                key={tag}
                href={href}
                className="inline-flex flex-shrink-0"
                prefetch={false}
                aria-current={isActive ? "page" : undefined}
              >
                <Badge
                  className={[
                    getBadgeClass(isActive ? "planned" : "archived"),
                    "whitespace-nowrap",
                  ].join(" ")}
                >
                  #{tag}
                </Badge>
              </Link>
            );
          })}
        </div>
        {alterEgoFilter ? (
          <p className="text-sm text-muted-foreground">
            Showing chronicles tagged #{alterEgoFilter}.
          </p>
        ) : null}
      </section>

      {tags.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-medium leading-snug">Browse by tag</h2>
            <Link
              href={"/shaolin/tags" as Route}
              className="text-sm link-blue"
              prefetch={false}
            >
              View all
            </Link>
          </div>
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
            {tags.map(([tag, count]) => (
              <Link
                key={tag}
                href={`/shaolin/tags/${encodeURIComponent(tag)}` as Route}
                className="inline-flex flex-shrink-0"
                prefetch={false}
              >
                <Badge className={getBadgeClass("classic")}>
                  #{tag}{" "}
                  <span className="pl-1 text-[11px] opacity-80">({count})</span>
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <SectionDivider />

      <ul className="space-y-6">
        {items.map((p) => (
          <Card as="li" key={p.slug} className="p-6 space-y-4">
            <header className="space-y-1">
              <h2 className="text-2xl font-semibold leading-snug">
                <Link href={p.url as Route} className="link-blue">
                  {p.title}
                </Link>
              </h2>
              <span className="text-sm text-muted-foreground">
                {fmtDate(p.date)}
              </span>
            </header>
            <p className="text-[16px] md:text-[18px] leading-relaxed text-muted-foreground">
              {p.summary}
            </p>
            {(p.tags ?? []).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {(p.tags ?? []).map((t) => (
                  <Link
                    key={t}
                    href={
                      `/shaolin/tags/${encodeURIComponent(
                        t.toLowerCase(),
                      )}` as Route
                    }
                    className="inline-flex"
                    prefetch={false}
                  >
                    <Badge className={getBadgeClass("planned")}>
                      #{t.toLowerCase()}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : null}
          </Card>
        ))}
      </ul>

      <footer className="space-y-6">
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          <FlowersInline>
            <a
              href="https://www.contentlayer.dev/"
              className="underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contentlayer
            </a>
            {", "}
            <a
              href="https://nextjs.org/"
              className="underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Next.js
            </a>
            {" & "}
            <a
              href="https://tailwindcss.com/"
              className="underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Tailwind CSS
            </a>
          </FlowersInline>
        </p>
        <nav
          className="flex flex-wrap items-center gap-2 text-sm"
          aria-label="Pagination"
        >
          {Array.from({ length: pages }).map((_, i) => {
            const n = i + 1;
            const href = pageHref(n);
            const isCurrent = n === current;
            return (
              <Link
                key={n}
                href={href}
                className={[
                  "inline-flex min-w-9 items-center justify-center rounded-full px-3 py-1 font-medium transition",
                  isCurrent
                    ? "bg-[var(--blue)] !text-white hover:!text-white focus-visible:!text-white"
                    : "bg-[var(--surface-card)] text-blue-600 border border-[var(--border-subtle)] hover:text-[var(--text-primary)]",
                ].join(" ")}
              >
                {n}
              </Link>
            );
          })}
        </nav>
      </footer>
    </main>
  );
}
