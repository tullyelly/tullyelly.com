import dynamic from "next/dynamic";
import type { CSSProperties } from "react";
import type { RankingResponse } from "@/lib/data/tcdb";
import type { ClanRankingResponse } from "@/lib/data/tcdb-clans";
import { formatClanSportLabel } from "@/lib/tcdb-clan-format";

export type TCDBRankingTableTheme = {
  tableThemeStyle?: CSSProperties;
};

export type TCDBRankingTableRow = {
  key: string;
  name: string;
  href: string;
  identifierLabel: string;
  identifierValue: string;
  card_count: number;
  ranking: number;
  ranking_at: string;
  difference: number;
  rank_delta: number | null;
  diff_delta: number | null;
  trend_rank: "up" | "down" | "flat";
  trend_overall: "up" | "down" | "flat";
  diff_sign_changed: boolean;
};

export type TCDBRankingTableData = {
  data: TCDBRankingTableRow[];
  meta: RankingResponse["meta"];
};

export type TCDBRankingTableLabels = {
  searchPlaceholder: string;
  searchAriaLabel: string;
  identifierColumn: string;
  emptyMessage: string;
  tableAriaLabel: string;
};

type TCDBRankingTableProps = {
  serverData: TCDBRankingTableData;
  theme?: TCDBRankingTableTheme;
  labels: TCDBRankingTableLabels;
};

const TCDBRankingTableClient = dynamic(
  () => import("./TCDBRankingTableClient"),
  { ssr: false },
);

export function homieRankingsToTableData(
  serverData: RankingResponse,
): TCDBRankingTableData {
  return {
    data: serverData.data.map((row) => ({
      key: `homie-${row.homie_id}`,
      name: row.name,
      href: `/cardattack/tcdb-rankings/${row.homie_id}`,
      identifierLabel: "Jersey",
      identifierValue: String(row.homie_id),
      card_count: row.card_count,
      ranking: row.ranking,
      ranking_at: row.ranking_at,
      difference: row.difference,
      rank_delta: row.rank_delta,
      diff_delta: row.diff_delta,
      trend_rank: row.trend_rank,
      trend_overall: row.trend_overall,
      diff_sign_changed: row.diff_sign_changed,
    })),
    meta: serverData.meta,
  };
}

export function clanRankingsToTableData(
  serverData: ClanRankingResponse,
): TCDBRankingTableData {
  return {
    data: serverData.data.map((row) => ({
      key: `clan-${row.slug}-${row.sport}`,
      name: row.name,
      href: `/cardattack/tcdb-rankings/clans/${row.slug}`,
      identifierLabel: "Sport",
      identifierValue: formatClanSportLabel(row.sport),
      card_count: row.card_count,
      ranking: row.ranking,
      ranking_at: row.ranking_at,
      difference: row.difference,
      rank_delta: row.rank_delta,
      diff_delta: row.diff_delta,
      trend_rank: row.trend_rank,
      trend_overall: row.trend_overall,
      diff_sign_changed: row.diff_sign_changed,
    })),
    meta: serverData.meta,
  };
}

export default function TCDBRankingTable({
  serverData,
  theme,
  labels,
}: TCDBRankingTableProps) {
  return (
    <TCDBRankingTableClient
      serverData={serverData}
      theme={theme}
      labels={labels}
    />
  );
}
