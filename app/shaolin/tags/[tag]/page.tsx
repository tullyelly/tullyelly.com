import type { Route } from "next";
import Link from "next/link";
import { Badge } from "@/app/ui/Badge";
import { getBadgeClass } from "@/app/ui/badge-maps";
import FlowersInline from "@/components/flowers/FlowersInline";
import { SectionDivider } from "@/components/SectionDivider";
import { Card } from "@ui";
import { allPosts } from "contentlayer/generated";
import { notFound } from "next/navigation";
import { getPublishedPosts, byDateDesc } from "@/lib/blog";
import { fmtDate } from "@/lib/datetime";

type Params = { tag: string };

export async function generateStaticParams() {
  const tags = new Set<string>();
  for (const p of allPosts) {
    if (p.draft) continue;
    for (const t of p.tags ?? []) tags.add(t.toLowerCase());
  }
  return Array.from(tags).map((t) => ({ tag: t }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { tag: rawTag } = await params;
  const tag = rawTag.toLowerCase();
  return {
    title: `#${tag} · chronicles`,
    description: `Posts tagged ${tag}`,
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { tag: rawTag } = await params;
  const tag = rawTag.toLowerCase();
  const posts = getPublishedPosts()
    .filter((p) => (p.tags ?? []).map((t) => t.toLowerCase()).includes(tag))
    .sort(byDateDesc);

  if (posts.length === 0) notFound();

  return (
    <main className="max-w-4xl mx-auto space-y-10 py-6 md:py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">#{tag}</h1>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Entries that carry the {tag} label; same chronicle voice with a
          focused thread.
        </p>
      </header>
      <ul className="space-y-6">
        {posts.map((p) => (
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

      <SectionDivider />

      <footer className="space-y-4">
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          <FlowersInline>
            <a
              href="https://github.com/contentlayerdev/contentlayer"
              className="underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contentlayer contributors
            </a>
            {"; keep the MDX flowing."}
          </FlowersInline>
        </p>
        <Link href={"/shaolin" as Route} className="link-blue">
          ← Back to chronicles
        </Link>
      </footer>
    </main>
  );
}
