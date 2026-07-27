import { Card } from "@ui";
import { TcdbCardTrafficChartClient } from "@/components/chronicles/TcdbCardTrafficChartClient";
import { getTcdbCardTrafficChartRowsForChronicleFromDb } from "@/lib/tcdb-trade-db";

type Props = {
  chronicleDate: string;
};

export async function TcdbCardTrafficChart({ chronicleDate }: Props) {
  const rows =
    await getTcdbCardTrafficChartRowsForChronicleFromDb(chronicleDate);

  if (rows === null) {
    return null;
  }

  return (
    <Card
      as="section"
      accent="cream-city-cream"
      className="space-y-4 p-4 md:p-6"
      aria-labelledby="tcdb-card-traffic-title"
    >
      <div className="space-y-1">
        <h2 id="tcdb-card-traffic-title" className="text-xl font-semibold">
          TCDb Card Traffic
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Sent cards use the sent date; received cards use the received or
          archived completion date recorded for each trade.
        </p>
      </div>

      <TcdbCardTrafficChartClient rows={rows} />
    </Card>
  );
}
