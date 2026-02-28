import path from "node:path";

import { defineDocumentType, makeSource } from "contentlayer2/source-files";

const contentDirPath = "content";
const inferredAlterEgos = new Map<string, string[]>();
const inferredPersonTags = new Map<string, string[]>();

const ALTER_EGO_OPTIONS = [
  "mark2",
  "cardattack",
  "theabbott",
  "unclejimmy",
  "tullyelly",
  "george",
] as const;

const DEFAULT_ALTER_EGO = "tullyelly";

type AlterEgo = (typeof ALTER_EGO_OPTIONS)[number];

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

function inferAlterEgosFromTree(
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

function inferPersonTagsFromTree(
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

function mergeChronicleTags(
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

function resolveInferenceSourceFilePath(file: any): string | undefined {
  const rawDocPath = file?.data?.rawDocumentData?.sourceFilePath;
  if (typeof rawDocPath === "string") return rawDocPath;

  const historyPath =
    Array.isArray(file?.history) && file.history.length > 0
      ? (file.history.find((entry: string) => entry.endsWith(".mdx")) ??
        file.history[file.history.length - 1])
      : undefined;

  const absolutePath = typeof file?.path === "string" ? file.path : historyPath;

  return absolutePath
    ? path.relative(path.join(process.cwd(), contentDirPath), absolutePath)
    : undefined;
}

function remarkInferReleaseSectionAlterEgo() {
  return (tree: MdxNode, file: any) => {
    const sourceFilePath = resolveInferenceSourceFilePath(file);

    if (!sourceFilePath || sourceFilePath.startsWith("..")) {
      throw new Error(
        "ReleaseSection alterEgo inference failed because the source file path could not be resolved.",
      );
    }

    const errorPrefix = `Chronicle ${sourceFilePath}`;

    const foundAlterEgos = inferAlterEgosFromTree(tree, {
      errorPrefix,
      allowedAlterEgos: ALTER_EGO_OPTIONS,
    });

    if (foundAlterEgos.length > 0) {
      inferredAlterEgos.set(sourceFilePath, foundAlterEgos);
    } else {
      inferredAlterEgos.delete(sourceFilePath);
    }
  };
}

function remarkInferPersonTags() {
  return (tree: MdxNode, file: any) => {
    const sourceFilePath = resolveInferenceSourceFilePath(file);

    if (!sourceFilePath || sourceFilePath.startsWith("..")) {
      throw new Error(
        "PersonTag inference failed because the source file path could not be resolved.",
      );
    }

    const errorPrefix = `Chronicle ${sourceFilePath}`;

    // PersonTag enables inline authoring of people and concepts while feeding the shared tag system.
    const foundTags = inferPersonTagsFromTree(tree, { errorPrefix });

    if (foundTags.length > 0) {
      inferredPersonTags.set(sourceFilePath, foundTags);
    } else {
      inferredPersonTags.delete(sourceFilePath);
    }
  };
}

const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: "chronicles/**/*.mdx",
  contentType: "mdx",
  // Chronicles frontmatter; alterEgo is an optional persona key (mark2 | cardattack | theabbott | unclejimmy | tullyelly | george) and defaults via computedFields below.
  fields: {
    title: { type: "string", required: true },
    date: { type: "date", required: true },
    summary: { type: "string", required: true },
    tags: { type: "list", of: { type: "string" }, default: [] },
    draft: { type: "boolean", default: false },
    infinityStone: { type: "boolean", default: false },
    cover: { type: "string", required: false },
    canonical: { type: "string", required: false },
    alterEgo: {
      type: "enum",
      options: ALTER_EGO_OPTIONS,
      required: false,
    },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => doc._raw.flattenedPath.replace(/^chronicles\//, ""),
    },
    url: {
      type: "string",
      resolve: (doc) =>
        `/shaolin/${doc._raw.flattenedPath.replace(/^chronicles\//, "")}`,
    },
    tags: {
      type: "list",
      of: { type: "string" },
      resolve: (doc) => {
        const inferredAlterEgoTags = inferredAlterEgos.get(doc._raw.sourceFilePath);
        const inferredInlinePersonTags = inferredPersonTags.get(
          doc._raw.sourceFilePath,
        );

        // PersonTag lets authors tag people or concepts inline without changing tag page UI behavior.
        return mergeChronicleTags(
          doc.tags,
          inferredAlterEgoTags ?? [],
          inferredInlinePersonTags ?? [],
        );
      },
    },
    resolvedAlterEgo: {
      type: "string",
      resolve: (doc) =>
        doc.alterEgo ??
        inferredAlterEgos.get(doc._raw.sourceFilePath)?.[0] ??
        DEFAULT_ALTER_EGO,
    },
  },
}));

export default makeSource({
  contentDirPath,
  documentTypes: [Post],
  date: { timezone: "America/Chicago" },
  mdx: {
    remarkPlugins: [remarkInferReleaseSectionAlterEgo, remarkInferPersonTags],
    rehypePlugins: [],
  },
});
