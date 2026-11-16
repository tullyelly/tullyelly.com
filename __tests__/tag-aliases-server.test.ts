/** @jest-environment node */
const mockSqlAliases = jest.fn();
jest.mock("@/lib/db", () => ({
  sql: (...args: unknown[]) => mockSqlAliases(...args),
}));
import {
  getTagAliasSnapshot,
  resolveCanonicalTagSlug,
  listEquivalentTagSlugs,
} from "@/lib/tag-aliases-server";
beforeEach(() => {
  delete process.env.NEXT_PHASE;
  mockSqlAliases.mockReset();
});
afterEach(() => {
  delete process.env.NEXT_PHASE;
  jest.restoreAllMocks();
});
test("request resolution reads only direct aliases and expands both spellings", async () => {
  mockSqlAliases.mockResolvedValue([
    { source_slug: "lebron-james", target_slug: "king-james" },
  ]);
  expect(await resolveCanonicalTagSlug("LeBron James")).toBe("king-james");
  expect(await listEquivalentTagSlugs(["lebron-james", "king-james"])).toEqual([
    "king-james",
    "lebron-james",
  ]);
  const query = mockSqlAliases.mock.calls[0][0].join("");
  expect(query).toContain("relation.relation_type='alias_of'");
  expect(query).not.toContain("LIMIT");
});
test("builds never query aliases", async () => {
  process.env.NEXT_PHASE = "phase-production-build";
  expect((await getTagAliasSnapshot()).size).toBe(0);
  expect(mockSqlAliases).not.toHaveBeenCalled();
});
test.each([new Error("offline"), [{ source_slug: "a", target_slug: "a" }]])(
  "broken data or outage follows the exact-tag fallback",
  async (value) => {
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    if (value instanceof Error) mockSqlAliases.mockRejectedValue(value);
    else mockSqlAliases.mockResolvedValue(value);
    expect(await resolveCanonicalTagSlug("cal")).toBe("cal");
  },
);
