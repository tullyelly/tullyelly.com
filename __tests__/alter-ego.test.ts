import {
  ALTER_EGO_OPTIONS,
  inferAlterEgoFromTree,
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

describe("inferAlterEgoFromTree", () => {
  const errorPrefix = "Chronicle sample.mdx";

  it("extracts a single alterEgo from ReleaseSection", () => {
    const tree = root([releaseNode("mark2")]);
    expect(inferAlterEgoFromTree(tree, { errorPrefix })).toBe("mark2");
  });

  it("allows multiple sections with the same alterEgo", () => {
    const tree = root([releaseNode("mark2"), releaseNode("mark2")]);
    expect(inferAlterEgoFromTree(tree, { errorPrefix })).toBe("mark2");
  });

  it("throws when ReleaseSection alterEgo values conflict", () => {
    const tree = root([releaseNode("mark2"), releaseNode("theabbott")]);
    expect(() => inferAlterEgoFromTree(tree, { errorPrefix })).toThrow(
      `${errorPrefix}: multiple ReleaseSection alterEgo values found (mark2 vs theabbott).`,
    );
  });

  it("throws when alterEgo attribute is missing", () => {
    const tree = root([releaseNode(undefined)]);
    expect(() => inferAlterEgoFromTree(tree, { errorPrefix })).toThrow(
      `${errorPrefix}: ReleaseSection is missing the required alterEgo prop.`,
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
    expect(() => inferAlterEgoFromTree(tree, { errorPrefix })).toThrow(
      `${errorPrefix}: ReleaseSection alterEgo must be a string literal.`,
    );
  });

  it("throws when alterEgo value is not in the allowed list", () => {
    const tree = root([releaseNode("unknown")]);
    expect(() => inferAlterEgoFromTree(tree, { errorPrefix })).toThrow(
      `${errorPrefix}: alterEgo must be one of ${ALTER_EGO_OPTIONS.join(", ")}.`,
    );
  });

  it("returns undefined when no ReleaseSection is present", () => {
    const tree = root([{ type: "paragraph", children: [] }]);
    expect(inferAlterEgoFromTree(tree, { errorPrefix })).toBeUndefined();
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
});
