const mockIncoming = jest.fn(),
  mockOutgoing = jest.fn(),
  mockAliases = jest.fn(),
  mockHomie = jest.fn(),
  mockClan = jest.fn();
jest.mock("@/lib/collection-motivations", () => ({
  listCollectionsInspiredBy: (...args: unknown[]) => mockIncoming(...args),
  listCollectionInspirations: (...args: unknown[]) => mockOutgoing(...args),
}));
jest.mock("@/lib/identity-server", () => ({
  listTypedIdentityRelations: (...args: unknown[]) => mockAliases(...args),
}));
jest.mock("@/lib/data/tcdb", () => ({
  getHomieTcdbRankingByRouteKey: (...args: unknown[]) => mockHomie(...args),
}));
jest.mock("@/lib/data/tcdb-clans", () => ({
  getTcdbClanRankingsBySlug: (...args: unknown[]) => mockClan(...args),
}));
import { loadCollectionRelationshipData } from "@/lib/collection-relationship-data";
const identity = (id: number, slug: string, role = "homie") => ({
  id,
  slug,
  displayName: slug,
  href: null,
  meta: {},
  metadata: {
    kind: role === "clan" ? "group" : "person",
    contexts: { cardattack: { role } },
  },
});
const motivation = (id = "1", role = "homie") => ({
  id,
  subject: identity(6, "king-james", role),
  person: identity(1, "lulu", "fam"),
  reasons: [
    { code: "favorite_player", explanation: "He was her favorite player." },
  ],
  meta: {},
});
beforeEach(() => {
  delete process.env.NEXT_PHASE;
  mockIncoming.mockReset().mockResolvedValue([]);
  mockOutgoing.mockReset().mockResolvedValue([]);
  mockAliases.mockReset().mockResolvedValue([]);
  mockHomie.mockReset().mockResolvedValue(null);
  mockClan.mockReset().mockResolvedValue([]);
});
afterEach(() => {
  delete process.env.NEXT_PHASE;
  jest.restoreAllMocks();
});
test("person sections use direct incoming facts and individual dated snapshots", async () => {
  mockIncoming.mockResolvedValue([motivation()]);
  mockHomie.mockResolvedValue({ card_count: 400, ranking_at: "2026-11-15" });
  const data = await loadCollectionRelationshipData("lulu", "person");
  expect(data.entries[0].counts).toEqual([
    { label: "Cards", cardCount: 400, rankingAt: "2026-11-15" },
  ]);
  expect(mockIncoming).toHaveBeenCalledWith("lulu");
  expect(mockOutgoing).not.toHaveBeenCalled();
});
test("subject sections use outgoing people without requesting their card counts", async () => {
  mockOutgoing.mockResolvedValue([motivation()]);
  const data = await loadCollectionRelationshipData("king-james", "subject");
  expect(data.entries[0].motivation.person.slug).toBe("lulu");
  expect(mockHomie).not.toHaveBeenCalled();
  expect(mockIncoming).not.toHaveBeenCalled();
});
test("team snapshots retain separate sport/date contexts without an aggregate", async () => {
  mockIncoming.mockResolvedValue([motivation("1", "clan")]);
  mockClan.mockResolvedValue([
    { sport: "basketball", card_count: 100, ranking_at: "2026-11-14" },
    { sport: "baseball", card_count: 200, ranking_at: "2026-11-15" },
  ]);
  const data = await loadCollectionRelationshipData("lulu", "person");
  expect(data.entries[0].counts).toHaveLength(2);
  expect(data.entries[0].counts.map((c) => c.cardCount)).toEqual([100, 200]);
});
test("missing and unsupported counts do not become zero or lose reasons", async () => {
  mockIncoming.mockResolvedValue([motivation(), motivation("2", "artist")]);
  const data = await loadCollectionRelationshipData("lulu", "person");
  expect(data.entries.every((e) => e.counts.length === 0)).toBe(true);
  expect(data.entries[0].motivation.reasons[0].explanation).toBe(
    "He was her favorite player.",
  );
});
test("count outages retain valid facts; malformed facts become unavailable, never an empty success", async () => {
  jest.spyOn(console, "warn").mockImplementation(() => undefined);
  mockIncoming.mockResolvedValue([motivation()]);
  mockHomie.mockRejectedValue(new Error("offline"));
  expect(
    (await loadCollectionRelationshipData("lulu", "person")).available,
  ).toBe(true);
  mockIncoming.mockRejectedValue(new Error("bad reason"));
  mockAliases.mockRejectedValue(new Error("bad alias"));
  expect(await loadCollectionRelationshipData("lulu", "person")).toEqual({
    available: false,
    entries: [],
    aliases: [],
  });
});
test("production builds skip all relationship/count reads", async () => {
  process.env.NEXT_PHASE = "phase-production-build";
  expect(
    (await loadCollectionRelationshipData("lulu", "person")).entries,
  ).toEqual([]);
  expect(mockIncoming).not.toHaveBeenCalled();
  expect(mockAliases).not.toHaveBeenCalled();
});
