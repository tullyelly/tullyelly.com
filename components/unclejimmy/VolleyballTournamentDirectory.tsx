import { getVolleyballTournamentListSummaries } from "@/lib/volleyball-tournament-db";
import VolleyballTournamentList from "@/components/unclejimmy/VolleyballTournamentList";

export default async function VolleyballTournamentDirectory() {
  const tournaments = await getVolleyballTournamentListSummaries();

  return (
    <section className="space-y-4">
      <h2 className="text-xl md:text-2xl font-semibold leading-snug">
        volleyball tournaments
      </h2>
      <p className="text-[16px] md:text-[18px] text-muted-foreground">
        Every tracked tournament so far; jump into each run for day-by-day
        notes.
      </p>

      <VolleyballTournamentList rows={tournaments} />
    </section>
  );
}
