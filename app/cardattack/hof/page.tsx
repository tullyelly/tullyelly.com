import DataPageShell from "@/components/layout/DataPageShell";
import PageIntro from "@/components/layout/PageIntro";
import {
  listTcdbTradeHallOfFameInductions,
  listTcdbTradeHallOfFamers,
} from "@/lib/tcdb-trade-hall-of-fame";
import { getSetCollectorDetailHref } from "@/lib/set-collector-content";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import TcdbTradeHallOfFameInductionsTable from "../tcdb-trades/_components/TcdbTradeHallOfFameInductionsTable";
import TcdbTradeHallOfFameTable from "../tcdb-trades/_components/TcdbTradeHallOfFameTable";

const pageTitle = "TCDb Trade Hall of Fame | tullyelly";
const pageDescription =
  "Meet the TCDb trade partners inducted into the tullyelly Hall of Fame and the completed sets behind each induction.";

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: canonicalUrl("cardattack/hof") },
  openGraph: {
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

  return (
    <DataPageShell>
      <PageIntro
        title="TCDb Trade Hall of Fame"
        description="Celebrating the trade partners who helped close out a set."
      />

      <TcdbTradeHallOfFameTable rows={hallOfFamers} />
      <TcdbTradeHallOfFameInductionsTable rows={inductionRows} />
    </DataPageShell>
  );
}
