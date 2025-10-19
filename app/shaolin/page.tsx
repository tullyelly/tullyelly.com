import type { Route } from "next";
import Link from "next/link";
import { Badge } from "@/app/ui/Badge";
import { getBadgeClass } from "@/app/ui/badge-maps";
import FlowersInline from "@/components/flowers/FlowersInline";
import { SectionDivider } from "@/components/SectionDivider";
import { Card } from "@ui";
import { getPublishedPosts, getTagsWithCounts, paginate } from "@/lib/blog";
import { fmtDate } from "@/lib/datetime";

export const dynamic = "force-static"; // ensure static generation

const PER_PAGE = 10;

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const pageNum = Number(resolvedSearchParams?.page ?? "1");
  const posts = getPublishedPosts();
  const tags = getTagsWithCounts(posts);
  const { items, pages, current } = paginate(posts, pageNum, PER_PAGE);

  return (
    <main className="max-w-4xl mx-auto space-y-12 py-6 md:py-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold">chronicles</h1>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Welcome to my barely off the ground blog. Much will change. Styling is
          kinda janky. Stay tuned.
        </p>
      </header>

      {Object.keys(tags).length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium leading-snug">Browse by tag</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(tags).map(([tag, count]) => (
              <Link
                key={tag}
                href={`/shaolin/tags/${encodeURIComponent(tag)}` as Route}
                className="inline-flex"
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
            const href =
              n === 1 ? ("/shaolin" as Route) : (`/shaolin?page=${n}` as Route);
            const isCurrent = n === current;
            return (
              <Link
                key={n}
                href={href}
                className={[
                  "inline-flex min-w-9 items-center justify-center rounded-full px-3 py-1 font-medium transition",
                  isCurrent
                    ? "bg-[var(--blue)] text-[var(--text-on-blue)]"
                    : "bg-[var(--surface-card)] text-muted-foreground border border-[var(--border-subtle)] hover:text-[var(--text-primary)]",
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
