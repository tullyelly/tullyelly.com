const mockRelations = jest.fn();
const mockAliases = jest.fn();
jest.mock("@/lib/identity-server", () => ({
  listTypedIdentityRelations: (...args: unknown[]) => mockRelations(...args),
}));
jest.mock("@/lib/tag-aliases-server", () => ({
  getTagAliasSnapshot: () => mockAliases(),
}));
import {
  listCollectionInspirations,
  listCollectionsInspiredBy,
} from "@/lib/collection-motivations";
const identity = (id: number, slug: string, kind = "person") => ({
  id,
  slug,
  displayName: slug,
  href: null,
  metadata: { kind, contexts: {} },
  meta: {},
});
const relation = (
  id = "1",
  subject = identity(6, "king-james"),
  person = identity(1, "lulu"),
) => ({
  id,
  type: "collected_because_of",
  source: subject,
  target: person,
  meta: {
    evidence: "reviewed",
    reasons: [
      {
        code: "favorite_player",
        explanation: "He was her favorite player.",
        evidence: "James",
      },
      { code: "shared_name", explanation: "Recorded shared-name explanation." },
    ],
  },
});
beforeEach(() => {
  delete process.env.NEXT_PHASE;
  mockRelations.mockReset().mockResolvedValue([]);
  mockAliases.mockReset().mockResolvedValue(new Map());
});
afterEach(() => delete process.env.NEXT_PHASE);
test("both directions use only direct typed relationships and preserve historical narrative/meta", async () => {
  const edge = relation();
  mockRelations.mockResolvedValue([edge, edge]);
  const out = await listCollectionInspirations("lebron-james");
  expect(out).toHaveLength(1);
  expect(out[0]).toMatchObject({
    subject: { id: 6 },
    person: { id: 1 },
    meta: edge.meta,
    reasons: edge.meta.reasons,
  });
  await listCollectionsInspiredBy("lulu");
  expect(mockRelations.mock.calls).toEqual([
    ["lebron-james", "outgoing", "collected_because_of"],
    ["lulu", "incoming", "collected_because_of"],
  ]);
});
test("many people, subjects and reasons remain separate direct edges", async () => {
  mockRelations.mockResolvedValue([
    relation(),
    relation("2", identity(6, "king-james"), identity(33, "cal")),
    relation("3", identity(8, "team", "group")),
  ]);
  const result = await listCollectionInspirations("king-james");
  expect(result).toHaveLength(3);
  expect(result[0].reasons).toHaveLength(2);
});
test.each([
  "reasons",
  "noncanonical",
  "duplicate-pair",
  "conflicting-id",
  "person",
  "self",
  "subject",
])("rejects broken %s data without inventing facts", async (kind) => {
  const first = relation();
  let rows: unknown[] = [first];
  if (kind === "reasons") first.meta.reasons = [];
  if (kind === "noncanonical")
    mockAliases.mockResolvedValue(new Map([["king-james", "another-tag"]]));
  if (kind === "duplicate-pair") rows = [first, relation("2")];
  if (kind === "conflicting-id")
    rows = [
      first,
      { ...first, meta: { ...first.meta, evidence: "different" } },
    ];
  if (kind === "person") first.target.metadata.kind = "group";
  if (kind === "self") first.target.id = first.source.id;
  if (kind === "subject") first.source.metadata.kind = "name-category";
  mockRelations.mockResolvedValue(rows);
  await expect(listCollectionInspirations("king-james")).rejects.toThrow();
});
test("builds skip all database-dependent helpers and absent relationships stay empty", async () => {
  process.env.NEXT_PHASE = "phase-production-build";
  expect(await listCollectionsInspiredBy("lulu")).toEqual([]);
  expect(mockRelations).not.toHaveBeenCalled();
  expect(mockAliases).not.toHaveBeenCalled();
  delete process.env.NEXT_PHASE;
  expect(await listCollectionsInspiredBy("lulu")).toEqual([]);
});
