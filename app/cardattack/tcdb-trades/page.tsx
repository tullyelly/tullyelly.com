import { Card } from "@ui";
import FullBleedPage from "@/components/layout/FullBleedPage";
import { listTcdbTrades } from "@/lib/tcdb-trades";
import TcdbTradeListClient from "./_components/TcdbTradeListClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  const trades = listTcdbTrades();

  return (
    <FullBleedPage>
      <Card
        as="section"
        className="space-y-8 border-0 shadow-none px-1 py-6 md:p-8"
      >
        <header>
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
            TCDb Trades
          </h1>
        </header>

        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Thank you to all of my trade partners. A wonderful community.
        </p>

        <TcdbTradeListClient rows={trades} />
      </Card>
    </FullBleedPage>
  );
}
