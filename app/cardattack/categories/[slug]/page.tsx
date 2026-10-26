import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@ui";
import DataPageShell from "@/components/layout/DataPageShell";
import PageIntro from "@/components/layout/PageIntro";
import SectionHeader from "@/components/layout/SectionHeader";
import { Stat, StatGrid } from "@/components/ui/StatGrid";
import CategoryRankSummary from "@/components/categories/CategoryRankSummary";
import CategoryHistoryChart from "@/components/categories/CategoryHistoryChart";
import CategoryUnavailable from "@/components/categories/CategoryUnavailable";
import SnapshotButton from "@/components/categories/SnapshotButton";
import {
  getCardCategory,
  listCategoryHistory,
} from "@/lib/data/card-categories";
import {
  chicagoToday,
  formatCategoryChange,
  formatCategoryCount,
} from "@/lib/card-categories";
import { canCurrentUser } from "@/lib/authz";
import { fmtDate } from "@/lib/datetime";
import { tcdbTradePageThemeVars } from "@/lib/tcdb-theme";
import { buildMetadata } from "@/lib/seo/builders";
import { canonicalFor } from "@/lib/seo/url";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return buildMetadata({
    title: `cardattack; ${slug}; category counts`,
    description: `Dated overall owned-card counts, TCDb rankings, differences and history for ${slug}.`,
    canonical: canonicalFor(
      `/cardattack/categories/${encodeURIComponent(slug)}`,
    ),
  });
}
export default async function Page({ params }: Props) {
  const { slug } = await params;
  const [categoryResult, historyResult, createResult, correctResult] =
    await Promise.allSettled([
      getCardCategory(slug),
      listCategoryHistory(slug),
      canCurrentUser("tcdb.category.snapshot.create"),
      canCurrentUser("tcdb.category.snapshot.correct"),
    ]);
  if (categoryResult.status === "fulfilled" && !categoryResult.value)
    return notFound();
  const back = (
    <Link className="underline" href="/cardattack/categories">
      Back to categories
    </Link>
  );
  if (
    categoryResult.status === "rejected" ||
    historyResult.status === "rejected"
  )
    return (
      <DataPageShell>
        <PageIntro title="Category counts" />
        {back}
        <CategoryUnavailable />
      </DataPageShell>
    );
  const category = categoryResult.value!;
  const history = historyResult.value;
  const today = chicagoToday();
  const canCreate = createResult.status === "fulfilled" && createResult.value;
  const canCorrect =
    correctResult.status === "fulfilled" && correctResult.value;
  const options = [{ slug: category.slug, name: category.name }];
  return (
    <div style={tcdbTradePageThemeVars}>
      <DataPageShell width="wide">
        <PageIntro
          title={category.name}
          description="Owned-card counts, TCDb rankings and signed differences; changes compare consecutive measurement dates."
          actions={
            canCreate ? (
              <SnapshotButton
                categories={options}
                category={slug}
                defaultDate={today}
              />
            ) : null
          }
        />
        {back}
        {category.card_count === null ? (
          <Card>
            <p>
              Not tracked yet. Add the first snapshot using the date and overall
              owned-card count you measured.
            </p>
          </Card>
        ) : (
          <>
            <StatGrid columns={4}>
              <Stat
                label="Latest owned-card count"
                value={formatCategoryCount(category.card_count)}
              />
              <Stat label="Measured on" value={fmtDate(category.measured_on)} />
              <Stat
                label="Previous measurement"
                value={
                  category.previous_date
                    ? `${category.previous_count === null ? "" : formatCategoryCount(category.previous_count)} on ${fmtDate(category.previous_date)}`
                    : "No previous measurement"
                }
              />
              <Stat
                label="Count change"
                value={formatCategoryChange(category.count_change)}
              />
            </StatGrid>
            <dl className="grid gap-4 rounded-xl border border-[color:var(--trade-border)] p-4 sm:grid-cols-2">
              <CategoryRankSummary snapshot={category} />
            </dl>
            <section aria-labelledby="category-chart">
              <SectionHeader
                id="category-chart"
                title="Count history"
                description="Each point is a recorded measurement; exact values and dates follow below."
              />
              <div className="mt-4">
                <CategoryHistoryChart snapshots={history} />
              </div>
            </section>
            <section aria-labelledby="category-ranking-chart">
              <SectionHeader
                id="category-ranking-chart"
                title="TCDb ranking history"
                description="Lower rank is better. Unrecorded rankings leave gaps; exact values follow below."
              />
              <div className="mt-4">
                <CategoryHistoryChart snapshots={history} metric="ranking" />
              </div>
            </section>
          </>
        )}
        <section aria-labelledby="category-history">
          <SectionHeader
            id="category-history"
            title="Dated measurements"
            description="Newest measurement first. Correct snapshot keeps the category and date fixed."
          />
          {!history.length ? (
            <p>No measurements recorded yet.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {[...history].reverse().map((row) => (
                <li
                  key={row.snapshot_id}
                  className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-[color:var(--trade-border)] p-4"
                >
                  <div>
                    <p className="font-semibold">
                      <time dateTime={row.measured_on}>
                        {fmtDate(row.measured_on)}
                      </time>
                      : {formatCategoryCount(row.card_count)} cards
                    </p>
                    <p className="text-sm">
                      {formatCategoryChange(row.count_change)}
                      {row.previous_date
                        ? ` since ${fmtDate(row.previous_date)}`
                        : ""}
                    </p>
                    <dl className="mt-2 space-y-2 text-sm">
                      <CategoryRankSummary snapshot={row} />
                    </dl>
                  </div>
                  {canCorrect ? (
                    <SnapshotButton
                      categories={options}
                      category={slug}
                      defaultDate={today}
                      snapshot={row}
                    />
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </section>
      </DataPageShell>
    </div>
  );
}
