import dynamic from "next/dynamic";
import type { RankingResponse } from "@/lib/data/tcdb";

type TCDBRankingTableProps = {
  serverData: RankingResponse;
};

const TCDBRankingTableClient = dynamic(
  () => import("./TCDBRankingTableClient"),
  { ssr: false },
);

export default function TCDBRankingTable({
  serverData,
}: TCDBRankingTableProps) {
  return <TCDBRankingTableClient serverData={serverData} />;
}
