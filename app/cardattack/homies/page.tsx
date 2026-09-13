import { makeListGenerateMetadata } from "@/lib/seo/factories";
import { unstable_cache } from "next/cache";
import DataPageShell from "@/components/layout/DataPageShell";
import PageIntro from "@/components/layout/PageIntro";
import SectionHeader from "@/components/layout/SectionHeader";
import { canCurrentUser } from "@/lib/authz";
import { listHomieDirectory } from "@/lib/data/homies";
import { listChroniclePersonTagCounts } from "@/lib/chronicle-person-tags";
import { getHomieOptions } from "./_lib/getHomieOptions";
import { getCurrentDateIso } from "./_lib/getCurrentDate";
import AddSnapshotButton from "./_components/AddSnapshotButton";
import HomieDirectory from "./_components/HomieDirectory";
import HomieTagUsageSummary from "./_components/HomieTagUsageSummary";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const generateMetadata = makeListGenerateMetadata({
  path: "/cardattack/homies",
  getTitle: (q, page) => {
    const base = "cardattack; homies";
    const withQuery = q ? `${base}; search: "${q}"` : base;
    return page && page !== "1" ? `${withQuery}; page ${page}` : withQuery;
  },
  getDescription: (q, page) => {
    const base = q
      ? `Cardattack homies filtered by "${q}"; review player snapshots and handmade trends`
      : "Cardattack homies; review player snapshots and handmade trends";
    return page && page !== "1" ? `${base} (page ${page}).` : `${base}.`;
  },
});

const readHomies = unstable_cache(listHomieDirectory, ["homie-directory"], {
  revalidate: 300,
  tags: ["homies"],
});

export default async function Page(_props?: {
  searchParams?: Promise<Record<string, string | undefined> | undefined>;
}) {
  const [rows, canCreate, canUpdate, homieOptions, currentDate] =
    await Promise.all([
      readHomies(),
      canCurrentUser("tcdb.snapshot.create"),
      canCurrentUser("tcdb.homie.update"),
      getHomieOptions(),
      getCurrentDateIso(),
    ]);
  const homiesByTag = new Map(
    rows.flatMap((row) => (row.tag_slug ? [[row.tag_slug, row] as const] : [])),
  );
  const tagUsage = listChroniclePersonTagCounts(
    Array.from(homiesByTag.keys()),
  ).flatMap((usage) => {
    const homie = homiesByTag.get(usage.tag);
    return homie
      ? [
          {
            ...usage,
            name: homie.name,
            href: `/cardattack/homies/${homie.route_slug}`,
          },
        ]
      : [];
  });
  return (
    <DataPageShell>
      <PageIntro
        title="Homies"
        description="The public homie directory, with current TCDb collection rankings where available."
        actions={
          canCreate ? (
            <AddSnapshotButton
              homieOptions={homieOptions}
              defaultRankingDate={
                currentDate ||
                rows.find((row) => row.ranking_at)?.ranking_at ||
                ""
              }
            />
          ) : null
        }
      />
      <HomieTagUsageSummary rows={tagUsage} />
      <section className="space-y-4" aria-labelledby="homie-directory-heading">
        <SectionHeader
          id="homie-directory-heading"
          eyebrow="cardattack directory"
          title="Homie Directory"
          description="Search the roster or narrow it by current collection trend."
        />
        <HomieDirectory initialRows={rows} canUpdate={canUpdate} />
      </section>
    </DataPageShell>
  );
}
