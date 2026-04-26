import { Card } from "@ui";
import FullBleedPage from "@/components/layout/FullBleedPage";
import PageIntro from "@/components/layout/PageIntro";
import {
  listTcdbTradeHallOfFameInductions,
  listTcdbTradeHallOfFamers,
} from "@/lib/tcdb-trade-hall-of-fame";
import { getSetCollectorDetailHref } from "@/lib/set-collector-content";
import { listTcdbTrades } from "@/lib/tcdb-trades";
import TcdbTradeHallOfFameInductionsTable from "./_components/TcdbTradeHallOfFameInductionsTable";
import TcdbTradeHallOfFameTable from "./_components/TcdbTradeHallOfFameTable";
import TcdbTradeListClient from "./_components/TcdbTradeListClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const [trades, hallOfFamers, inductions] = await Promise.all([
    listTcdbTrades(),
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
        <PageIntro title="TCDb Trades">
          <p className="text-[16px] md:text-[18px] text-muted-foreground">
            Thank you to all of my trade partners. A wonderful community.
          </p>
        </PageIntro>

        <TcdbTradeHallOfFameTable rows={hallOfFamers} />
        <TcdbTradeHallOfFameInductionsTable rows={inductionRows} />

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">
              TCDb Trades
            </h2>
            <p className="text-sm text-muted-foreground">
              The full ledger behind the cardboard diplomacy.
            </p>
          </div>

          <TcdbTradeListClient rows={trades} />
        </section>
      </Card>
    </FullBleedPage>
  );
}
