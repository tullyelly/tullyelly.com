export const ALTER_EGO_OPTIONS = [
  "mark2",
  "cardattack",
  "theabbott",
  "unclejimmy",
  "tullyelly",
] as const;

export const DEFAULT_ALTER_EGO = "tullyelly";

export type AlterEgo = (typeof ALTER_EGO_OPTIONS)[number];

type MdxJsxAttribute = { type?: string; name?: string; value?: unknown };
type MdxNode = {
  type?: string;
  name?: string;
  attributes?: MdxJsxAttribute[];
  children?: MdxNode[];
};

type InferOptions = {
  errorPrefix?: string;
  allowedAlterEgos?: readonly string[];
};

export function inferAlterEgosFromTree(
  tree: MdxNode,
  {
    errorPrefix = "Chronicle",
    allowedAlterEgos = ALTER_EGO_OPTIONS,
  }: InferOptions = {},
): AlterEgo[] {
  const foundAlterEgos: AlterEgo[] = [];

  const visitNode = (node: MdxNode | undefined) => {
    if (!node) return;
    const isReleaseSection =
      (node.type === "mdxJsxFlowElement" ||
        node.type === "mdxJsxTextElement") &&
      node.name === "ReleaseSection";

    if (isReleaseSection) {
      const alterEgoAttrs = (node.attributes ?? []).filter(
        (attr) => attr?.type === "mdxJsxAttribute" && attr.name === "alterEgo",
      );

      if (alterEgoAttrs.length === 0) {
        throw new Error(
          `${errorPrefix}: ReleaseSection is missing the required alterEgo prop.`,
        );
      }

      if (alterEgoAttrs.length > 1) {
        throw new Error(
          `${errorPrefix}: ReleaseSection should declare exactly one alterEgo prop.`,
        );
      }

      const alterEgoAttr = alterEgoAttrs[0];

      if (typeof alterEgoAttr.value !== "string") {
        throw new Error(
          `${errorPrefix}: ReleaseSection alterEgo must be a string literal.`,
        );
      }

      if (!allowedAlterEgos.includes(alterEgoAttr.value)) {
        throw new Error(
          `${errorPrefix}: alterEgo must be one of ${allowedAlterEgos.join(", ")}.`,
        );
      }

      foundAlterEgos.push(alterEgoAttr.value as AlterEgo);
    }

    if (node.children) {
      for (const child of node.children) {
        visitNode(child);
      }
    }
  };

  visitNode(tree);
  return Array.from(new Set(foundAlterEgos));
}

export function mergeTagsWithAlterEgo(
  tags: string[] | undefined,
  alterEgo: string | string[] | undefined,
): string[] {
  const alterEgos = Array.isArray(alterEgo)
    ? alterEgo
    : alterEgo
      ? [alterEgo]
      : [];
  const merged = [...(tags ?? []), ...alterEgos];
  return Array.from(new Set(merged));
}
