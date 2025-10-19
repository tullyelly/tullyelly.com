"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import TCDBRankingTable from "@/components/tcdb/TCDBRankingTable";
import type { RankingResponse } from "@/lib/data/tcdb";
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
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
            TCDB Rankings
          </h1>
          {showRefreshing ? (
            <span className="inline-flex items-center rounded-full bg-[var(--cream)] px-3 py-1 text-xs font-semibold uppercase text-ink/80">
              Refreshing…
            </span>
          ) : null}
        </div>
        {canCreate ? (
          <AddSnapshotButton
            homieOptions={homieOptions}
            defaultRankingDate={defaultRankingDate}
            onSnapshotCreated={handleSnapshotCreated}
          />
        ) : null}
      </header>

      <section className="space-y-4">
        <p className="text-[16px] text-muted-foreground md:text-[18px]">
          I love me some{" "}
          <a
            href="https://www.tcdb.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            TCDb
          </a>
          , and as part of that I started to take snapshots of various portions
          of my PC so that I can keep an eye on if I am trending up or down on
          any given player when compared to the other wonderful collectors on
          TCDb. Eventually this will include more players and teams, and this is
          not a full list of players I PC; just an initial list of players that
          another project I am working on has come across.
        </p>
        <p className="text-[16px] text-muted-foreground md:text-[18px]">
          This is in the early MVP (minimum viable product) stages, so please
          let me know what you think.
        </p>
      </section>

      <TCDBRankingTable serverData={data} />
    </div>
  );
}
