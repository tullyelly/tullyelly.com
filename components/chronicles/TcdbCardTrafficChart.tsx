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
      className="min-w-0 w-full space-y-4 p-4 md:p-6"
      aria-labelledby="tcdb-card-traffic-title"
    >
      <div className="space-y-1">
        <h2 id="tcdb-card-traffic-title" className="text-xl font-semibold">
          TCDb Card Traffic
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Sent cards are counted on the sent date. Received cards are counted on
          the received or archived completion date.
        </p>
      </div>

      <TcdbCardTrafficChartClient rows={rows} />
    </Card>
  );
}
