import path from "node:path";

import { defineDocumentType, makeSource } from "contentlayer2/source-files";
import {
  ALTER_EGO_OPTIONS,
  DEFAULT_ALTER_EGO,
  inferAlterEgosFromTree,
  inferPersonTagsFromTree,
  inferYouTubeVideoArtistTagsFromTree,
  mergeChronicleTags,
  type MdxNode,
} from "./lib/alterEgo";

const contentDirPath = "content";
const inferredAlterEgos = new Map<string, string[]>();
const inferredPersonTags = new Map<string, string[]>();
const inferredYouTubeVideoArtistTags = new Map<string, string[]>();

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

function remarkInferYouTubeVideoArtistTags() {
  return (tree: MdxNode, file: any) => {
    const sourceFilePath = resolveInferenceSourceFilePath(file);

    if (!sourceFilePath || sourceFilePath.startsWith("..")) {
      throw new Error(
        "YouTubeVideo artist inference failed because the source file path could not be resolved.",
      );
    }

    const errorPrefix = `Chronicle ${sourceFilePath}`;

    const foundTags = inferYouTubeVideoArtistTagsFromTree(tree, {
      errorPrefix,
    });

    if (foundTags.length > 0) {
      inferredYouTubeVideoArtistTags.set(sourceFilePath, foundTags);
    } else {
      inferredYouTubeVideoArtistTags.delete(sourceFilePath);
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
        const inferredAlterEgoTags = inferredAlterEgos.get(
          doc._raw.sourceFilePath,
        );
        const inferredInlinePersonTags = inferredPersonTags.get(
          doc._raw.sourceFilePath,
        );
        const inferredVideoArtistTags = inferredYouTubeVideoArtistTags.get(
          doc._raw.sourceFilePath,
        );

        // PersonTag lets authors tag people or concepts inline without changing tag page UI behavior.
        return mergeChronicleTags(
          doc.tags,
          inferredAlterEgoTags ?? [],
          inferredInlinePersonTags ?? [],
          inferredVideoArtistTags ?? [],
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
    remarkPlugins: [
      remarkInferReleaseSectionAlterEgo,
      remarkInferPersonTags,
      remarkInferYouTubeVideoArtistTags,
    ],
    rehypePlugins: [],
  },
});
