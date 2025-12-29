import path from "node:path";

import { defineDocumentType, makeSource } from "contentlayer2/source-files";

import {
  ALTER_EGO_OPTIONS,
  DEFAULT_ALTER_EGO,
  inferAlterEgoFromTree,
  mergeTagsWithAlterEgo,
} from "./lib/alterEgo";

const contentDirPath = "content";
const inferredAlterEgos = new Map<string, string>();

function remarkInferReleaseSectionAlterEgo() {
  return (tree: any, file: any) => {
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

    const foundAlterEgo = inferAlterEgoFromTree(tree, {
      errorPrefix,
      allowedAlterEgos: ALTER_EGO_OPTIONS,
    });

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
        return mergeTagsWithAlterEgo(doc.tags, inferred);
      },
    },
    resolvedAlterEgo: {
      type: "string",
      resolve: (doc) =>
        doc.alterEgo ??
        inferredAlterEgos.get(doc._raw.sourceFilePath) ??
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
