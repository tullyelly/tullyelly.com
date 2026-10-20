/** Fixed read-only acceptance probe for the published incident recovery. */
import { createHash } from "node:crypto";
import { decodeHTML, decodeHTMLAttribute } from "entities";
import probe from "./publication-probe.json";
import type { PublicationPlan } from "./code-publication-plan";
import { CodeHealthError, CodePublicationError } from "./code-diagnostics";

type Read = (path: string) => Promise<Response>;

function markup(html: string) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|textarea)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
}
function text(html: string) {
  // Strip markup before decoding so escaped angle brackets remain visible text.
  // Decode only the rendered side, once; source samples may contain literal entities.
  return decodeHTML(markup(html).replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ");
}
async function html(read: Read, path: string) {
  const response = await read(path);
  if (response.status !== 200)
    throw new CodePublicationError(
      "code.health-publication",
      path,
      "http-status",
      response.status,
    );
  if (!response.headers.get("content-type")?.startsWith("text/html"))
    throw new CodePublicationError(
      "code.health-publication",
      path,
      "content-type",
      response.status,
    );
  const body = await response.text();
  if (body.length > 4 * 1024 * 1024)
    throw new CodePublicationError(
      "code.health-publication",
      path,
      "body-too-large",
      response.status,
    );
  return { body, status: response.status };
}

async function image(
  read: Read,
  requestPath: string,
  assetPath = requestPath,
  hash?: string,
  maxBytes?: number,
) {
  const response = await read(requestPath);
  if (response.status !== 200)
    throw new CodePublicationError(
      "code.health-publication-asset",
      assetPath,
      "http-status",
      response.status,
    );
  if (!response.headers.get("content-type")?.startsWith("image/"))
    throw new CodePublicationError(
      "code.health-publication-asset",
      assetPath,
      "content-type",
      response.status,
    );
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!bytes.length)
    throw new CodePublicationError(
      "code.health-publication-asset",
      assetPath,
      "asset-empty",
      response.status,
    );
  if (maxBytes && bytes.length > maxBytes)
    throw new CodePublicationError(
      "code.health-publication-asset",
      assetPath,
      "asset-too-large",
      response.status,
    );
  if (hash && createHash("sha256").update(bytes).digest("hex") !== hash)
    throw new CodePublicationError(
      "code.health-publication-asset",
      assetPath,
      "asset-hash",
      response.status,
    );
}

/** Candidate-specific checks supplement the retained Appleton East regression. */
export async function checkChangedPublicationHealth(
  read: Read,
  plan: PublicationPlan,
) {
  const renderedAssets = new Map<string, string>();
  for (const chronicle of plan.chronicles) {
    if (!/^\/shaolin\/[a-z0-9-]+$/.test(chronicle.path))
      throw new Error("code.health-publication");
    const { body, status } = await html(read, chronicle.path);
    const page = markup(body);
    const heading = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(page)?.[1] ?? "";
    const date = new Date(chronicle.date);
    if (!Number.isFinite(date.getTime()))
      throw new CodePublicationError(
        "code.health-publication",
        chronicle.path,
        "invalid-date",
        status,
      );
    const expectedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
    if (!text(heading).includes(`${expectedDate}: ${chronicle.title}`))
      throw new CodePublicationError(
        "code.health-publication",
        chronicle.path,
        "heading-mismatch",
        status,
      );
    const visibleText = text(page);
    for (const [index, example] of chronicle.text.entries())
      if (!visibleText.includes(example))
        throw new CodePublicationError(
          "code.health-publication",
          chronicle.path,
          "text-mismatch",
          status,
          index,
        );
    for (const match of page.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gi)) {
      let url: URL;
      try {
        url = new URL(decodeHTMLAttribute(match[1]), "https://tullyelly.com");
      } catch {
        throw new CodePublicationError(
          "code.health-publication-asset",
          chronicle.path,
          "asset-url",
          status,
        );
      }
      const asset =
        url.pathname === "/_next/image"
          ? url.searchParams.get("url")
          : url.pathname;
      if (!plan.assets.some((entry) => entry.path === asset)) continue;
      if (
        url.origin !== "https://tullyelly.com" ||
        url.username ||
        url.password
      )
        throw new CodePublicationError(
          "code.health-publication-asset",
          chronicle.path,
          "asset-origin",
          status,
        );
      renderedAssets.set(url.pathname + url.search, asset!);
    }
  }
  for (const asset of plan.assets) {
    if (
      !/^\/images\/[A-Za-z0-9_./-]+$/.test(asset.path) ||
      asset.path.split("/").includes("..") ||
      !/^[a-f0-9]{64}$/.test(asset.sha256)
    )
      throw new Error("code.health-publication-asset");
    await image(read, asset.path, asset.path, asset.sha256, 64 * 1024 * 1024);
  }
  for (const [path, asset] of renderedAssets) await image(read, path, asset);
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
  if (health.status !== 200)
    throw new CodeHealthError("/api/health", health.status, "http-status");
  const healthBody: unknown = await health.json();
  if (
    !healthBody ||
    typeof healthBody !== "object" ||
    !("ok" in healthBody) ||
    healthBody.ok !== true
  )
    throw new CodeHealthError("/api/health", health.status, "health-not-ok");
  const path = `/shaolin/${probe.slug}`;
  const { body: post, status } = await html(read, path);
  const visible = markup(post);
  const heading = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(visible)?.[1] ?? "";
  if (!text(heading).includes(`Oct 13, 2026: ${probe.title}`))
    throw new CodePublicationError(
      "code.health-publication",
      path,
      "heading-mismatch",
      status,
    );
  const visibleText = text(visible);
  for (const [index, expected] of probe.text.entries())
    if (!visibleText.includes(expected))
      throw new CodePublicationError(
        "code.health-publication",
        path,
        "text-mismatch",
        status,
        index,
      );
  if (
    (visible.match(/data-testid="folder-carousel-thumbnail"/g) ?? []).length !==
    probe.folders.length
  )
    throw new CodePublicationError(
      "code.health-publication",
      path,
      "carousel-mismatch",
      status,
    );
  if (probe.assets.some((asset) => !post.includes(asset)))
    throw new CodePublicationError(
      "code.health-publication",
      path,
      "asset-missing",
      status,
    );

  // Check the actual six server-rendered image sources, including optimized
  // thumbnail URLs, as well as every slide supplied to the three carousels.
  const images = [...visible.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gi)]
    .map((match) => {
      try {
        return new URL(decodeHTMLAttribute(match[1]), "https://tullyelly.com");
      } catch {
        throw new CodePublicationError(
          "code.health-publication",
          path,
          "asset-url",
          status,
        );
      }
    })
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
  if (images.some((url) => url.origin !== "https://tullyelly.com"))
    throw new CodePublicationError(
      "code.health-publication",
      path,
      "asset-origin",
      status,
    );
  if (expected.some((asset) => !rendered.includes(asset)))
    throw new CodePublicationError(
      "code.health-publication",
      path,
      "asset-missing",
      status,
    );
  for (const requestPath of new Set([
    ...probe.assets,
    ...images.map((url) => url.pathname + url.search),
  ])) {
    const asset = requestPath.startsWith("/_next/image?")
      ? new URL(requestPath, "https://tullyelly.com").searchParams.get("url")!
      : requestPath;
    const hash =
      probe.assetSha256[requestPath as keyof typeof probe.assetSha256];
    await image(read, requestPath, asset, hash);
  }
  const listingResponse = await html(read, "/shaolin");
  const listing = markup(listingResponse.body);
  if (
    ![
      ...listing.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi),
    ].some(
      (match) =>
        match[1] === `/shaolin/${probe.slug}` &&
        text(match[2]).includes(probe.title),
    )
  )
    throw new CodePublicationError(
      "code.health-publication-listing",
      "/shaolin",
      "listing-mismatch",
      listingResponse.status,
    );
}
