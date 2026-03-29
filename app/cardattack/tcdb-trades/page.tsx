import { Card } from "@ui";
import FullBleedPage from "@/components/layout/FullBleedPage";
import PageIntro from "@/components/layout/PageIntro";
import { listTcdbTrades } from "@/lib/tcdb-trades";
import TcdbTradeListClient from "./_components/TcdbTradeListClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const trades = await listTcdbTrades();

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

        <TcdbTradeListClient rows={trades} />
      </Card>
    </FullBleedPage>
  );
}
