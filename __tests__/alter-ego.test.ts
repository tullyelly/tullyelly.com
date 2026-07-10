import {
  ALTER_EGO_OPTIONS,
  inferClanSnapshotTagUsagesFromTree,
  inferClanSnapshotTagsFromTree,
  inferAlterEgosFromTree,
  inferPersonTagUsagesFromTree,
  inferPersonTagsFromTree,
  inferYouTubeVideoArtistTagsFromTree,
  mergeChronicleTags,
  mergeTagsWithAlterEgo,
} from "@/lib/alterEgo";

type TestNode = {
  type?: string;
  name?: string;
  attributes?: { type?: string; name?: string; value?: unknown }[];
  children?: TestNode[];
};

const releaseNode = (
  alterEgo?: string,
  children: TestNode[] = [],
): TestNode => ({
  type: "mdxJsxFlowElement",
  name: "ReleaseSection",
  attributes:
    alterEgo === undefined
      ? []
      : [{ type: "mdxJsxAttribute", name: "alterEgo", value: alterEgo }],
  children,
});

const root = (children: TestNode[] = []): TestNode => ({
  type: "root",
  children,
});

const personTagNode = (
  tag?: unknown,
  displayName?: unknown,
  children: TestNode[] = [],
): TestNode => ({
  type: "mdxJsxTextElement",
  name: "PersonTag",
  attributes: [
    ...(tag === undefined
      ? []
      : [{ type: "mdxJsxAttribute", name: "tag", value: tag }]),
    ...(displayName === undefined
      ? []
      : [{ type: "mdxJsxAttribute", name: "displayName", value: displayName }]),
  ],
  children,
});

const clanSnapshotNode = (
  tag?: unknown,
  children: TestNode[] = [],
): TestNode => ({
  type: "mdxJsxFlowElement",
  name: "ClanSnapshot",
  attributes:
    tag === undefined
      ? []
      : [{ type: "mdxJsxAttribute", name: "tag", value: tag }],
  children,
});

const youTubeVideoNode = (
  artist?: unknown,
  children: TestNode[] = [],
): TestNode => ({
  type: "mdxJsxFlowElement",
  name: "YouTubeVideo",
  attributes:
    artist === undefined
      ? []
      : [{ type: "mdxJsxAttribute", name: "artist", value: artist }],
  children,
});

describe("inferAlterEgosFromTree", () => {
  const errorPrefix = "Chronicle sample.mdx";

  it("extracts a single alterEgo from ReleaseSection", () => {
    const tree = root([releaseNode("mark2")]);
    expect(inferAlterEgosFromTree(tree, { errorPrefix })).toEqual(["mark2"]);
  });

  it("allows multiple sections with the same alterEgo", () => {
    const tree = root([releaseNode("mark2"), releaseNode("mark2")]);
    expect(inferAlterEgosFromTree(tree, { errorPrefix })).toEqual(["mark2"]);
  });

  it("collects multiple alterEgos across sections", () => {
    const tree = root([releaseNode("mark2"), releaseNode("theabbott")]);
    expect(inferAlterEgosFromTree(tree, { errorPrefix })).toEqual([
      "mark2",
      "theabbott",
    ]);
  });

  it("throws when alterEgo attribute is missing", () => {
    const tree = root([releaseNode(undefined)]);
    expect(() => inferAlterEgosFromTree(tree, { errorPrefix })).toThrow(
      `${errorPrefix}: ReleaseSection is missing the required alterEgo prop.`,
    );
  });

  it("throws when alterEgo attribute is duplicated", () => {
    const tree = root([
      {
        type: "mdxJsxFlowElement",
        name: "ReleaseSection",
        attributes: [
          { type: "mdxJsxAttribute", name: "alterEgo", value: "mark2" },
          { type: "mdxJsxAttribute", name: "alterEgo", value: "cardattack" },
        ],
      },
    ]);

    expect(() => inferAlterEgosFromTree(tree, { errorPrefix })).toThrow(
      `${errorPrefix}: ReleaseSection should declare exactly one alterEgo prop.`,
    );
  });

  it("throws when alterEgo is not a string literal", () => {
    const tree = root([
      {
        type: "mdxJsxFlowElement",
        name: "ReleaseSection",
        attributes: [
          { type: "mdxJsxAttribute", name: "alterEgo", value: { foo: "bar" } },
        ],
      },
    ]);
    expect(() => inferAlterEgosFromTree(tree, { errorPrefix })).toThrow(
      `${errorPrefix}: ReleaseSection alterEgo must be a string literal.`,
    );
  });

  it("throws when alterEgo value is not in the allowed list", () => {
    const tree = root([releaseNode("unknown")]);
    expect(() => inferAlterEgosFromTree(tree, { errorPrefix })).toThrow(
      `${errorPrefix}: alterEgo must be one of ${ALTER_EGO_OPTIONS.join(", ")}.`,
    );
  });

  it("returns undefined when no ReleaseSection is present", () => {
    const tree = root([{ type: "paragraph", children: [] }]);
    expect(inferAlterEgosFromTree(tree, { errorPrefix })).toEqual([]);
  });
});

describe("inferPersonTagUsagesFromTree", () => {
  const errorPrefix = "Chronicle sample.mdx";

  it("extracts PersonTag display names and tag fallbacks", () => {
    const tree = root([
      personTagNode("freak", "the greek freak"),
      personTagNode("freak"),
      personTagNode("bucks-n-six", "bucks"),
    ]);

    expect(inferPersonTagUsagesFromTree(tree, { errorPrefix })).toEqual([
      { tag: "freak", displayName: "the greek freak" },
      { tag: "freak", displayName: "freak" },
      { tag: "bucks-n-six", displayName: "bucks" },
    ]);
  });

  it("deduplicates inferred PersonTag tag slugs", () => {
    const tree = root([
      personTagNode("freak", "giannis"),
      personTagNode("freak", "antetokounmpo"),
      personTagNode("bucks-n-six", "bucks"),
    ]);

    expect(inferPersonTagsFromTree(tree, { errorPrefix })).toEqual([
      "freak",
      "bucks-n-six",
    ]);
  });

  it("throws when displayName is not a string literal", () => {
    const tree = root([personTagNode("freak", { expression: "name" })]);

    expect(() => inferPersonTagUsagesFromTree(tree, { errorPrefix })).toThrow(
      `${errorPrefix}: PersonTag displayName must be a string literal.`,
    );
  });

  it("throws when PersonTag tag or displayName props are duplicated", () => {
    expect(() =>
      inferPersonTagUsagesFromTree(
        root([
          {
            type: "mdxJsxTextElement",
            name: "PersonTag",
            attributes: [
              { type: "mdxJsxAttribute", name: "tag", value: "freak" },
              { type: "mdxJsxAttribute", name: "tag", value: "giannis" },
            ],
          },
        ]),
        { errorPrefix },
      ),
    ).toThrow(`${errorPrefix}: PersonTag should declare exactly one tag prop.`);

    expect(() =>
      inferPersonTagUsagesFromTree(
        root([
          {
            type: "mdxJsxTextElement",
            name: "PersonTag",
            attributes: [
              { type: "mdxJsxAttribute", name: "tag", value: "freak" },
              {
                type: "mdxJsxAttribute",
                name: "displayName",
                value: "giannis",
              },
              {
                type: "mdxJsxAttribute",
                name: "displayName",
                value: "the greek freak",
              },
            ],
          },
        ]),
        { errorPrefix },
      ),
    ).toThrow(
      `${errorPrefix}: PersonTag should declare at most one displayName prop.`,
    );
  });
});

describe("inferClanSnapshotTagUsagesFromTree", () => {
  const errorPrefix = "Chronicle sample.mdx";

  it("extracts ClanSnapshot tag usages for Chronicle tag sections", () => {
    const tree = root([
      clanSnapshotNode("noles"),
      clanSnapshotNode("t-wolves"),
      clanSnapshotNode("noles"),
    ]);

    expect(inferClanSnapshotTagUsagesFromTree(tree, { errorPrefix })).toEqual([
      { tag: "noles", displayName: "noles" },
      { tag: "t-wolves", displayName: "t-wolves" },
      { tag: "noles", displayName: "noles" },
    ]);
    expect(inferClanSnapshotTagsFromTree(tree, { errorPrefix })).toEqual([
      "noles",
      "t-wolves",
    ]);
  });

  it("throws when ClanSnapshot tag is missing or not literal", () => {
    expect(() =>
      inferClanSnapshotTagUsagesFromTree(root([clanSnapshotNode()]), {
        errorPrefix,
      }),
    ).toThrow(`${errorPrefix}: ClanSnapshot is missing the required tag prop.`);

    expect(() =>
      inferClanSnapshotTagUsagesFromTree(root([clanSnapshotNode({})]), {
        errorPrefix,
      }),
    ).toThrow(`${errorPrefix}: ClanSnapshot tag must be a string literal.`);
  });

  it("throws when ClanSnapshot tag is duplicated", () => {
    expect(() =>
      inferClanSnapshotTagUsagesFromTree(
        root([
          {
            type: "mdxJsxFlowElement",
            name: "ClanSnapshot",
            attributes: [
              { type: "mdxJsxAttribute", name: "tag", value: "noles" },
              { type: "mdxJsxAttribute", name: "tag", value: "t-wolves" },
            ],
          },
        ]),
        { errorPrefix },
      ),
    ).toThrow(
      `${errorPrefix}: ClanSnapshot should declare exactly one tag prop.`,
    );
  });
});

describe("inferYouTubeVideoArtistTagsFromTree", () => {
  const errorPrefix = "Chronicle sample.mdx";

  it("normalizes and deduplicates YouTubeVideo artist tags", () => {
    const tree = root([
      youTubeVideoNode("DJ Shadow"),
      youTubeVideoNode("dj shadow"),
      youTubeVideoNode("Gang Starr"),
    ]);

    expect(inferYouTubeVideoArtistTagsFromTree(tree, { errorPrefix })).toEqual([
      "dj-shadow",
      "gang-starr",
    ]);
  });

  it("throws when YouTubeVideo artist is duplicated", () => {
    expect(() =>
      inferYouTubeVideoArtistTagsFromTree(
        root([
          {
            type: "mdxJsxFlowElement",
            name: "YouTubeVideo",
            attributes: [
              { type: "mdxJsxAttribute", name: "artist", value: "DOOM" },
              {
                type: "mdxJsxAttribute",
                name: "artist",
                value: "Gang Starr",
              },
            ],
          },
        ]),
        { errorPrefix },
      ),
    ).toThrow(
      `${errorPrefix}: YouTubeVideo should declare exactly one artist prop.`,
    );
  });
});

describe("Chronicle inference pipeline examples", () => {
  const errorPrefix = "Chronicle sample.mdx";

  it("merges frontmatter and inferred tags without changing authoring syntax", () => {
    const tree = root([
      releaseNode("unclejimmy", [
        personTagNode("jeff-meff", "noah"),
        clanSnapshotNode("t-wolves"),
        youTubeVideoNode("DJ Shadow"),
      ]),
      releaseNode("cardattack", [personTagNode("tcdb")]),
    ]);

    const alterEgoTags = inferAlterEgosFromTree(tree, { errorPrefix });
    const personTagUsages = inferPersonTagUsagesFromTree(tree, { errorPrefix });
    const clanTagUsages = inferClanSnapshotTagUsagesFromTree(tree, {
      errorPrefix,
    });
    const youtubeArtistTags = inferYouTubeVideoArtistTagsFromTree(tree, {
      errorPrefix,
    });

    expect(alterEgoTags).toEqual(["unclejimmy", "cardattack"]);
    expect(personTagUsages).toEqual([
      { tag: "jeff-meff", displayName: "noah" },
      { tag: "tcdb", displayName: "tcdb" },
    ]);
    expect(clanTagUsages).toEqual([
      { tag: "t-wolves", displayName: "t-wolves" },
    ]);
    expect(youtubeArtistTags).toEqual(["dj-shadow"]);
    expect(
      mergeChronicleTags(
        ["frontmatter", "jeff-meff"],
        alterEgoTags,
        personTagUsages.map((usage) => usage.tag),
        clanTagUsages.map((usage) => usage.tag),
        youtubeArtistTags,
      ),
    ).toEqual([
      "frontmatter",
      "jeff-meff",
      "unclejimmy",
      "cardattack",
      "tcdb",
      "t-wolves",
      "dj-shadow",
    ]);
  });
});

describe("mergeTagsWithAlterEgo", () => {
  it("appends the inferred alterEgo to tags", () => {
    expect(mergeTagsWithAlterEgo(["alpha", "beta"], "mark2")).toEqual([
      "alpha",
      "beta",
      "mark2",
    ]);
  });

  it("deduplicates when alterEgo already exists", () => {
    expect(mergeTagsWithAlterEgo(["mark2", "alpha"], "mark2")).toEqual([
      "mark2",
      "alpha",
    ]);
  });

  it("returns existing tags when alterEgo is missing", () => {
    expect(mergeTagsWithAlterEgo(["alpha"], undefined)).toEqual(["alpha"]);
  });

  it("returns alterEgo as the only tag when none exist", () => {
    expect(mergeTagsWithAlterEgo(undefined, "mark2")).toEqual(["mark2"]);
  });

  it("merges multiple alterEgos into tags", () => {
    expect(
      mergeTagsWithAlterEgo(["alpha", "beta"], ["mark2", "cardattack"]),
    ).toEqual(["alpha", "beta", "mark2", "cardattack"]);
  });
});
