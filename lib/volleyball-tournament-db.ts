import "server-only";

import { sql } from "@/lib/db";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type VolleyballTournamentDayRow = {
  tournament_key: string;
  tournament_name: string;
  tournament_date: string;
  wins: number;
  losses: number;
};

export type VolleyballTournamentDay = {
  tournamentKey: string;
  tournamentName: string;
  tournamentDate: string;
  wins: number;
  losses: number;
};

export function normalizeVolleyballTournamentKey(tournamentKey: string): string {
  const normalized = tournamentKey.trim();

  if (!normalized) {
    throw new Error(
      "Volleyball tournament lookup: tournamentKey must be a non-empty string.",
    );
  }

  return normalized;
}

export function normalizeVolleyballTournamentDate(
  tournamentDate: string,
): string {
  const normalized = tournamentDate.trim();

  if (!ISO_DATE_PATTERN.test(normalized)) {
    throw new Error(
      "Volleyball tournament lookup: tournamentDate must be a valid ISO date string in YYYY-MM-DD form.",
    );
  }

  const parsedDate = new Date(`${normalized}T00:00:00.000Z`);
  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== normalized
  ) {
    throw new Error(
      "Volleyball tournament lookup: tournamentDate must be a valid ISO date string in YYYY-MM-DD form.",
    );
  }

  return normalized;
}

export async function getVolleyballTournamentDayByKeyAndDate(
  tournamentKey: string,
  tournamentDate: string,
): Promise<VolleyballTournamentDay | null> {
  const normalizedTournamentKey =
    normalizeVolleyballTournamentKey(tournamentKey);
  const normalizedTournamentDate =
    normalizeVolleyballTournamentDate(tournamentDate);

  const [row] = await sql<VolleyballTournamentDayRow>`
    SELECT
      tournament.tournament_key,
      tournament.tournament_name,
      TO_CHAR(day.tournament_date, 'YYYY-MM-DD') AS tournament_date,
      day.wins,
      day.losses
    FROM dojo.volleyball_tournament AS tournament
    JOIN dojo.volleyball_tournament_day AS day
      ON day.volleyball_tournament_id = tournament.id
    WHERE tournament.tournament_key = ${normalizedTournamentKey}
      AND day.tournament_date = ${normalizedTournamentDate}::date
    LIMIT 1
  `;

  if (!row) {
    return null;
  }

  return {
    tournamentKey: row.tournament_key,
    tournamentName: row.tournament_name,
    tournamentDate: row.tournament_date,
    wins: row.wins,
    losses: row.losses,
  };
}
