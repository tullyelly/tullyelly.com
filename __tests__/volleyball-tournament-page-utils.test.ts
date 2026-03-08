jest.mock("server-only", () => ({}));
jest.mock("contentlayer/generated", () => ({
  __esModule: true,
  allPosts: [],
}));

import {
  extractTournamentSectionsFromRaw,
  getAllVolleyballTournamentSummaries,
  getVolleyballTournamentPageData,
  getVolleyballTournamentSections,
  summarizeTournamentSections,
} from "@/lib/volleyball-tournaments";

describe("extractTournamentSectionsFromRaw", () => {
  it("extracts a single ReleaseSection block from numeric tournamentId", () => {
    const tournamentId = "1";
    const block = `<ReleaseSection alterEgo="unclejimmy" tournamentId={1}>\n  Day one\n</ReleaseSection>`;
    const raw = `Intro\n${block}\nOutro`;

    const sections = extractTournamentSectionsFromRaw(raw, tournamentId);

    expect(sections).toEqual([{ mdx: block }]);
  });

  it("supports quoted tournamentId values", () => {
    const tournamentId = "1";
    const block = `<ReleaseSection alterEgo="unclejimmy" tournamentId="1">\n  Day two\n</ReleaseSection>`;

    const sections = extractTournamentSectionsFromRaw(block, tournamentId);

    expect(sections).toEqual([{ mdx: block }]);
  });

  it("filters blocks by tournamentId", () => {
    const tournamentId = "2";
    const blockA = `<ReleaseSection alterEgo="unclejimmy" tournamentId={1}>\n  One\n</ReleaseSection>`;
    const blockB = `<ReleaseSection alterEgo="unclejimmy" tournamentId={2}>\n  Two\n</ReleaseSection>`;
    const raw = `${blockA}\n\n${blockB}`;

    const sections = extractTournamentSectionsFromRaw(raw, tournamentId);

    expect(sections).toHaveLength(1);
    expect(sections[0]?.mdx).toBe(blockB);
  });
});

describe("getVolleyballTournamentSections", () => {
  it("orders sections by post date ascending", () => {
    const tournamentId = "1";
    const posts = [
      {
        slug: "later-day",
        title: "Later Day",
        url: "/shaolin/later-day",
        date: "2026-02-15",
        body: {
          raw: `<ReleaseSection alterEgo="unclejimmy" tournamentId={1}>Later</ReleaseSection>`,
        },
      },
      {
        slug: "earlier-day",
        title: "Earlier Day",
        url: "/shaolin/earlier-day",
        date: "2026-02-14",
        body: {
          raw: `<ReleaseSection alterEgo="unclejimmy" tournamentId={1}>Earlier</ReleaseSection>`,
        },
      },
    ];

    const sections = getVolleyballTournamentSections(tournamentId, posts);

    expect(sections).toHaveLength(2);
    expect(sections[0]?.postSlug).toBe("earlier-day");
    expect(sections[1]?.postSlug).toBe("later-day");
    expect(sections[0]?.tournamentName).toBeUndefined();
    expect(sections[1]?.tournamentRecord).toBeUndefined();
  });

  it("preserves in-post order for multiple sections", () => {
    const tournamentId = "1";
    const post = {
      slug: "double-header",
      title: "Double Header",
      url: "/shaolin/double-header",
      date: "2026-02-14",
      body: {
        raw: [
          `<ReleaseSection alterEgo="unclejimmy" tournamentId={1}>`,
          "  First section",
          "</ReleaseSection>",
          "",
          `<ReleaseSection alterEgo="unclejimmy" tournamentId={1}>`,
          "  Second section",
          "</ReleaseSection>",
        ].join("\n"),
      },
    };

    const sections = getVolleyballTournamentSections(tournamentId, [post]);

    expect(sections).toHaveLength(2);
    expect(sections[0]?.mdx).toContain("First section");
    expect(sections[1]?.mdx).toContain("Second section");
  });

  it("extracts tournament name and record and summarizes totals", () => {
    const tournamentId = "1";
    const posts = [
      {
        slug: "day-one",
        title: "Day One",
        url: "/shaolin/day-one",
        date: "2026-02-14",
        body: {
          raw: `<ReleaseSection alterEgo="unclejimmy" tournamentId={1} tournamentName="Midwest Boys Point Series" tournamentRecord="2–1">Day 1</ReleaseSection>`,
        },
      },
      {
        slug: "day-two",
        title: "Day Two",
        url: "/shaolin/day-two",
        date: "2026-02-15",
        body: {
          raw: `<ReleaseSection alterEgo="unclejimmy" tournamentId={1} tournamentName="Midwest Boys Point Series" tournamentRecord="0-2">Day 2</ReleaseSection>`,
        },
      },
    ];

    const sections = getVolleyballTournamentSections(tournamentId, posts);
    const summary = summarizeTournamentSections(sections);

    expect(sections).toHaveLength(2);
    expect(sections[0]?.tournamentName).toBe("Midwest Boys Point Series");
    expect(sections[0]?.tournamentRecord).toBe("2–1");
    expect(sections[1]?.tournamentRecord).toBe("0-2");
    expect(summary.tournamentName).toBe("Midwest Boys Point Series");
    expect(summary.overallWins).toBe(2);
    expect(summary.overallLosses).toBe(3);
    expect(summary.overallRecord).toBe("2-3");
  });
});

describe("getAllVolleyballTournamentSummaries", () => {
  it("aggregates sections by tournament and sorts by latest post date", () => {
    const posts = [
      {
        slug: "day-one",
        title: "Day One",
        url: "/shaolin/day-one",
        date: "2026-02-14",
        body: {
          raw: `<ReleaseSection alterEgo="unclejimmy" tournamentId={1} tournamentName="Midwest Boys Point Series" tournamentRecord="2-1">Day 1</ReleaseSection>`,
        },
      },
      {
        slug: "day-two",
        title: "Day Two",
        url: "/shaolin/day-two",
        date: "2026-02-16",
        body: {
          raw: `<ReleaseSection alterEgo="unclejimmy" tournamentId={2} tournamentName="Club Tune Up" tournamentRecord="1-2">Day 1</ReleaseSection>`,
        },
      },
      {
        slug: "day-three",
        title: "Day Three",
        url: "/shaolin/day-three",
        date: "2026-02-15",
        body: {
          raw: `<ReleaseSection alterEgo="unclejimmy" tournamentId={1} tournamentName="Midwest Boys Point Series" tournamentRecord="0-2">Day 2</ReleaseSection>`,
        },
      },
    ];

    const summaries = getAllVolleyballTournamentSummaries(posts);

    expect(summaries).toHaveLength(2);
    expect(summaries[0]?.tournamentId).toBe("2");
    expect(summaries[0]?.tournamentName).toBe("Club Tune Up");
    expect(summaries[0]?.overallRecord).toBe("1-2");
    expect(summaries[0]?.tournamentDays).toBe(1);
    expect(summaries[1]?.tournamentId).toBe("1");
    expect(summaries[1]?.overallRecord).toBe("2-3");
    expect(summaries[1]?.tournamentDays).toBe(2);
    expect(summaries[1]?.latestPostDate).toBe("2026-02-15");
  });
});

describe("getVolleyballTournamentPageData", () => {
  it("returns normalized data for existing tournaments", () => {
    const posts = [
      {
        slug: "day-one",
        title: "Day One",
        url: "/shaolin/day-one",
        date: "2026-02-14",
        body: {
          raw: `<ReleaseSection alterEgo="unclejimmy" tournamentId={1} tournamentName="Midwest Boys Point Series" tournamentRecord="2-1">Day 1</ReleaseSection>`,
        },
      },
    ];

    const data = getVolleyballTournamentPageData("1", posts);

    expect(data).not.toBeNull();
    expect(data?.tournamentId).toBe("1");
    expect(data?.tournamentName).toBe("Midwest Boys Point Series");
    expect(data?.summary.overallRecord).toBe("2-1");
    expect(data?.sections).toHaveLength(1);
  });

  it("returns null for missing tournaments", () => {
    const data = getVolleyballTournamentPageData("404", []);
    expect(data).toBeNull();
  });
});
