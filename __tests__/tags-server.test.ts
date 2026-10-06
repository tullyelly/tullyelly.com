/** @jest-environment node */
const sqlMock = jest.fn();
jest.mock("server-only", () => ({}));
jest.mock("@/lib/db", () => ({
  sql: (...args: unknown[]) => sqlMock(...args),
}));
import { getTagMetadataBatch, getTagMetadataSnapshot } from "@/lib/tags-server";

const row = (
  slug: string,
  href: string | null,
  href_kind = "tag",
  is_clickable = true,
) => ({
  slug,
  href,
  href_kind,
  is_clickable,
  display_name: "Stored label",
  meta: {},
});

describe("canonical server tag metadata", () => {
  beforeEach(() => {
    sqlMock.mockReset();
    delete process.env.NEXT_PHASE;
  });
  afterEach(() => {
    delete process.env.NEXT_PHASE;
  });

  it("batches normalized slugs, including missing rows, without querying per tag", async () => {
    sqlMock.mockResolvedValue([row("gang-starr", "/stored")]);
    const metadata = await getTagMetadataBatch([
      " Gang  Starr ",
      "GANG STARR",
      " A/B & C ",
      "lulu",
    ]);
    expect(sqlMock).toHaveBeenCalledTimes(1);
    expect([...metadata.keys()]).toEqual(["gang-starr", "a/b-&-c", "lulu"]);
    expect(metadata.get("gang-starr")).toMatchObject({
      href: "/stored",
      displayName: "Stored label",
    });
    expect(metadata.get("a/b-&-c")?.href).toBe("/shaolin/tags/a%2Fb-%26-c");
    expect(metadata.get("lulu")?.href).toBe("/shaolin/tags/lulu");
  });

  it.each([
    "tag",
    "persona",
    "squad",
    "homie",
    "clan",
    "custom",
    "external",
    "future-kind",
  ])("uses stored href for %s", async (kind) => {
    sqlMock.mockResolvedValue([
      row("tag", " https://example.com/stored ", kind),
    ]);
    expect((await getTagMetadataBatch(["tag"])).get("tag")?.href).toBe(
      "https://example.com/stored",
    );
  });

  it.each([null, "", "  \t\n"])(
    "uses only the archive fallback for absent href %p",
    async (href) => {
      sqlMock.mockResolvedValue([
        row("homie", href, "homie"),
        row("clan", href, "clan"),
      ]);
      const metadata = await getTagMetadataBatch(["homie", "clan"]);
      expect(metadata.get("homie")?.href).toBe("/shaolin/tags/homie");
      expect(metadata.get("clan")?.href).toBe("/shaolin/tags/clan");
    },
  );

  it.each([
    ["none", true],
    ["homie", false],
  ] as const)(
    "preserves intentional disabling: %s %s",
    async (kind, clickable) => {
      sqlMock.mockResolvedValue([row("disabled", "/stored", kind, clickable)]);
      expect(
        (await getTagMetadataBatch(["disabled"])).get("disabled"),
      ).toMatchObject({ href: null, isClickable: false });
    },
  );

  it("logs unavailable metadata and supplies archive fallback", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    sqlMock.mockRejectedValue(new Error("unavailable"));
    expect((await getTagMetadataBatch(["lulu"])).get("lulu")?.href).toBe(
      "/shaolin/tags/lulu",
    );
    expect(warn).toHaveBeenCalledWith(
      "[tags] Failed to resolve tag metadata",
      expect.any(Error),
    );
    warn.mockRestore();
  });

  it("does not query during production builds or for empty batches", async () => {
    expect((await getTagMetadataBatch([])).size).toBe(0);
    process.env.NEXT_PHASE = "phase-production-build";
    expect((await getTagMetadataSnapshot()).size).toBe(0);
    expect((await getTagMetadataBatch(["lulu"])).get("lulu")?.href).toBe(
      "/shaolin/tags/lulu",
    );
    expect(sqlMock).not.toHaveBeenCalled();
  });
});
