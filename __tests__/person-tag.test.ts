import {
  inferPersonTagsFromTree,
  inferYouTubeVideoArtistTagsFromTree,
  mergeChronicleTags,
} from "@/lib/alterEgo";

type TestNode = {
  type?: string;
  name?: string;
  attributes?: { type?: string; name?: string; value?: unknown }[];
  children?: TestNode[];
};

const personTagNode = (tag?: string, children: TestNode[] = []): TestNode => ({
  type: "mdxJsxFlowElement",
  name: "PersonTag",
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

const root = (children: TestNode[] = []): TestNode => ({
  type: "root",
  children,
});

describe("inferPersonTagsFromTree", () => {
  const errorPrefix = "Chronicle sample.mdx";

  it("extracts a tag from PersonTag", () => {
    const tree = root([personTagNode("ron")]);
    expect(inferPersonTagsFromTree(tree, { errorPrefix })).toEqual(["ron"]);
  });

  it("deduplicates repeated PersonTag tags", () => {
    const tree = root([personTagNode("ron"), personTagNode("ron")]);
    expect(inferPersonTagsFromTree(tree, { errorPrefix })).toEqual(["ron"]);
  });

  it("throws when tag attribute is missing", () => {
    const tree = root([personTagNode(undefined)]);
    expect(() => inferPersonTagsFromTree(tree, { errorPrefix })).toThrow(
      `${errorPrefix}: PersonTag is missing the required tag prop.`,
    );
  });

  it("throws when tag is not a string literal", () => {
    const tree = root([
      {
        type: "mdxJsxFlowElement",
        name: "PersonTag",
        attributes: [
          { type: "mdxJsxAttribute", name: "tag", value: { foo: "bar" } },
        ],
      },
    ]);
    expect(() => inferPersonTagsFromTree(tree, { errorPrefix })).toThrow(
      `${errorPrefix}: PersonTag tag must be a string literal.`,
    );
  });
});

describe("inferYouTubeVideoArtistTagsFromTree", () => {
  const errorPrefix = "Chronicle sample.mdx";

  it("extracts an artist tag from YouTubeVideo", () => {
    const tree = root([youTubeVideoNode("gang-starr")]);
    expect(inferYouTubeVideoArtistTagsFromTree(tree, { errorPrefix })).toEqual([
      "gang-starr",
    ]);
  });

  it("normalizes artist values into tag slugs", () => {
    const tree = root([
      youTubeVideoNode("Gang Starr"),
      youTubeVideoNode("DOOM"),
    ]);
    expect(inferYouTubeVideoArtistTagsFromTree(tree, { errorPrefix })).toEqual([
      "gang-starr",
      "doom",
    ]);
  });

  it("deduplicates repeated YouTubeVideo artist tags", () => {
    const tree = root([
      youTubeVideoNode("gang-starr"),
      youTubeVideoNode("gang-starr"),
    ]);
    expect(inferYouTubeVideoArtistTagsFromTree(tree, { errorPrefix })).toEqual([
      "gang-starr",
    ]);
  });

  it("ignores YouTubeVideo nodes without an artist prop", () => {
    const tree = root([youTubeVideoNode(undefined)]);
    expect(inferYouTubeVideoArtistTagsFromTree(tree, { errorPrefix })).toEqual(
      [],
    );
  });

  it("throws when artist is not a string literal", () => {
    const tree = root([youTubeVideoNode({ foo: "bar" })]);
    expect(() =>
      inferYouTubeVideoArtistTagsFromTree(tree, { errorPrefix }),
    ).toThrow(`${errorPrefix}: YouTubeVideo artist must be a string literal.`);
  });
});

describe("mergeChronicleTags", () => {
  it("merges inferred artist tags alongside frontmatter and person tags", () => {
    const errorPrefix = "Chronicle sample.mdx";
    const tree = root([
      personTagNode("ron"),
      youTubeVideoNode("Gang Starr"),
      youTubeVideoNode("gang-starr"),
    ]);

    expect(
      mergeChronicleTags(
        ["alpha", "mark2"],
        ["mark2", "cardattack"],
        inferPersonTagsFromTree(tree, { errorPrefix }),
        inferYouTubeVideoArtistTagsFromTree(tree, { errorPrefix }),
      ),
    ).toEqual(["alpha", "mark2", "cardattack", "ron", "gang-starr"]);
  });
});
