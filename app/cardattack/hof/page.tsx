import { Card } from "@ui";
import FullBleedPage from "@/components/layout/FullBleedPage";
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
    <FullBleedPage articleClassName="md:max-w-[var(--content-max)]">
      <Card
        as="section"
        className="space-y-8 border-0 px-1 pb-6 pt-0 shadow-none md:px-8 md:pb-8 md:pt-0"
      >
        <PageIntro title="TCDb Trade Hall of Fame">
          <p className="text-[16px] md:text-[18px] text-muted-foreground">
            Celebrating the trade partners who helped close out a set.
          </p>
        </PageIntro>

        <TcdbTradeHallOfFameTable rows={hallOfFamers} />
        <TcdbTradeHallOfFameInductionsTable rows={inductionRows} />
      </Card>
    </FullBleedPage>
  );
}
