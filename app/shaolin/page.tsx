import type { Metadata, Route } from "next";
import Link from "next/link";
import { Card } from "@ui";
import FullBleedPage from "@/components/layout/FullBleedPage";
import PageIntro from "@/components/layout/PageIntro";
import { ALTER_EGO_OPTIONS, type AlterEgo } from "@/lib/alterEgo";
import { getPublishedPosts } from "@/lib/blog";
import { fmtDate } from "@/lib/datetime";
import { buildMetadata } from "@/lib/seo/builders";
import { canonicalFor } from "@/lib/seo/url";
import { normalizeTagSlug } from "@/lib/tags";
import ChronicleListClient, {
  type ChronicleListRow,
} from "./_components/ChronicleListClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Shaolin Chronicles | tullyelly",
    description:
      "Search and explore the Shaolin Chronicles archive by alter ego and tag.",
    canonical: canonicalFor("/shaolin"),
    type: "website",
    twitterCard: "summary",
  });
}

function isAlterEgo(value: string | undefined): value is AlterEgo {
  return ALTER_EGO_OPTIONS.some((alterEgo) => alterEgo === value);
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ alterEgo?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const requestedAlterEgo = params?.alterEgo?.trim().toLowerCase();
  const initialAlterEgo = isAlterEgo(requestedAlterEgo)
    ? requestedAlterEgo
    : "";
  const posts = getPublishedPosts();
  const rows: ChronicleListRow[] = posts.map((post) => ({
    slug: post.slug,
    url: post.url,
    title: post.title,
    summary: post.summary,
    date: post.date,
    alterEgo: post.resolvedAlterEgo as AlterEgo,
    tags: Array.from(new Set((post.tags ?? []).map(normalizeTagSlug))),
    infinityStone: post.infinityStone,
  }));
  const tags = Array.from(new Set(rows.flatMap((row) => row.tags))).sort(
    (a, b) => a.localeCompare(b),
  );
  const infinityStoneCount = rows.filter((row) => row.infinityStone).length;
  const latestChronicle = rows[0];

  return (
    <FullBleedPage articleClassName="md:max-w-[var(--content-max)]">
      <Card
        as="section"
        className="space-y-8 border-0 px-1 pb-6 pt-0 shadow-none md:px-8 md:pb-8"
      >
        <PageIntro title="Shaolin Chronicles">
          <p className="text-[16px] text-muted-foreground md:text-[18px]">
            The running record of whatever I&apos;m building, collecting,
            fixing, breaking, watching, thinking about, or otherwise getting
            myself into.
          </p>
        </PageIntro>

        <section aria-label="Chronicle metrics">
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric
              label="Latest"
              value={
                latestChronicle ? (
                  <Link
                    href={latestChronicle.url as Route}
                    className="link-blue"
                  >
                    <time dateTime={latestChronicle.date}>
                      {fmtDate(latestChronicle.date)}
                    </time>
                  </Link>
                ) : (
                  "Not available"
                )
              }
            />
            <Metric label="Chronicles" value={String(rows.length)} />
            <Metric
              label="Tags"
              value={
                <>
                  {tags.length}{" "}
                  <Link href="/shaolin/tags" className="link-blue text-sm">
                    (view all)
                  </Link>
                </>
              }
            />
            <Metric
              label="Infinity Stones"
              value={String(infinityStoneCount)}
            />
          </dl>
        </section>

        <section className="space-y-4" aria-labelledby="chronicles-heading">
          <div className="space-y-1">
            <h2
              id="chronicles-heading"
              className="text-2xl font-semibold tracking-tight text-ink"
            >
              Chronicles
            </h2>
            <p className="text-sm text-muted-foreground">
              Search the whole archive or narrow things down by alter ego and
              tag.
            </p>
          </div>

          <ChronicleListClient
            rows={rows}
            alterEgos={ALTER_EGO_OPTIONS}
            initialAlterEgo={initialAlterEgo}
          />
        </section>
      </Card>
    </FullBleedPage>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card as="div" className="p-3 md:p-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-ink/60">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums text-ink">
        {value}
      </dd>
    </Card>
  );
}
