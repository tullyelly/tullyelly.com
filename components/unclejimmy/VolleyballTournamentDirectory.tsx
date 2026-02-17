import type { Route } from "next";
import Link from "next/link";

import { getAllVolleyballTournamentSummaries } from "@/lib/volleyball-tournaments";

export default function VolleyballTournamentDirectory() {
  const tournaments = getAllVolleyballTournamentSummaries();

  return (
    <section className="space-y-4">
      <h2 className="text-xl md:text-2xl font-semibold leading-snug">
        volleyball tournaments
      </h2>
      <p className="text-[16px] md:text-[18px] text-muted-foreground">
        Every tracked tournament so far; jump into each run for day-by-day
        notes.
      </p>

      {tournaments.length > 0 ? (
        <ul className="space-y-3">
          {tournaments.map((tournament) => (
            <li
              key={tournament.tournamentId}
              className="rounded-xl border border-border/60 bg-white p-4 shadow-sm"
            >
              <div className="space-y-1">
                <h3 className="text-lg md:text-xl font-semibold leading-snug">
                  {tournament.tournamentName}
                </h3>
                <p className="text-[16px] md:text-[18px] text-muted-foreground">
                  Overall record: {tournament.overallRecord}{" "}
                  <Link
                    href={
                      `/unclejimmy/squad/volleyball/${tournament.tournamentId}` as Route
                    }
                    className="link-blue whitespace-nowrap"
                  >
                    view tournament
                  </Link>
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          No volleyball tournaments are published yet.
        </p>
      )}
    </section>
  );
}
