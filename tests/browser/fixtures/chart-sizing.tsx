import * as React from "react";
import { createRoot } from "react-dom/client";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { TcdbCardTrafficChartClient } from "@/components/chronicles/TcdbCardTrafficChartClient";
import { PersonaActivityChartClient } from "@/components/analytics/PersonaActivityChartClient";
import HomieCardCountSparkline from "@/components/tcdb/HomieCardCountSparkline";
import ClanCardCountSparkline from "@/components/tcdb/ClanCardCountSparkline";
import HomieTagUsageChart from "@/app/cardattack/homies/_components/HomieTagUsageChart";
import SquadCommentaryChart from "@/app/unclejimmy/squad/_components/SquadCommentaryChart";
import { tcdbTradePageThemeVars } from "@/lib/tcdb-theme";
import "@/app/globals.css";

const traffic = Array.from({ length: 10 }, (_, i) => ({
  date: `2026-09-${String(i + 1).padStart(2, "0")}`,
  slot: i + 1,
  isChronicleDate: i === 5,
  sent: i * 10,
  received: i * 5,
  sentTradeCount: i,
  receivedTradeCount: i,
}));
const activity = traffic.map((row, i) => ({
  periodStart: row.date,
  periodEnd: row.date,
  shortLabel: `Week ${i + 1}`,
  fullLabel: `Activity week ${i + 1}`,
  values: { posts: i + 1 },
}));
const snapshots = traffic.map((row, i) => ({
  homie_id: 1,
  clan_id: 1,
  sport: "basketball",
  ranking_at: row.date,
  card_count: (i + 1) * 100,
  ranking: 10 - i,
  difference: i,
}));
const tags = traffic.slice(0, 8).map((_, i) => ({
  tag: `homie${i + 1}`,
  name: `Homie ${i + 1}`,
  count: i + 1,
  chronicleCount: i + 1,
  href: `/cardattack/homies/homie${i + 1}`,
}));

function Charts({ empty, compact }: { empty: boolean; compact: boolean }) {
  return (
    <>
      <div className="min-w-0 rounded-2xl border-2 border-[var(--cream)] bg-white p-4 md:p-6">
        <h2>TCDb Card Traffic</h2>
        <TcdbCardTrafficChartClient
          rows={
            empty
              ? traffic.map((row) => ({ ...row, sent: 0, received: 0 }))
              : new URLSearchParams(location.search).has("traffic")
                ? traffic.map((row, i) => ({
                    ...row,
                    date: i < 5 ? `2026-12-${27 + i}` : `2027-01-0${i - 4}`,
                    sent: i === 5 ? 123456 : 0,
                    received: i === 5 ? 98765 : 0,
                    sentTradeCount: i === 5 ? 2 : 0,
                    receivedTradeCount: i === 5 ? 3 : 0,
                  }))
                : traffic
          }
        />
      </div>
      <PersonaActivityChartClient
        rows={empty ? [] : activity}
        label="Persona activity"
        series={{
          key: "posts",
          label: "Posts",
          unit: "posts",
          color: "var(--bucks-green)",
        }}
      />
      <HomieCardCountSparkline snapshots={empty ? [] : snapshots} />
      <ClanCardCountSparkline snapshots={empty ? [] : snapshots} />
      <HomieTagUsageChart
        rows={empty ? [] : compact ? tags.slice(0, 3) : tags}
      />
      <SquadCommentaryChart
        rows={
          empty
            ? []
            : tags.map((tag) => ({
                tag_name: tag.name,
                comment_count: tag.count,
              }))
        }
      />
    </>
  );
}

function Harness() {
  const params = new URLSearchParams(location.search);
  const [visible, setVisible] = React.useState(!params.has("hidden"));
  const [generation, setGeneration] = React.useState(0);
  const [empty, setEmpty] = React.useState(false);
  const [compact, setCompact] = React.useState(false);
  if (params.has("legacy")) {
    // Real pre-fix container: the test must detect the -1/-1 warning.
    return (
      <div className="h-24 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={snapshots}>
            <Line dataKey="card_count" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
  return (
    <>
      <nav className="flex gap-4">
        <button onClick={() => setVisible((value) => !value)}>
          Toggle visibility
        </button>
        <button
          onClick={() => {
            history.pushState({}, "", `/charts/${generation + 1}`);
            setGeneration((value) => value + 1);
          }}
        >
          Navigate
        </button>
        <button onClick={() => setEmpty((value) => !value)}>
          Toggle empty
        </button>
        <button onClick={() => setCompact((value) => !value)}>
          Change tag count
        </button>
      </nav>
      <main
        className="mx-auto w-full max-w-3xl min-w-0"
        style={{
          ...tcdbTradePageThemeVars,
          display: visible ? undefined : "none",
        }}
      >
        <Charts key={generation} empty={empty} compact={compact} />
      </main>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<Harness />);
