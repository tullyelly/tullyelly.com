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

export function inferAlterEgoFromTree(
  tree: MdxNode,
  {
    errorPrefix = "Chronicle",
    allowedAlterEgos = ALTER_EGO_OPTIONS,
  }: InferOptions = {},
): AlterEgo | undefined {
  let foundAlterEgo: AlterEgo | undefined;

  const visitNode = (node: MdxNode | undefined) => {
    if (!node) return;
    const isReleaseSection =
      (node.type === "mdxJsxFlowElement" ||
        node.type === "mdxJsxTextElement") &&
      node.name === "ReleaseSection";

    if (isReleaseSection) {
      const alterEgoAttr = (node.attributes ?? []).find(
        (attr) => attr?.type === "mdxJsxAttribute" && attr.name === "alterEgo",
      );

      if (!alterEgoAttr) {
        throw new Error(
          `${errorPrefix}: ReleaseSection is missing the required alterEgo prop.`,
        );
      }

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

      if (foundAlterEgo && foundAlterEgo !== alterEgoAttr.value) {
        throw new Error(
          `${errorPrefix}: multiple ReleaseSection alterEgo values found (${foundAlterEgo} vs ${alterEgoAttr.value}).`,
        );
      }

      foundAlterEgo = alterEgoAttr.value as AlterEgo;
    }

    if (node.children) {
      for (const child of node.children) {
        visitNode(child);
      }
    }
  };

  visitNode(tree);
  return foundAlterEgo;
}

export function mergeTagsWithAlterEgo(
  tags: string[] | undefined,
  alterEgo: string | undefined,
): string[] {
  const merged = alterEgo ? [...(tags ?? []), alterEgo] : [...(tags ?? [])];
  return Array.from(new Set(merged));
}
