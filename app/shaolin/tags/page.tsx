import type { Route } from "next";
import Link from "next/link";
import { Badge } from "@/app/ui/Badge";
import { getBadgeClass } from "@/app/ui/badge-maps";
import FlowersInline from "@/components/flowers/FlowersInline";
import { SectionDivider } from "@/components/SectionDivider";
import { Card } from "@ui";
import { getPublishedPosts, getTagsWithCounts } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo/builders";
import { canonicalFor } from "@/lib/seo/url";

export async function generateMetadata() {
  const title = "Chronicle tags | tullyelly";
  const description =
    "Browse Shaolin chronicle tags, ordered by how often each label appears.";
  return buildMetadata({
    title,
    description,
    canonical: canonicalFor("/shaolin/tags"),
    type: "website",
    twitterCard: "summary",
  });
}

export default function Page() {
  const posts = getPublishedPosts();
  const tags = Object.entries(getTagsWithCounts(posts)).sort(
    ([tagA, countA], [tagB, countB]) =>
      countB - countA || tagA.localeCompare(tagB),
  );

  return (
    <main className="max-w-4xl mx-auto space-y-10 py-6 md:py-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold">chronicle tags</h1>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Every tag in the Shaolin feed, sorted by usage; jump straight to the
          entries that match your current thread.
        </p>
      </header>

      {tags.length > 0 ? (
        <Card as="section" className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium leading-snug">Tags by usage</h2>
            <span className="text-sm text-muted-foreground">
              {tags.length} {tags.length === 1 ? "tag" : "tags"}
            </span>
          </div>
          <ul className="flex flex-wrap gap-3">
            {tags.map(([tag, count]) => (
              <li key={tag}>
                <Link
                  href={`/shaolin/tags/${encodeURIComponent(tag)}` as Route}
                  className="inline-flex"
                  prefetch={false}
                >
                  <Badge className={getBadgeClass("classic")}>
                    #{tag}{" "}
                    <span className="pl-1 text-[11px] opacity-80">
                      ({count})
                    </span>
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          No tags to show yet.
        </p>
      )}

      <SectionDivider />

      <footer className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
            {"; keeps the pages light."}
          </FlowersInline>
        </p>
        <Link href={"/shaolin" as Route} className="link-blue">
          ← Back to chronicles
        </Link>
      </footer>
    </main>
  );
}
