import React from "react";
import { createRoot } from "react-dom/client";
import "../../app/globals.css";
import { tcdbTradePageThemeVars } from "../../lib/tcdb-theme";

const examples = {
  athlete: {
    title: "Giannis Antetokounmpo",
    context: "cardattack · Homie",
    sections: ["Collection history", "Clans and squads", "Chronicles"],
    stats: [
      ["Cards", "1,234"],
      ["TCDb rank", "12"],
      ["Measured", "November 28, 2026"],
    ],
    body: "Collection history and dated changes stay together. Membership in Milwaukee Bucks is separate from the people who inspired this collection.",
  },
  clan: {
    title: "Wisconsin teams across basketball and football",
    context: "cardattack · Clan",
    sections: ["Collections by sport", "Members", "Chronicles"],
    stats: [
      ["Basketball cards", "230"],
      ["Football cards", "Not available"],
      ["Measured", "November 28, 2026"],
    ],
    body: "Each sport keeps its own count and ranking. These overlapping collections are not added into a distinct-card total.",
  },
  fam: {
    title: "Jeff Meff",
    context: "unclejimmy · Fam",
    sections: ["His story", "Volleyball", "Inspired collections", "Chronicles"],
    stats: [],
    body: "The original personal story, images and Reddit embeds remain here in their authored order. Volleyball tournaments and inspired collections follow as useful connections, without replacing the story.",
  },
  music: {
    title: "An artist with a very long stage name",
    context: "theabbott · Homie",
    sections: ["Clans", "Appearances", "Chronicles"],
    stats: [],
    body: "Music relationships and source Chronicles have room to breathe. Missing biography or portrait data does not become a fabricated profile. Album art and video keep their source links.",
  },
  set: {
    title: "1991–92 Fleer Rookie Sensations",
    context: "cardattack · Set Collector",
    sections: ["Completion", "Snapshot history", "Chronicles"],
    stats: [
      ["Owned", "0"],
      ["Total", "20"],
      ["Completion", "0%"],
    ],
    body: "Zero owned is a real measurement. Completion and snapshot dates stay visible; an unavailable snapshot would say Not available.",
  },
};
const key = new URLSearchParams(location.search).get("view") ?? "directory";
const example = examples[key as keyof typeof examples];
const panel =
  "rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-4 md:p-6";
function Preview() {
  return (
    <main
      style={tcdbTradePageThemeVars}
      className="mx-auto max-w-[72rem] space-y-6 p-4 md:p-8"
    >
      <p className="text-sm">
        WU-1288 design fixture · illustrative values · no live data
      </p>
      <nav aria-label="Design examples" className="flex flex-wrap gap-3">
        {["directory", ...Object.keys(examples)].map((view) => (
          <a key={view} className="link-blue" href={`?view=${view}`}>
            {view}
          </a>
        ))}
      </nav>
      {example ? (
        <>
          <a className="link-blue" href="?view=directory">
            ← Back to directory
          </a>
          <header className={panel}>
            <p className="text-sm uppercase tracking-wide">{example.context}</p>
            <h1 className="break-words text-3xl font-semibold md:text-4xl">
              {example.title}
            </h1>
            <p className="max-w-[72ch] text-base leading-7">
              Stories, relationships and the collection behind the name.
            </p>
          </header>
          {example.stats.length > 0 && (
            <dl className="grid gap-3 sm:grid-cols-3">
              {example.stats.map(([label, value]) => (
                <div className={panel} key={label}>
                  <dt className="text-sm">{label}</dt>
                  <dd className="mt-2 text-xl font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          )}
          <nav aria-label="On this page" className="flex flex-wrap gap-4">
            {example.sections.map((s, i) => (
              <a key={s} className="link-blue" href={`#section-${i}`}>
                {s}
              </a>
            ))}
          </nav>
          {example.sections.map((s, i) => (
            <section id={`section-${i}`} key={s} className={panel}>
              <h2 className="text-xl font-semibold">{s}</h2>
              <p className="max-w-[72ch] text-base leading-7">
                {i === 0
                  ? example.body
                  : i === 1
                    ? "Related people and groups appear as named links when recorded. Membership and collection inspiration remain distinct."
                    : "Source stories retain their titles, dates, media and canonical links. No entries yet is distinct from a failed source."}
              </p>
            </section>
          ))}
        </>
      ) : (
        <>
          <header>
            <p className="text-sm uppercase tracking-wide">cardattack</p>
            <h1 className="text-3xl font-semibold md:text-4xl">Homies</h1>
            <p className="max-w-[72ch] text-base leading-7">
              The people behind the collection, with current rankings and
              stories.
            </p>
          </header>
          <form
            className={`${panel} flex flex-wrap items-end gap-4`}
            onSubmit={(e) => e.preventDefault()}
          >
            <label className="grid w-full gap-2 sm:w-auto sm:flex-1">
              Search homies
              <input
                className="form-input min-h-11 w-full"
                placeholder="Name or alias"
              />
            </label>
            <label className="grid gap-2">
              Trend
              <select className="form-input min-h-11">
                <option>All trends</option>
                <option>Up</option>
                <option>Down</option>
              </select>
            </label>
            <label className="grid gap-2">
              Sort
              <select className="form-input min-h-11">
                <option>Jersey</option>
                <option>Name</option>
              </select>
            </label>
          </form>
          <p role="status">3 homies · illustrative directory</p>
          <ul className="space-y-3">
            {[
              ["34", "Giannis Antetokounmpo", "1,234", "12"],
              [
                "219",
                "László Kleinheisler with a long display name",
                "0",
                "Not available",
              ],
              ["221", "Cal Eldrid", "Not available", "Not available"],
            ].map(([id, name, cards, rank]) => (
              <li
                className={`${panel} grid gap-4 md:grid-cols-[4rem_minmax(0,1fr)_8rem_8rem]`}
                key={id}
              >
                <span className="text-sm">Jersey {id}</span>
                <a
                  href="?view=athlete"
                  className="link-blue break-words font-semibold"
                >
                  {name}
                </a>
                <span>
                  <small className="block">Cards</small>
                  {cards}
                </span>
                <span>
                  <small className="block">Rank</small>
                  {rank}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-sm">
            Snapshot dates appear alongside available measurements. Actions are
            shown only to authorized viewers.
          </p>
        </>
      )}
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Preview />);
