import { inferPersonTagsFromTree, mergeChronicleTags } from "@/lib/alterEgo";

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

describe("mergeChronicleTags", () => {
  it("merges frontmatter tags, alterEgo tags, and person tags with deduplication", () => {
    expect(
      mergeChronicleTags(
        ["alpha", "mark2"],
        ["mark2", "cardattack"],
        ["ron", "alpha"],
      ),
    ).toEqual(["alpha", "mark2", "cardattack", "ron"]);
  });
});
