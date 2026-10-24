/** @jest-environment node */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ChronicleListClient, {
  type ChronicleListRow,
} from "../../app/shaolin/_components/ChronicleListClient";
import { ALTER_EGO_OPTIONS } from "../../lib/alterEgo";
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
const archive = {
  path: "/shaolin/wild-for-the-night",
  title: "Wild for the night",
};
const archiveRows: ChronicleListRow[] = [
  ...Array.from({ length: 10 }, (_, index) => ({
    slug: index === 9 ? "wild-for-the-night" : `newer-${index}`,
    url: index === 9 ? archive.path : `/shaolin/newer-${index}`,
    title: index === 9 ? archive.title : `Newer Chronicle ${index}`,
    summary: "Published archive entry",
    date: `2026-10-${index + 14}T00:00:00.000Z`,
    alterEgo: "mark2" as const,
    tags: [],
    infinityStone: false,
  })),
  {
    slug: probe.slug,
    url: `/shaolin/${probe.slug}`,
    title: probe.title,
    summary: "The retained publication regression probe",
    date: "2026-10-13T00:00:00.000Z",
    alterEgo: "mark2",
    tags: [],
    infinityStone: false,
  },
];
function archiveMarkup(rows = archiveRows) {
  return renderToStaticMarkup(
    createElement(ChronicleListClient, { rows, alterEgos: ALTER_EGO_OPTIONS }),
  );
}
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
    const body = path === "/shaolin" ? archiveMarkup() : page;
    return new Response(
      typeof change[path] === "string" ? change[path] : body,
      { headers: { "content-type": "text/html; charset=utf-8" } },
    );
  });
  return fetcher;
}
test("checks revision, rendered content, all images including optimized sources and listing", async () => {
  const read = fixture();
  await expect(
    checkPublicationHealth(read, sha, archive),
  ).resolves.toBeUndefined();
  for (const asset of probe.assets) expect(read).toHaveBeenCalledWith(asset);
  expect(
    read.mock.calls.filter(([path]) => path.startsWith("/_next/image")),
  ).toHaveLength(6);
});
test("accepts the rendered ten-post archive with Appleton East on page two", async () => {
  const listing = archiveMarkup();
  expect(listing).not.toContain(`/shaolin/${probe.slug}`);
  expect(listing).toContain("Page 1 of 2");
  expect((listing.match(/<tr\b/g) ?? []).length).toBe(11); // Header plus ten entries.
  const read = fixture({ "/shaolin": listing });
  await expect(
    checkPublicationHealth(read, sha, archive),
  ).resolves.toBeUndefined();
  expect(read).toHaveBeenCalledWith(`/shaolin/${probe.slug}`);
});

const expectedLink = `<a href="${archive.path}">${archive.title}</a>`;
const emptyArchive = archiveMarkup([]);
test.each([
  ["empty archive", emptyArchive],
  ["stale archive", archiveMarkup(archiveRows.slice(0, 9))],
  ["wrong path", archiveMarkup().replaceAll(archive.path, "/shaolin/wrong")],
  ["wrong title", archiveMarkup().replaceAll(archive.title, "Wrong title")],
  [
    "title substring",
    archiveMarkup().replaceAll(archive.title, `Old ${archive.title}`),
  ],
  ["script", `${emptyArchive}<script>${archiveMarkup()}</script>`],
  [
    "Flight payload",
    `${emptyArchive}<script>self.__next_f.push(${JSON.stringify(archiveMarkup())})</script>`,
  ],
  ["comment", `${emptyArchive}<!--${archiveMarkup()}-->`],
  ["navigation", `<nav>${expectedLink}</nav>${emptyArchive}`],
  [
    "Latest metric",
    `<section aria-label="Chronicle metrics">Latest ${expectedLink}</section>${emptyArchive}`,
  ],
  [
    "archive controls",
    `<div aria-label="Chronicles archive">${expectedLink}${emptyArchive}</div>`,
  ],
  [
    "table caption",
    emptyArchive.replace("<thead", `<caption>${expectedLink}</caption><thead`),
  ],
])("rejects %s as archive publication evidence", async (_kind, listing) => {
  await expect(
    checkPublicationHealth(fixture({ "/shaolin": listing }), sha, archive),
  ).rejects.toMatchObject({
    message: "code.health-publication-listing",
    status: 200,
    publication: { path: "/shaolin", condition: "listing-mismatch" },
  });
});
test("archive title comparison decodes React entities once", async () => {
  const title = `It's <ready> &amp; published`;
  const rows = archiveRows.map((row) =>
    row.url === archive.path ? { ...row, title } : row,
  );
  await expect(
    checkPublicationHealth(fixture({ "/shaolin": archiveMarkup(rows) }), sha, {
      ...archive,
      title,
    }),
  ).resolves.toBeUndefined();
  await expect(
    checkPublicationHealth(fixture({ "/shaolin": archiveMarkup(rows) }), sha, {
      ...archive,
      title: `It's <ready> & published`,
    }),
  ).rejects.toThrow("code.health-publication-listing");
});
test("retained rollback content checks do not substitute an unknown native build revision for provider identity", async () => {
  const read = fixture({ sha: "unknown" });
  await expect(
    checkPublicationHealth(read, undefined, archive),
  ).resolves.toBeUndefined();
  expect(read).not.toHaveBeenCalledWith("/api/__version");
  await expect(
    checkPublicationHealth(fixture({ sha: "unknown" }), sha, archive),
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
      await codeGuard(guard, () => checkPublicationHealth(read, sha, archive));
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
  await expect(
    checkPublicationHealth(fixture(change), sha, archive),
  ).rejects.toThrow(/^code\.health-/);
});
test("external optimized image sources are rejected without requesting them", async () => {
  const read = fixture({
    "/shaolin/appleton-east": `<h1>Oct 13, 2026: ${probe.title}</h1>${probe.text.join(" ")}${probe.folders.map(() => '<button data-testid="folder-carousel-thumbnail"></button>').join("")}<img src="https://evil.example/_next/image?url=${encodeURIComponent(rendered[0])}" /><script>${JSON.stringify(probe.assets)}</script>`,
  });
  await expect(checkPublicationHealth(read, sha, archive)).rejects.toThrow(
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
const apostropheSentence =
  "This week's work made releases more automated and easier to trust:";
function candidatePage(
  source: string[],
  page: string,
  title = "under pressure",
  date = "2026-10-18",
) {
  const read = jest.fn(
    async () =>
      new Response(page, {
        headers: { "content-type": "text/html" },
      }),
  );
  const plan = {
    chronicles: [
      { path: "/shaolin/under-pressure", title, date, text: source },
    ],
    assets: [],
  };
  return { read, plan, check: () => checkChangedPublicationHealth(read, plan) };
}
function reactPage(source: string[], title = "under pressure") {
  return renderToStaticMarkup(
    createElement(
      "article",
      null,
      createElement("h1", null, `Oct 18, 2026: ${title}`),
      ...source.map((value, index) =>
        createElement("p", { key: index }, value),
      ),
    ),
  );
}
test("accepts the exact under pressure publication rendered by React", async () => {
  const page = reactPage([apostropheSentence]);
  expect(page).toContain("<h1>Oct 18, 2026: under pressure</h1>");
  expect(page).toContain("This week&#x27;s work");
  await expect(
    candidatePage([apostropheSentence], page).check(),
  ).resolves.toBeUndefined();
});
test("compares React quotes, ampersands and escaped angles in headings and samples", async () => {
  const title = `"It's <ready> & published"`;
  const source = [apostropheSentence, `Quotes: "it's <ready> & © café 🎉".`];
  await expect(
    candidatePage(source, reactPage(source, title), title).check(),
  ).resolves.toBeUndefined();
});
test.each([
  [
    "decimal",
    "&#34;it&#39;s &#60;ready&#62; &#38; &#169; caf&#233; &#127881;&#34;",
  ],
  [
    "hexadecimal",
    "&#x22;it&#x27;s &#x3c;ready&#x3e; &#x26; &#xa9; caf&#xe9; &#x1f389;&#x22;",
  ],
  [
    "uppercase hexadecimal",
    "&#X22;it&#X27;s &#X3C;ready&#X3E; &#X26; &#XA9; caf&#XE9; &#X1F389;&#X22;",
  ],
  ["named", "&quot;it&apos;s &lt;ready&gt; &amp; &copy; caf&eacute; 🎉&quot;"],
])("normalizes %s entities in headings and samples", async (_kind, encoded) => {
  const sample = `"it's <ready> & © café 🎉"`;
  await expect(
    candidatePage(
      [sample],
      `<h1>Oct 18, 2026: ${encoded}</h1><p>${encoded}</p>`,
      sample,
    ).check(),
  ).resolves.toBeUndefined();
});
test("collapses whitespace after decoding HTML spaces", async () => {
  await expect(
    candidatePage(
      ["Spaced text stays visible"],
      "<h1>Oct 18, 2026: under pressure</h1><p>Spaced&nbsp;text&#32;stays&#x20;visible</p>",
    ).check(),
  ).resolves.toBeUndefined();
});
test("decodes rendered entities once and keeps encoded literal tags visible", async () => {
  const title = "literal &amp; &#x27;";
  const source = [
    "Keep &amp; &#39; &#x27; &apos; &lt; &unknown; literal.",
    "<script>Visible literal text</script>",
    "<!-- Visible literal comment -->",
  ];
  const candidate = candidatePage(source, reactPage(source, title), title);
  await expect(candidate.check()).resolves.toBeUndefined();
  expect(candidate.plan.chronicles[0].text).toEqual(source);
});
test("does not decode source expectations to accept genuinely different text", async () => {
  await expect(
    candidatePage(
      ["Keep &amp; literal."],
      reactPage(["Keep & literal."]),
    ).check(),
  ).rejects.toMatchObject({
    message: "code.health-publication",
    publication: {
      path: "/shaolin/under-pressure",
      condition: "text-mismatch",
      textSampleIndex: 0,
    },
  });
});
test.each([
  [
    "missing sample",
    "<h1>Oct 18, 2026: under pressure</h1><p>Stale content</p>",
    "2026-10-18",
    "text-mismatch",
  ],
  [
    "wrong heading",
    "<h1>Oct 18, 2026: old title</h1>",
    "2026-10-18",
    "heading-mismatch",
  ],
  [
    "wrong rendered date",
    "<h1>Oct 17, 2026: under pressure</h1>",
    "2026-10-18",
    "heading-mismatch",
  ],
  [
    "wrong expected date",
    "<h1>Oct 18, 2026: under pressure</h1>",
    "2026-10-19",
    "heading-mismatch",
  ],
  [
    "invalid expected date",
    "<h1>Oct 18, 2026: under pressure</h1>",
    "invalid",
    "invalid-date",
  ],
  [
    "missing heading",
    "<h2>Oct 18, 2026: under pressure</h2>",
    "2026-10-18",
    "heading-mismatch",
  ],
])(
  "rejects %s with a bounded condition",
  async (_kind, page, date, condition) => {
    await expect(
      candidatePage([apostropheSentence], page, "under pressure", date).check(),
    ).rejects.toMatchObject({
      message: "code.health-publication",
      status: 200,
      publication: { path: "/shaolin/under-pressure", condition },
    });
  },
);
test.each(["comment", "script", "style", "textarea", "attribute"])(
  "text only inside %s does not satisfy publication",
  async (container) => {
    const encoded =
      "This week&#x27;s work made releases more automated and easier to trust:";
    const hidden =
      container === "comment"
        ? `<!--${encoded}-->`
        : container === "attribute"
          ? `<p title="${encoded}"></p>`
          : `<${container}>${encoded}</${container}>`;
    await expect(
      candidatePage(
        [apostropheSentence],
        `<h1>Oct 18, 2026: under pressure</h1>${hidden}`,
      ).check(),
    ).rejects.toMatchObject({
      publication: { condition: "text-mismatch" },
    });
  },
);
test.each(["comment", "script", "style", "textarea"])(
  "heading only inside %s does not satisfy publication",
  async (container) => {
    const heading = "<h1>Oct 18, 2026: under pressure</h1>";
    const hidden =
      container === "comment"
        ? `<!--${heading}-->`
        : `<${container}>${heading}</${container}>`;
    await expect(candidatePage([], hidden).check()).rejects.toMatchObject({
      publication: { condition: "heading-mismatch" },
    });
  },
);
test("fixed publication heading, samples and listing share entity normalization", async () => {
  const encode = (value: string) =>
    [...value]
      .map((char) => `&#x${char.codePointAt(0)!.toString(16)};`)
      .join("");
  const read = fixture();
  const page = await (await read(`/shaolin/${probe.slug}`)).text();
  const encodedPage = [probe.title, ...probe.text].reduce(
    (body, value) => body.replace(value, encode(value)),
    page,
  );
  await expect(
    checkPublicationHealth(
      fixture({
        [`/shaolin/${probe.slug}`]: encodedPage,
        "/shaolin": archiveMarkup().replaceAll(
          archive.title,
          encode(archive.title),
        ),
      }),
      sha,
      archive,
    ),
  ).resolves.toBeUndefined();
});
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
