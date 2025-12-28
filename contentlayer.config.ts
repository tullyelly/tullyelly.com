import path from "node:path";

import { defineDocumentType, makeSource } from "contentlayer2/source-files";

const contentDirPath = "content";
const alterEgoOptions = [
  "mark2",
  "cardattack",
  "theabbott",
  "unclejimmy",
  "tullyelly",
];
const defaultAlterEgo = "tullyelly";
const inferredAlterEgos = new Map<string, string>();

function remarkInferReleaseSectionAlterEgo() {
  return (tree: any, file: any) => {
    let foundAlterEgo: string | undefined;

    const absolutePath =
      typeof file?.path === "string"
        ? file.path
        : Array.isArray(file?.history) && file.history.length > 0
          ? file.history[0]
          : undefined;

    const sourceFilePath = absolutePath
      ? path.relative(path.join(process.cwd(), contentDirPath), absolutePath)
      : undefined;

    if (!sourceFilePath || sourceFilePath.startsWith("..")) {
      throw new Error(
        "ReleaseSection alterEgo inference failed because the source file path could not be resolved.",
      );
    }

    const errorPrefix = `Chronicle ${sourceFilePath}`;

    const visitNode = (node: any) => {
      const isReleaseSection =
        (node.type === "mdxJsxFlowElement" ||
          node.type === "mdxJsxTextElement") &&
        node.name === "ReleaseSection";

      if (isReleaseSection) {
        const alterEgoAttr = (node.attributes ?? []).find(
          (attr: any) =>
            attr?.type === "mdxJsxAttribute" && attr.name === "alterEgo",
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

        if (!alterEgoOptions.includes(alterEgoAttr.value)) {
          throw new Error(
            `${errorPrefix}: alterEgo must be one of ${alterEgoOptions.join(", ")}.`,
          );
        }

        if (foundAlterEgo && foundAlterEgo !== alterEgoAttr.value) {
          throw new Error(
            `${errorPrefix}: multiple ReleaseSection alterEgo values found (${foundAlterEgo} vs ${alterEgoAttr.value}).`,
          );
        }

        foundAlterEgo = alterEgoAttr.value;
      }

      if (node?.children) {
        for (const child of node.children) visitNode(child);
      }
    };

    visitNode(tree);

    if (foundAlterEgo) {
      inferredAlterEgos.set(sourceFilePath, foundAlterEgo);
    } else {
      inferredAlterEgos.delete(sourceFilePath);
    }
  };
}

const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: "chronicles/**/*.mdx",
  contentType: "mdx",
  // Chronicles frontmatter; alterEgo is an optional persona key (mark2 | cardattack | theabbott | unclejimmy | tullyelly) and defaults via computedFields below.
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
      options: alterEgoOptions,
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
        const merged = inferred
          ? [...(doc.tags ?? []), inferred]
          : [...(doc.tags ?? [])];
        return Array.from(new Set(merged));
      },
    },
    resolvedAlterEgo: {
      type: "string",
      resolve: (doc) =>
        doc.alterEgo ??
        inferredAlterEgos.get(doc._raw.sourceFilePath) ??
        defaultAlterEgo,
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
