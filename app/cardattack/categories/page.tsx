import DataPageShell from "@/components/layout/DataPageShell";
import PageIntro from "@/components/layout/PageIntro";
import CategoryOverview from "@/components/categories/CategoryOverview";
import CategoryUnavailable from "@/components/categories/CategoryUnavailable";
import SnapshotButton from "@/components/categories/SnapshotButton";
import { listCardCategories } from "@/lib/data/card-categories";
import { canCurrentUser } from "@/lib/authz";
import { chicagoToday } from "@/lib/card-categories";
import { tcdbTradePageThemeVars } from "@/lib/tcdb-theme";
import { buildMetadata } from "@/lib/seo/builders";
import { canonicalFor } from "@/lib/seo/url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = buildMetadata({
  title: "cardattack; categories",
  description:
    "Owned-card counts, TCDb rankings, differences and trends by category and measurement date.",
  canonical: canonicalFor("/cardattack/categories"),
});
export default async function Page() {
  const [data, allowed] = await Promise.allSettled([
    listCardCategories(),
    canCurrentUser("tcdb.category.snapshot.create"),
  ]);
  const categories = data.status === "fulfilled" ? data.value : null;
  return (
    <div style={tcdbTradePageThemeVars}>
      <DataPageShell width="wide">
        <PageIntro
          title="Categories"
          description="Owned-card counts, optional TCDb rankings and signed differences recorded independently for each category. Each snapshot has its own measurement date."
          actions={
            categories?.length &&
            allowed.status === "fulfilled" &&
            allowed.value ? (
              <SnapshotButton
                categories={categories}
                defaultDate={chicagoToday()}
              />
            ) : null
          }
        />
        {categories ? (
          <CategoryOverview categories={categories} />
        ) : (
          <CategoryUnavailable />
        )}
      </DataPageShell>
    </div>
  );
}
