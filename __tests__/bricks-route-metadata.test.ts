import {
  getBricksCollectionMetadata,
  getBricksDetailMetadata,
} from "@/lib/bricks-route-metadata";

describe("bricks route metadata", () => {
  it("uses the configured collection path for collection metadata", () => {
    const metadata = getBricksCollectionMetadata("lego");

    expect(metadata.title).toBe("Bricks: LEGO | 🎙unclejimmy");
    expect(metadata.alternates?.canonical).toBe(
      "https://tullyelly.com/unclejimmy/bricks",
    );
    expect(metadata.openGraph?.url).toBe("/unclejimmy/bricks");
  });

  it("builds detail metadata from DB-backed bricks data", () => {
    const metadata = getBricksDetailMetadata("lego", "10330", {
      subset: "lego",
      publicId: "10330",
      setName: "McLaren MP4/4 & Ayrton Senna",
      tag: "f1",
      pieceCount: 693,
      reviewScore: 9.3,
      firstBuildDate: "2026-04-01",
      latestBuildDate: "2026-04-03",
      sessionCount: 2,
      days: [],
    });

    expect(metadata.title).toBe(
      "McLaren MP4/4 & Ayrton Senna | Bricks: LEGO | 🎙unclejimmy",
    );
    expect(metadata.description).toBe(
      "Overall score: 9.3/10 from 2 tracked sessions. Latest chronicle: Apr 03, 2026. 693 pieces. Tag: f1.",
    );
    expect(metadata.alternates?.canonical).toBe(
      "https://tullyelly.com/unclejimmy/bricks/10330",
    );
    expect(metadata.openGraph?.url).toBe("/unclejimmy/bricks/10330");
  });

  it("uses a defensive fallback description when the set is missing", () => {
    const metadata = getBricksDetailMetadata("lego", "42171", null);

    expect(metadata.title).toBe("LEGO Set 42171 | Bricks: LEGO | 🎙unclejimmy");
    expect(metadata.description).toBe(
      "DB-backed LEGO build dossier for LEGO ID 42171. Chronicle sessions render from the original ReleaseSection MDX content.",
    );
  });
});
