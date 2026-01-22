import path from "node:path";

import { defineDocumentType, makeSource } from "contentlayer2/source-files";

const contentDirPath = "content";
const inferredAlterEgos = new Map<string, string[]>();

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

function mergeTagsWithAlterEgo(
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

function remarkInferReleaseSectionAlterEgo() {
  return (tree: any, file: any) => {
    const resolveSourcePath = (): string | undefined => {
      const rawDocPath = file?.data?.rawDocumentData?.sourceFilePath;
      if (typeof rawDocPath === "string") return rawDocPath;

      const historyPath =
        Array.isArray(file?.history) && file.history.length > 0
          ? (file.history.find((entry: string) => entry.endsWith(".mdx")) ??
            file.history[file.history.length - 1])
          : undefined;

      const absolutePath =
        typeof file?.path === "string" ? file.path : historyPath;

      return absolutePath
        ? path.relative(path.join(process.cwd(), contentDirPath), absolutePath)
        : undefined;
    };

    const sourceFilePath = resolveSourcePath();

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
        const inferred = inferredAlterEgos.get(doc._raw.sourceFilePath);
        return mergeTagsWithAlterEgo(doc.tags, inferred ?? []);
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
  mdx: {
    remarkPlugins: [remarkInferReleaseSectionAlterEgo],
    rehypePlugins: [],
  },
});
