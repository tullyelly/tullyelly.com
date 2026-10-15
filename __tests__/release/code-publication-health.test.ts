/** @jest-environment node */
import { readFileSync } from "node:fs";
import { checkPublicationHealth } from "../../scripts/release/code-publication-health";
import probe from "../../scripts/release/publication-probe.json";

const sha = "a".repeat(40);
const rendered = probe.assets.filter(
  (asset) =>
    !probe.folders.some((folder) =>
      asset.startsWith(`/images/optimus/${folder}/`),
    ) || asset.endsWith("-0.webp"),
);
function fixture(change: Record<string, string | number | undefined> = {}) {
  const sources = rendered
    .map(
      (asset) =>
        `<img src="/_next/image?url=${encodeURIComponent(asset)}&amp;w=640&amp;q=75" />`,
    )
    .join("");
  const page = `<h1>Oct 13, 2026: ${probe.title}</h1><article>${probe.text.map((text) => `<p>${text}</p>`).join("")}${sources}${probe.folders.map(() => '<button data-testid="folder-carousel-thumbnail"></button>').join("")}</article><script>${JSON.stringify(probe.assets)}</script>`;
  const fetcher = jest.fn(async (path: string) => {
    if (path === "/api/__version")
      return Response.json({ commitSha: change.sha ?? sha });
    if (path === "/api/health") return Response.json({ ok: true });
    if (path.startsWith("/images/") || path.startsWith("/_next/image")) {
      const asset = path.startsWith("/_next/image")
        ? new URL(path, "https://tullyelly.com").searchParams.get("url")!
        : path;
      return new Response(
        change.asset === asset
          ? "wrong bytes"
          : (readFileSync(`public${asset}`) as unknown as BodyInit),
        {
          status: change.status === asset ? 404 : 200,
          headers: {
            "content-type": change.type === asset ? "text/html" : "image/webp",
          },
        },
      );
    }
    const body =
      path === "/shaolin"
        ? `<a href="/shaolin/${probe.slug}">${probe.title}</a>`
        : page;
    return new Response(
      typeof change[path] === "string" ? change[path] : body,
      { headers: { "content-type": "text/html; charset=utf-8" } },
    );
  });
  return fetcher;
}
test("checks revision, rendered content, all images including optimized sources and listing", async () => {
  const read = fixture();
  await expect(checkPublicationHealth(read, sha)).resolves.toBeUndefined();
  for (const asset of probe.assets) expect(read).toHaveBeenCalledWith(asset);
  expect(
    read.mock.calls.filter(([path]) => path.startsWith("/_next/image")),
  ).toHaveLength(6);
});
test("retained rollback content checks do not substitute an unknown native build revision for provider identity", async () => {
  const read = fixture({ sha: "unknown" });
  await expect(checkPublicationHealth(read)).resolves.toBeUndefined();
  expect(read).not.toHaveBeenCalledWith("/api/__version");
  await expect(
    checkPublicationHealth(fixture({ sha: "unknown" }), sha),
  ).rejects.toThrow("code.health-revision");
});
test.each([
  { sha: "b".repeat(40) },
  { "/shaolin/appleton-east": "<h1>draft</h1>" },
  { "/shaolin/appleton-east": `<script>${probe.text.join(" ")}</script>` },
  {
    "/shaolin": `<script><a href="/shaolin/${probe.slug}">${probe.title}</a></script>`,
  },
  { asset: probe.assets[0] },
  { status: probe.assets[1] },
  { type: probe.assets[2] },
])("publication failure prevents acceptance %#", async (change) => {
  await expect(checkPublicationHealth(fixture(change), sha)).rejects.toThrow(
    /^code\.health-/,
  );
});
test("external optimized image sources are rejected without requesting them", async () => {
  const read = fixture({
    "/shaolin/appleton-east": `<h1>Oct 13, 2026: ${probe.title}</h1>${probe.text.join(" ")}${probe.folders.map(() => '<button data-testid="folder-carousel-thumbnail"></button>').join("")}<img src="https://evil.example/_next/image?url=${encodeURIComponent(rendered[0])}" /><script>${JSON.stringify(probe.assets)}</script>`,
  });
  await expect(checkPublicationHealth(read, sha)).rejects.toThrow(
    "code.health-publication",
  );
  expect(
    read.mock.calls.every(
      ([path]) => path.startsWith("/") && !path.startsWith("//"),
    ),
  ).toBe(true);
});
