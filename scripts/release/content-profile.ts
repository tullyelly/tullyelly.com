/** Immutable-tree classification shared by publication, CI and release preparation. */
import { execFileSync } from "node:child_process";
import matter from "gray-matter";
import { createProcessor } from "@mdx-js/mdx";
import {
  resolveChronicleImagePath,
  resolveChronicleCarouselFolder,
} from "../../lib/images/resolve-chronicle-image-path";

export const CONTENT_POLICY = "chronicles-v1";
export type ContentProfile = {
  policy: typeof CONTENT_POLICY;
  profile: "content" | "application";
  baseline: string;
  target: string;
  reason: string;
  changedPaths: string[];
  chronicles: string[];
  assets: string[];
};
const post = /^content\/chronicles\/([a-z0-9]+(?:-[a-z0-9]+)*)\.mdx$/;
const asset =
  /^public\/images\/optimus\/[A-Za-z0-9_./-]+\.(?:webp|png|jpe?g|gif)$/i;
const manifest = "lib/images/optimus-images-manifest.json";
const components = new Set([
  "ReleaseSection",
  "PersonTag",
  "TagLink",
  "YouTubeVideo",
  "FolderImageCarousel",
  "TcdbSnapshot",
  "ClanSnapshot",
  "CategorySnapshot",
  "SetCollector",
  "ChronicleImage",
  "Image",
  "MdxImage",
  "CipherSays",
  "LuluLearns",
  "ScrollAmendment",
  "FlowersInline",
  "LoopedGif",
  "Tweet",
  "a",
  "b",
  "br",
  "strong",
  "em",
  "i",
  "p",
  "div",
  "span",
  "ul",
  "ol",
  "li",
  "blockquote",
  "code",
  "pre",
  "hr",
  "img",
  "sup",
  "sub",
]);
type Node = {
  type: string;
  name?: string | null;
  value?: unknown;
  children?: Node[];
  attributes?: { type: string; name?: string; value?: unknown }[];
};
export function supportedMdx(source: string): boolean {
  const parsed = matter(source);
  if (parsed.data.draft === true || parsed.data.published === false)
    return false;
  const visit = (node: Node): boolean => {
    if (
      ["mdxjsEsm", "mdxFlowExpression", "mdxTextExpression"].includes(node.type)
    )
      return false;
    if (
      node.type === "mdxJsxFlowElement" ||
      node.type === "mdxJsxTextElement"
    ) {
      if (!node.name || !components.has(node.name)) return false;
      const seen = new Set<string>();
      for (const a of node.attributes ?? []) {
        if (
          a.type !== "mdxJsxAttribute" ||
          !a.name ||
          seen.has(a.name) ||
          /^on/i.test(a.name) ||
          a.name === "dangerouslySetInnerHTML" ||
          (a.value !== null && typeof a.value !== "string")
        )
          return false;
        if (
          typeof a.value === "string" &&
          /^(?:href|src)$/i.test(a.name) &&
          /^\s*(?:javascript|data):/i.test(a.value)
        )
          return false;
        seen.add(a.name);
      }
    }
    return (node.children ?? []).every(visit);
  };
  return visit(createProcessor().parse(parsed.content) as Node);
}
function references(source: string, slug: string, paths: string[]) {
  const used = new Set<string>();
  const parsed = matter(source);
  if (parsed.data.draft === true || parsed.data.published === false)
    return used;
  const visit = (node: Node & { url?: string }) => {
    if (node.type === "image" && node.url)
      used.add(resolveChronicleImagePath(slug, node.url));
    if (node.name) {
      const value = (key: string) =>
        node.attributes?.find((a) => a.name === key)?.value;
      if (node.name === "FolderImageCarousel") {
        const folder = value("folder");
        if (folder === undefined || typeof folder === "string") {
          const prefix = `/images/optimus/${resolveChronicleCarouselFolder(slug, folder)}/`;
          paths.filter((p) => p.startsWith(prefix)).forEach((p) => used.add(p));
        }
      } else if (
        ["Image", "MdxImage", "ChronicleImage", "img"].includes(node.name)
      ) {
        const src = value("src");
        if (typeof src === "string")
          used.add(resolveChronicleImagePath(slug, src));
      }
    }
    (node.children ?? []).forEach(visit);
  };
  visit(createProcessor().parse(parsed.content) as Node);
  return used;
}
export function classifyContent(
  baseline: string,
  target: string,
  root = process.cwd(),
): ContentProfile {
  const result: ContentProfile = {
    policy: CONTENT_POLICY,
    profile: "application",
    baseline,
    target,
    reason: "unverified-baseline",
    changedPaths: [],
    chronicles: [],
    assets: [],
  };
  const git = (...args: string[]) =>
    execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
      env: { ...process.env, GIT_NO_REPLACE_OBJECTS: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
  const read = (sha: string, path: string) => git("show", `${sha}:${path}`);
  try {
    if (![baseline, target].every((s) => /^[a-f0-9]{40}$/.test(s)))
      return result;
    git("merge-base", "--is-ancestor", baseline, target);
    const changes = git(
      "diff",
      "--no-renames",
      "--name-status",
      "-z",
      baseline,
      target,
    ).split("\0");
    const entries: { status: string; path: string }[] = [];
    for (let i = 0; i < changes.length - 1; i += 2)
      entries.push({ status: changes[i], path: changes[i + 1] });
    result.changedPaths = entries.map((e) => e.path);
    if (!entries.length) {
      result.reason = "no-publication-change";
      return result;
    }
    for (const e of entries) {
      result.reason = `application-change:${e.path}`;
      if (!["A", "M"].includes(e.status) || e.path.split("/").includes(".."))
        return result;
      if (!/^100644 blob /.test(git("ls-tree", target, "--", e.path)))
        return result;
      if (e.path === ".jira/active-epic.json") {
        const record = JSON.parse(read(target, e.path));
        if (
          Object.keys(record).sort().join() !== "branch,day,epic,timezone" ||
          !/^WU-\d+$/.test(record.epic) ||
          typeof record.branch !== "string" ||
          !/^(?:epic|feature)\/[a-zA-Z0-9/._-]+$/.test(record.branch) ||
          !/^\d{4}-\d{2}-\d{2}$/.test(record.day) ||
          record.timezone !== "America/Chicago"
        )
          return result;
      } else if (post.test(e.path)) {
        result.reason = `unsupported-mdx:${e.path}`;
        if (
          !supportedMdx(read(target, e.path)) ||
          (e.status === "M" && !supportedMdx(read(baseline, e.path)))
        )
          return result;
        result.chronicles.push(e.path.match(post)![1]);
      } else if (asset.test(e.path))
        result.assets.push(e.path.slice("public".length));
      else if (e.path !== manifest) return result;
    }
    // Unchanged entries must remain byte-for-byte equivalent as JSON data. New
    // dimensions are checked against actual bytes by focused validation.
    const before = JSON.parse(read(baseline, manifest));
    const after = JSON.parse(read(target, manifest));
    const validManifest = (m: {
      urls: string[];
      images: { src: string; width: number; height: number }[];
    }) =>
      Object.keys(m).sort().join() === "images,urls" &&
      Array.isArray(m.urls) &&
      Array.isArray(m.images) &&
      m.urls.length === m.images.length &&
      new Set(m.urls).size === m.urls.length &&
      m.images.every(
        (r, i) =>
          Object.keys(r).sort().join() === "height,src,width" &&
          r.src === m.urls[i] &&
          Number.isInteger(r.width) &&
          r.width > 0 &&
          Number.isInteger(r.height) &&
          r.height > 0,
      );
    if (!validManifest(before) || !validManifest(after)) {
      result.reason = "invalid-image-manifest";
      return result;
    }
    const changedAssets = new Set(result.assets);
    const unchanged = (m: typeof before) =>
      m.images.filter((r: { src: string }) => !changedAssets.has(r.src));
    if (
      JSON.stringify(unchanged(before)) !== JSON.stringify(unchanged(after))
    ) {
      result.reason = "unrelated-image-manifest-change";
      return result;
    }
    if (!result.chronicles.length && !result.assets.length) {
      result.reason = "no-publication-change";
      return result;
    }
    if (result.assets.length) {
      const remaining = new Set(result.assets);
      const paths = git(
        "ls-tree",
        "-r",
        "--name-only",
        target,
        "--",
        "content/chronicles",
      )
        .trim()
        .split("\n");
      for (const path of paths.filter((p) => post.test(p))) {
        const slug = path.match(post)![1];
        const source = read(target, path);
        const used = references(source, slug, after.urls);
        if (!result.assets.some((p) => used.has(p))) continue;
        if (!supportedMdx(source)) {
          result.reason = `unsupported-asset-consumer:${path}`;
          return result;
        }
        if (!result.chronicles.includes(slug)) result.chronicles.push(slug);
        used.forEach((p) => remaining.delete(p));
      }
      if (remaining.size) {
        result.reason = "unreferenced-image-change";
        return result;
      }
    }
    result.profile = "content";
    result.reason = "supported-chronicle-content";
    return result;
  } catch {
    result.reason = "unverified-content-or-baseline";
    return result;
  }
}
