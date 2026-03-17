import { normalizeTagSlug } from "@/lib/tags";

export const ALTER_EGO_OPTIONS = [
  "mark2",
  "cardattack",
  "theabbott",
  "unclejimmy",
  "tullyelly",
  "george",
] as const;

export const DEFAULT_ALTER_EGO = "tullyelly";

export type AlterEgo = (typeof ALTER_EGO_OPTIONS)[number];

export type MdxJsxAttribute = { type?: string; name?: string; value?: unknown };
export type MdxNode = {
  type?: string;
  name?: string;
  attributes?: MdxJsxAttribute[];
  children?: MdxNode[];
};

export type InferOptions = {
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

export function inferPersonTagsFromTree(
  tree: MdxNode,
  { errorPrefix = "Chronicle" }: InferOptions = {},
): string[] {
  const foundTags: string[] = [];

  const visitNode = (node: MdxNode | undefined) => {
    if (!node) return;
    const isPersonTag =
      (node.type === "mdxJsxFlowElement" ||
        node.type === "mdxJsxTextElement") &&
      node.name === "PersonTag";

    if (isPersonTag) {
      const tagAttrs = (node.attributes ?? []).filter(
        (attr) => attr?.type === "mdxJsxAttribute" && attr.name === "tag",
      );

      if (tagAttrs.length === 0) {
        throw new Error(
          `${errorPrefix}: PersonTag is missing the required tag prop.`,
        );
      }

      if (tagAttrs.length > 1) {
        throw new Error(
          `${errorPrefix}: PersonTag should declare exactly one tag prop.`,
        );
      }

      const tagAttr = tagAttrs[0];

      if (typeof tagAttr.value !== "string") {
        throw new Error(
          `${errorPrefix}: PersonTag tag must be a string literal.`,
        );
      }

      foundTags.push(tagAttr.value);
    }

    if (node.children) {
      for (const child of node.children) {
        visitNode(child);
      }
    }
  };

  visitNode(tree);
  return Array.from(new Set(foundTags));
}

export function inferYouTubeVideoArtistTagsFromTree(
  tree: MdxNode,
  { errorPrefix = "Chronicle" }: InferOptions = {},
): string[] {
  const foundTags: string[] = [];

  const visitNode = (node: MdxNode | undefined) => {
    if (!node) return;
    const isYouTubeVideo =
      (node.type === "mdxJsxFlowElement" ||
        node.type === "mdxJsxTextElement") &&
      node.name === "YouTubeVideo";

    if (isYouTubeVideo) {
      const artistAttrs = (node.attributes ?? []).filter(
        (attr) => attr?.type === "mdxJsxAttribute" && attr.name === "artist",
      );

      if (artistAttrs.length > 1) {
        throw new Error(
          `${errorPrefix}: YouTubeVideo should declare exactly one artist prop.`,
        );
      }

      const artistAttr = artistAttrs[0];

      if (artistAttr) {
        if (typeof artistAttr.value !== "string") {
          throw new Error(
            `${errorPrefix}: YouTubeVideo artist must be a string literal.`,
          );
        }

        const normalizedArtistTag = normalizeTagSlug(artistAttr.value);

        if (normalizedArtistTag) {
          foundTags.push(normalizedArtistTag);
        }
      }
    }

    if (node.children) {
      for (const child of node.children) {
        visitNode(child);
      }
    }
  };

  visitNode(tree);
  return Array.from(new Set(foundTags));
}

export function mergeChronicleTags(
  tags: string[] | undefined,
  ...inferredGroups: Array<string | string[] | undefined>
): string[] {
  const merged = [...(tags ?? [])];

  for (const group of inferredGroups) {
    if (Array.isArray(group)) {
      merged.push(...group);
    } else if (group) {
      merged.push(group);
    }
  }

  return Array.from(new Set(merged));
}

export function mergeTagsWithAlterEgo(
  tags: string[] | undefined,
  alterEgo: string | string[] | undefined,
): string[] {
  return mergeChronicleTags(tags, alterEgo);
}
