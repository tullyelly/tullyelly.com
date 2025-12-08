import { defineDocumentType, makeSource } from "contentlayer2/source-files";

const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: "chronicles/**/*.mdx",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    date: { type: "date", required: true },
    summary: { type: "string", required: true },
    tags: { type: "list", of: { type: "string" }, default: [] },
    draft: { type: "boolean", default: false },
    infinityStone: { type: "boolean", default: false },
    cover: { type: "string", required: false },
    canonical: { type: "string", required: false },
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
  },
}));

export default makeSource({
  contentDirPath: "content",
  documentTypes: [Post],
  mdx: { remarkPlugins: [], rehypePlugins: [] },
});
