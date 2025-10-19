import type { Route } from "next";
import Link from "next/link";
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
    <main className="max-w-3xl mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-semibold">chronicles</h1>

      <section className="flex flex-wrap gap-2">
        {Object.entries(tags).map(([tag, count]) => (
          <Link
            key={tag}
            href={`/shaolin/tags/${encodeURIComponent(tag)}` as Route}
            className="rounded-full border px-3 py-1 text-sm"
          >
            #{tag} <span className="opacity-60">({count})</span>
          </Link>
        ))}
      </section>

      <ul className="space-y-4">
        {items.map((p) => (
          <li key={p.slug} className="border rounded-lg p-4">
            <h2 className="text-xl font-medium">
              <Link href={p.url as Route}>{p.title}</Link>
            </h2>
            <p className="text-sm opacity-70">{fmtDate(p.date)}</p>
            <p className="mt-2 opacity-90">{p.summary}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(p.tags ?? []).map((t) => (
                <Link
                  key={t}
                  href={
                    `/shaolin/tags/${encodeURIComponent(t.toLowerCase())}` as Route
                  }
                  className="text-xs rounded-full border px-2 py-0.5"
                >
                  #{t.toLowerCase()}
                </Link>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <nav className="flex items-center gap-2">
        {Array.from({ length: pages }).map((_, i) => {
          const n = i + 1;
          const href =
            n === 1 ? ("/shaolin" as Route) : (`/shaolin?page=${n}` as Route);
          const cls = n === current ? "font-semibold underline" : "opacity-80";
          return (
            <Link key={n} href={href} className={cls}>
              {n}
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
