import { collectCrateAppearances } from "@/lib/music/crates";

describe("The Crates aggregation", () => {
  test("includes theabbott usages while preserving unclassified artists", () => {
    const posts = [
      {
        title: "Abbott",
        url: "/shaolin/abbott",
        date: "2026-01-02",
        draft: false,
        resolvedAlterEgo: "theabbott",
        musicUsages: [
          {
            type: "video",
            id: "one",
            artist: "Mystery Group",
            artistTag: "mystery-group",
          },
        ],
      },
      {
        title: "Mixed",
        url: "/shaolin/mixed",
        date: "2026-01-03",
        draft: false,
        resolvedAlterEgo: "cardattack",
        musicUsages: [
          { type: "playlist", id: "PL1", alterEgo: "theabbott" },
          { type: "video", id: "skip", alterEgo: "cardattack" },
        ],
      },
    ];

    expect(collectCrateAppearances(posts as never)).toMatchObject([
      { type: "playlist", id: "PL1", chronicleUrl: "/shaolin/mixed" },
      {
        type: "video",
        artistTag: "mystery-group",
        chronicleUrl: "/shaolin/abbott",
      },
    ]);
  });
});
