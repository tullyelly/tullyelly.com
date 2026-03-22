import "server-only";

import { sql } from "@/lib/db";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type VolleyballTournamentDayRow = {
  tournament_key: string;
  tournament_name: string;
  tournament_date: string;
  finish: number | null;
  wins: number;
  losses: number;
};

export type VolleyballTournamentDay = {
  tournamentKey: string;
  tournamentName: string;
  tournamentDate: string;
  finish: number | null;
  wins: number;
  losses: number;
};

type VolleyballTournamentSummaryRow = {
  tournament_key: string;
  tournament_name: string;
  finish: number | null;
  overall_wins: number | string;
  overall_losses: number | string;
};

export type VolleyballTournamentSummary = {
  tournamentKey: string;
  tournamentName: string;
  finish: number | null;
  overallWins: number;
  overallLosses: number;
  overallRecord: string;
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
      tournament.finish,
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
    finish: row.finish,
    wins: row.wins,
    losses: row.losses,
  };
}

function toInteger(value: number | string): number {
  if (typeof value === "number") {
    return value;
  }

  return Number.parseInt(value, 10);
}

export async function getVolleyballTournamentSummaryByKey(
  tournamentKey: string,
): Promise<VolleyballTournamentSummary | null> {
  const normalizedTournamentKey =
    normalizeVolleyballTournamentKey(tournamentKey);

  const [row] = await sql<VolleyballTournamentSummaryRow>`
    SELECT
      tournament.tournament_key,
      tournament.tournament_name,
      tournament.finish,
      COALESCE(SUM(day.wins), 0) AS overall_wins,
      COALESCE(SUM(day.losses), 0) AS overall_losses
    FROM dojo.volleyball_tournament AS tournament
    LEFT JOIN dojo.volleyball_tournament_day AS day
      ON day.volleyball_tournament_id = tournament.id
    WHERE tournament.tournament_key = ${normalizedTournamentKey}
    GROUP BY
      tournament.id,
      tournament.tournament_key,
      tournament.tournament_name,
      tournament.finish
    LIMIT 1
  `;

  if (!row) {
    return null;
  }

  const overallWins = toInteger(row.overall_wins);
  const overallLosses = toInteger(row.overall_losses);

  return {
    tournamentKey: row.tournament_key,
    tournamentName: row.tournament_name,
    finish: row.finish,
    overallWins,
    overallLosses,
    overallRecord: `${overallWins}-${overallLosses}`,
  };
}
