"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import PageIntro from "@/components/layout/PageIntro";
import TCDBRankingTable, {
  homieRankingsToTableData,
} from "@/components/tcdb/TCDBRankingTable";
import type { RankingResponse } from "@/lib/data/tcdb";
import { tcdbTradeTableThemeStyle } from "@/lib/tcdb-theme";
import type { HomieOption } from "../_lib/getHomieOptions";
import AddSnapshotButton from "./AddSnapshotButton";

type TcdbRankingsViewProps = {
  canCreate: boolean;
  homieOptions: HomieOption[];
  data: RankingResponse;
  defaultRankingDate: string;
};

export default function TcdbRankingsView({
  canCreate,
  homieOptions,
  data,
  defaultRankingDate,
}: TcdbRankingsViewProps) {
  const [showRefreshing, setShowRefreshing] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const handleSnapshotCreated = useCallback(() => {
    setShowRefreshing(true);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setShowRefreshing(false);
      timeoutRef.current = null;
    }, 1500);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-8">
      <PageIntro
        title="Homies"
        accessory={
          showRefreshing ? (
            <span className="inline-flex items-center rounded-full bg-[var(--cream)] px-3 py-1 text-xs font-semibold uppercase text-ink/80">
              Refreshing...
            </span>
          ) : null
        }
        actions={
          canCreate ? (
            <AddSnapshotButton
              homieOptions={homieOptions}
              defaultRankingDate={defaultRankingDate}
              onSnapshotCreated={handleSnapshotCreated}
            />
          ) : null
        }
      >
        <p className="text-[16px] text-muted-foreground md:text-[18px]">
          I love me some{" "}
          <a
            href="https://www.tcdb.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            TCDb
          </a>
          , and these homie snapshots keep an eye on whether my player
          collections are trending up or down against other collectors.
        </p>
        <p className="text-[16px] text-muted-foreground md:text-[18px]">
          This is in the early MVP (minimum viable product) stages, so please
          let me know what you think.
        </p>
      </PageIntro>

      <TCDBRankingTable
        serverData={homieRankingsToTableData(data)}
        labels={{
          searchPlaceholder: "Search homies",
          searchAriaLabel: "Search homies",
          identifierColumn: "Jersey",
          emptyMessage: "No homie rankings match your filters.",
          tableAriaLabel: "TCDB homie rankings table",
        }}
        theme={{
          tableThemeStyle: tcdbTradeTableThemeStyle,
        }}
      />
    </div>
  );
}
