/** Fixed read-only acceptance probe for the published incident recovery. */
import { createHash } from "node:crypto";
import probe from "./publication-probe.json";

type Read = (path: string) => Promise<Response>;

function markup(html: string) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|textarea)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
}
function text(html: string) {
  return markup(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ");
}
async function html(read: Read, path: string) {
  const response = await read(path);
  if (
    response.status !== 200 ||
    !response.headers.get("content-type")?.startsWith("text/html")
  )
    throw new Error("code.health-publication");
  const body = await response.text();
  if (body.length > 4 * 1024 * 1024) throw new Error("code.health-publication");
  return body;
}

export async function checkPublicationHealth(
  read: Read,
  applicationSha?: string,
) {
  // Native recovery has no Git metadata at remote build time and reports
  // "unknown" here. Rollbacks bind its revision through provider identity and
  // exact aliases instead. Every newly built normal release must match.
  if (applicationSha) {
    const version = await read("/api/__version");
    if (version.status !== 200) throw new Error("code.health-revision");
    const revision: unknown = await version.json();
    if (
      !revision ||
      typeof revision !== "object" ||
      !("commitSha" in revision) ||
      revision.commitSha !== applicationSha
    )
      throw new Error("code.health-revision");
  }
  const health = await read("/api/health");
  if (health.status !== 200 || (await health.json())?.ok !== true)
    throw new Error("code.health-page");
  const post = await html(read, `/shaolin/${probe.slug}`);
  const visible = markup(post);
  const heading = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(visible)?.[1] ?? "";
  if (
    !text(heading).includes(`Oct 13, 2026: ${probe.title}`) ||
    probe.text.some((expected) => !text(visible).includes(expected)) ||
    (visible.match(/data-testid="folder-carousel-thumbnail"/g) ?? []).length !==
      probe.folders.length ||
    probe.assets.some((asset) => !post.includes(asset))
  )
    throw new Error("code.health-publication");

  // Check the actual six server-rendered image sources, including optimized
  // thumbnail URLs, as well as every slide supplied to the three carousels.
  const images = [...visible.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gi)]
    .map((match) => match[1].replaceAll("&amp;", "&"))
    .map((src) => new URL(src, "https://tullyelly.com"))
    .filter((url) => {
      const asset =
        url.pathname === "/_next/image"
          ? url.searchParams.get("url")
          : url.pathname;
      return asset && probe.assets.includes(asset);
    });
  const expected = probe.assets.filter(
    (asset) =>
      !probe.folders.some((folder) =>
        asset.startsWith(`/images/optimus/${folder}/`),
      ) || asset.endsWith("-0.webp"),
  );
  const rendered = images.map((url) =>
    url.pathname === "/_next/image"
      ? url.searchParams.get("url")
      : url.pathname,
  );
  if (
    images.some((url) => url.origin !== "https://tullyelly.com") ||
    expected.some((asset) => !rendered.includes(asset))
  )
    throw new Error("code.health-publication");
  for (const path of new Set([
    ...probe.assets,
    ...images.map((url) => url.pathname + url.search),
  ])) {
    const response = await read(path);
    if (
      response.status !== 200 ||
      !response.headers.get("content-type")?.startsWith("image/")
    )
      throw new Error("code.health-publication-asset");
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!bytes.length) throw new Error("code.health-publication-asset");
    const hash = probe.assetSha256[path as keyof typeof probe.assetSha256];
    if (hash && createHash("sha256").update(bytes).digest("hex") !== hash)
      throw new Error("code.health-publication-asset");
  }
  const listing = markup(await html(read, "/shaolin"));
  if (
    ![
      ...listing.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi),
    ].some(
      (match) =>
        match[1] === `/shaolin/${probe.slug}` &&
        text(match[2]).includes(probe.title),
    )
  )
    throw new Error("code.health-publication-listing");
}
