import DataPageShell from "@/components/layout/DataPageShell";
import PageIntro from "@/components/layout/PageIntro";
import { Stat, StatGrid } from "@/components/ui/StatGrid";
import {
  listTcdbTradeHallOfFameInductions,
  listTcdbTradeHallOfFamers,
} from "@/lib/tcdb-trade-hall-of-fame";
import { getSetCollectorDetailHref } from "@/lib/set-collector-content";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import { SHARED_OPEN_GRAPH_FIELDS } from "@/lib/seo/constants";
import TcdbTradeHallOfFameInductionsTable from "../tcdb-trades/_components/TcdbTradeHallOfFameInductionsTable";
import TcdbTradeHallOfFameTable from "../tcdb-trades/_components/TcdbTradeHallOfFameTable";
import { fmtDate } from "@/lib/datetime";

const pageTitle = "TCDb Trade Hall of Fame | tullyelly";
const pageDescription =
  "Meet the TCDb trade partners inducted into the tullyelly Hall of Fame and the completed sets behind each induction.";
const integerFormatter = new Intl.NumberFormat("en-US");

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: canonicalUrl("cardattack/hof") },
  openGraph: {
    ...SHARED_OPEN_GRAPH_FIELDS,
    title: pageTitle,
    description: pageDescription,
    url: "/cardattack/hof",
    type: "website",
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const [hallOfFamers, inductions] = await Promise.all([
    listTcdbTradeHallOfFamers(),
    listTcdbTradeHallOfFameInductions(),
  ]);
  const inductionRows = inductions.map((induction) => ({
    ...induction,
    setHref: getSetCollectorDetailHref(induction.setSlug),
  }));
  const latestInduction = inductions
    .map((induction) => induction.inductedDate)
    .filter(Boolean)
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0];

  return (
    <DataPageShell>
      <PageIntro
        title="TCDb Trade Hall of Fame"
        description="Celebrating the trade partners who helped close out a set."
      />

      <section aria-label="Hall of Fame scoreboard">
        <StatGrid columns={3} variant="segmented">
          <Stat
            variant="segmented"
            label="Hall of Famers"
            value={integerFormatter.format(hallOfFamers.length)}
          />
          <Stat
            variant="segmented"
            label="Total Inductions"
            value={integerFormatter.format(inductions.length)}
          />
          <Stat
            variant="segmented"
            label="Latest Induction"
            value={
              latestInduction
                ? fmtDate(latestInduction, "America/Chicago", "long")
                : "Not available"
            }
          />
        </StatGrid>
      </section>

      <TcdbTradeHallOfFameTable rows={hallOfFamers} />
      <TcdbTradeHallOfFameInductionsTable rows={inductionRows} />
    </DataPageShell>
  );
}
