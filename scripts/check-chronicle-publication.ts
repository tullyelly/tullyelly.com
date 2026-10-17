import { readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { resolve, sep } from "node:path";
import matter from "gray-matter";
import { createProcessor } from "@mdx-js/mdx";
import { createHash } from "node:crypto";
import releaseProbe from "./release/publication-probe.json";
import {
  resolveChronicleCarouselFolder,
  resolveChronicleImagePath,
} from "../lib/images/resolve-chronicle-image-path";
type ImageAttribute = { type: string; name?: string; value?: unknown };

// Read the candidate's source and manifest, never stale Contentlayer output.
export function checkChroniclePublication(slug: string, root = process.cwd()) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    throw new Error("Expected one Chronicle slug");
  const source = readFileSync(
    resolve(root, "content/chronicles", `${slug}.mdx`),
    "utf8",
  );
  const { data, content } = matter(source);
  if (data.draft !== false)
    throw new Error("Intended Chronicle must have draft: false");
  for (const field of ["title", "summary", "date"])
    if (typeof data[field] !== "string" || !data[field].trim())
      throw new Error(`Missing Chronicle ${field}`);
  const manifest: {
    urls: string[];
    images: { src: string; width: number; height: number }[];
  } = JSON.parse(
    readFileSync(
      resolve(root, "lib/images/optimus-images-manifest.json"),
      "utf8",
    ),
  );
  const assets = new Set<string>();
  const folders: string[] = [];
  const examples: string[] = [];
  const publicRoot = realpathSync(resolve(root, "public"));
  function asset(src: string) {
    const url = resolveChronicleImagePath(slug, src);
    if (!url.startsWith("/") || url.startsWith("//"))
      throw new Error("Publication check requires a local image");
    const pathname = decodeURIComponent(url.split(/[?#]/, 1)[0]);
    const file = realpathSync(resolve(publicRoot, `.${pathname}`));
    if (
      !file.startsWith(publicRoot + sep) ||
      !statSync(file).isFile() ||
      !statSync(file).size
    )
      throw new Error("Required image is missing or outside public");
    if (
      pathname.startsWith("/images/optimus/") &&
      (!manifest.urls.includes(pathname) ||
        !manifest.images.some(
          (i) => i.src === pathname && i.width > 0 && i.height > 0,
        ))
    )
      throw new Error("Required image is missing manifest dimensions");
    assets.add(pathname);
  }
  const tree = createProcessor().parse(content);
  const definitions = new Map<string, string>();
  function definitionsIn(node: typeof tree | (typeof tree.children)[number]) {
    if (node.type === "definition") definitions.set(node.identifier, node.url);
    if ("children" in node) node.children.forEach(definitionsIn);
  }
  definitionsIn(tree);
  function visit(node: typeof tree | (typeof tree.children)[number]) {
    if (node.type === "text") {
      const value = node.value.replace(/\s+/g, " ").trim();
      if (value.length >= 24) examples.push(value.slice(0, 160));
    }
    if (node.type === "image") asset(node.url);
    if (node.type === "imageReference") {
      const src = definitions.get(node.identifier);
      if (!src) throw new Error("Unresolved image reference");
      asset(src);
    }
    if (
      node.type === "mdxJsxFlowElement" ||
      node.type === "mdxJsxTextElement"
    ) {
      if (
        ["FolderImageCarousel", "Image", "MdxImage", "img"].includes(
          node.name ?? "",
        )
      ) {
        const name = node.name === "FolderImageCarousel" ? "folder" : "src";
        if (
          node.attributes.some(
            (a: ImageAttribute) => a.type === "mdxJsxExpressionAttribute",
          )
        )
          throw new Error("Publication image props must be literal");
        const attrs = node.attributes.filter(
          (a: ImageAttribute) =>
            a.type === "mdxJsxAttribute" && a.name === name,
        );
        const value =
          attrs[0]?.type === "mdxJsxAttribute" ? attrs[0].value : undefined;
        if (attrs.length > 1 || (attrs.length && typeof value !== "string"))
          throw new Error("Publication image props must be literal");
        if (name === "src") {
          if (typeof value !== "string") throw new Error("Missing image src");
          asset(value);
        } else {
          const folder = resolveChronicleCarouselFolder(
            slug,
            value as string | undefined,
          );
          const prefix = `/images/optimus/${folder}/`;
          const slides = manifest.urls.filter((url) => url.startsWith(prefix));
          if (!slides.length)
            throw new Error("Required carousel has no manifest images");
          const directory = resolve(publicRoot, "images/optimus", folder);
          const diskSlides = readdirSync(directory, {
            recursive: true,
            withFileTypes: true,
          })
            .filter(
              (entry) =>
                entry.isFile() && /\.(webp|png|jpe?g|gif)$/i.test(entry.name),
            )
            .map(
              (entry) =>
                "/" +
                resolve(entry.parentPath, entry.name)
                  .slice(publicRoot.length + 1)
                  .split(sep)
                  .join("/"),
            );
          if (
            diskSlides.length !== slides.length ||
            diskSlides.some((url) => !slides.includes(url))
          )
            throw new Error(
              "Carousel manifest does not match candidate assets",
            );
          slides.forEach(asset);
          folders.push(folder);
        }
      }
    }
    if ("children" in node) node.children.forEach(visit);
  }
  visit(tree);
  return {
    slug,
    title: data.title as string,
    date: data.date as string,
    assets: [...assets].sort(),
    folders,
    text: [...new Set([...examples.slice(0, 3), ...examples.slice(-1)])],
  };
}

function main() {
  try {
    const slug = process.argv[2];
    const release = process.argv[3] === "--release";
    if (!slug || process.argv.length !== (release ? 4 : 3))
      throw new Error("Usage: npm run chronicle:ready -- <slug> [--release]");
    const report = checkChroniclePublication(slug);
    if (release) {
      const source = matter(
        readFileSync(resolve("content/chronicles", `${slug}.mdx`), "utf8"),
      );
      if (
        slug !== releaseProbe.slug ||
        report.date !== releaseProbe.date ||
        source.data.title !== releaseProbe.title ||
        JSON.stringify(report.assets) !== JSON.stringify(releaseProbe.assets) ||
        JSON.stringify(report.folders) !==
          JSON.stringify(releaseProbe.folders) ||
        releaseProbe.text.some((text) => !source.content.includes(text))
      )
        throw new Error(
          "Released Chronicle no longer matches acceptance probe",
        );
      for (const [asset, hash] of Object.entries(releaseProbe.assetSha256))
        if (
          createHash("sha256")
            .update(readFileSync(resolve("public", `.${asset}`)))
            .digest("hex") !== hash
        )
          throw new Error("Released Chronicle image changed");
    }
    console.log(JSON.stringify(report, null, 2));
  } catch {
    console.error(
      "Chronicle publication readiness failed; check source, draft flag, literal image props, assets and manifest.",
    );
    process.exitCode = 1;
  }
}

// Shared source readiness can be imported by evidence generation without running the CLI.
if (/check-chronicle-publication\.(?:ts|cjs)$/.test(process.argv[1] ?? ""))
  main();
