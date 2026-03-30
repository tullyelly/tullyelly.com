import dynamic from "next/dynamic";
import type { CSSProperties } from "react";
import type { RankingResponse } from "@/lib/data/tcdb";

export type TCDBRankingTableTheme = {
  tableThemeStyle?: CSSProperties;
  detailDialogStyle?: CSSProperties;
};

type TCDBRankingTableProps = {
  serverData: RankingResponse;
  theme?: TCDBRankingTableTheme;
};

const TCDBRankingTableClient = dynamic(
  () => import("./TCDBRankingTableClient"),
  { ssr: false },
);

export default function TCDBRankingTable({
  serverData,
  theme,
}: TCDBRankingTableProps) {
  return <TCDBRankingTableClient serverData={serverData} theme={theme} />;
}
