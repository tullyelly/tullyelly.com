/** @jest-environment node */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  checkChangedPublicationHealth,
  checkPublicationHealth,
} from "../../scripts/release/code-publication-health";
import probe from "../../scripts/release/publication-probe.json";
import {
  classifyCodeFailure,
  codeGuard,
} from "../../scripts/release/code-diagnostics";

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
  ["health.staged", 503, "http-status"],
  ["health.public", 503, "http-status"],
  ["health.staged", 200, "health-not-ok"],
  ["health.public", 200, "health-not-ok"],
] as const)(
  "%s records API health status %s and %s without publishing JSON or headers",
  async (guard, status, condition) => {
    const sensitive = "PRIVATE_API_HEALTH_BODY_AND_COOKIE";
    const baseline = fixture();
    const read = jest.fn(async (path: string) =>
      path === "/api/health"
        ? Response.json(
            { ok: false, details: sensitive },
            { status, headers: { "set-cookie": sensitive } },
          )
        : baseline(path),
    );
    let diagnostic: ReturnType<typeof classifyCodeFailure> | undefined;
    try {
      await codeGuard(guard, () => checkPublicationHealth(read, sha));
      throw new Error("Expected API health to reject");
    } catch (error) {
      diagnostic = classifyCodeFailure(guard, error);
    }
    expect(diagnostic).toEqual({
      guard,
      category: "invariant",
      invariant: "code.health-page",
      status,
      health: { path: "/api/health", condition },
    });
    expect(JSON.stringify(diagnostic)).not.toContain(sensitive);
    expect(read.mock.calls.map(([path]) => path)).toEqual([
      "/api/__version",
      "/api/health",
    ]);
  },
);
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

const changedBytes = "candidate image bytes";
const changedPlan = {
  chronicles: [
    {
      path: "/shaolin/new-publication",
      title: "New & published",
      date: "2026-10-17",
      text: ["Current authored publication text."],
    },
  ],
  assets: [
    {
      path: "/images/optimus/new-publication/photo.webp",
      sha256: createHash("sha256").update(changedBytes).digest("hex"),
    },
  ],
};
function changedFixture(body = changedBytes, heading = "New &amp; published") {
  return jest.fn(async (path: string) =>
    path.startsWith("/shaolin/")
      ? new Response(
          `<h1>Oct 17, 2026: ${heading}</h1><p>Current authored publication text.</p><img src="/_next/image?url=${encodeURIComponent(changedPlan.assets[0].path)}&amp;w=640&amp;q=75" />`,
          {
            headers: { "content-type": "text/html" },
          },
        )
      : new Response(body, { headers: { "content-type": "image/webp" } }),
  );
}
test("candidate checks cover changed Chronicles and exact assets beyond Appleton East", async () => {
  const read = changedFixture();
  await expect(
    checkChangedPublicationHealth(read, changedPlan),
  ).resolves.toBeUndefined();
  expect(read).toHaveBeenCalledWith(changedPlan.chronicles[0].path);
  expect(read).toHaveBeenCalledWith(changedPlan.assets[0].path);
  expect(
    read.mock.calls.some(([path]) => path.startsWith("/_next/image?")),
  ).toBe(true);
});
test("stale candidate content and mismatched asset bytes fail staged acceptance", async () => {
  await expect(
    checkChangedPublicationHealth(
      changedFixture(changedBytes, "Old title"),
      changedPlan,
    ),
  ).rejects.toThrow("code.health-publication");
  await expect(
    checkChangedPublicationHealth(changedFixture("old image"), changedPlan),
  ).rejects.toThrow("code.health-publication-asset");
});
test("unsafe generated publication paths are rejected without fetching", async () => {
  const read = changedFixture();
  await expect(
    checkChangedPublicationHealth(read, {
      chronicles: [],
      assets: [{ ...changedPlan.assets[0], path: "/images/../private" }],
    }),
  ).rejects.toThrow("code.health-publication-asset");
  expect(read).not.toHaveBeenCalled();
});
