/** @jest-environment node */
import { POST, PATCH } from "@/app/api/cardattack/categories/snapshots/route";
import {
  AuthzForbiddenError,
  AuthzUnauthenticatedError,
} from "@/lib/authz/types";
const mockMust = jest.fn();
const mockUser = jest.fn();
const mockPool = jest.fn();
const mockConnect = jest.fn();
const mockQuery = jest.fn();
const mockRelease = jest.fn();
const mockTag = jest.fn();
const mockPath = jest.fn();
jest.mock("@/lib/authz", () => ({
  must: (...args: unknown[]) => mockMust(...args),
}));
jest.mock("@/lib/auth/session", () => ({ getCurrentUser: () => mockUser() }));
jest.mock("@/db/pool", () => ({ getPool: () => mockPool() }));
jest.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => mockTag(...args),
  revalidatePath: (...args: unknown[]) => mockPath(...args),
}));
const input = {
  category: "basketball",
  measured_on: "2024-10-20",
  card_count: 12125,
};
function request(body: unknown) {
  return new Request(
    "https://example.test/api/cardattack/categories/snapshots",
    { method: "POST", body: JSON.stringify(body) },
  );
}
const existing = {
  id: "9",
  category_id: "1",
  slug: "basketball",
  measured_on: "2024-10-10",
  card_count: 12050,
};
beforeEach(() => {
  jest.resetAllMocks();
  mockUser.mockResolvedValue({ id: "actor" });
  mockMust.mockResolvedValue(undefined);
  mockPool.mockReturnValue({ connect: mockConnect });
  mockConnect.mockResolvedValue({ query: mockQuery, release: mockRelease });
  mockQuery.mockImplementation(async (sql: string) => {
    if (sql.startsWith("SELECT id::text"))
      return { rows: [{ id: "1", slug: "basketball" }] };
    if (sql.includes("FOR UPDATE")) return { rows: [existing] };
    if (sql.includes("INSERT INTO dojo.card_category_snapshot"))
      return { rows: [{ id: "9" }] };
    return { rows: [] };
  });
});
it.each([false, true])(
  "saves with audit before commit and invalidates after commit (correction %p)",
  async (correction) => {
    const response = await (correction
      ? PATCH(request({ snapshot_id: "9", card_count: 12060 }))
      : POST(request(input)));
    expect(response.status).toBe(correction ? 200 : 201);
    expect(await response.json()).toEqual({
      id: "9",
      status: "ok",
      freshness: "fresh",
    });
    expect(mockMust).toHaveBeenCalledWith(
      { id: "actor" },
      correction
        ? "tcdb.category.snapshot.correct"
        : "tcdb.category.snapshot.create",
      { strict: true },
    );
    const calls = mockQuery.mock.calls as [string, unknown[]?][];
    const auditIndex = calls.findIndex(([sql]) =>
      sql.includes("INSERT INTO dojo.audit_log"),
    );
    const commitIndex = calls.findIndex(([sql]) => sql === "COMMIT");
    expect(auditIndex).toBeLessThan(commitIndex);
    const metadata = JSON.parse(String(calls[auditIndex][1]?.[2]));
    expect(metadata).toMatchObject({
      before_count: correction ? 12050 : null,
      after_count: correction ? 12060 : 12125,
      target_id: "9",
    });
    expect(mockQuery.mock.invocationCallOrder[commitIndex]).toBeLessThan(
      mockTag.mock.invocationCallOrder[0],
    );
    expect(mockTag).toHaveBeenCalledWith("card-category-snapshots", {
      expire: 0,
    });
    expect(mockPath.mock.calls.map(([path]) => path)).toEqual([
      "/cardattack/categories",
      "/shaolin",
      "/unclejimmy/bricks",
    ]);
    expect(mockRelease).toHaveBeenCalledTimes(1);
  },
);
it.each([
  new AuthzUnauthenticatedError(),
  new AuthzForbiddenError(),
  new Error("policy unavailable"),
])("denies before acquiring a client: %p", async (error) => {
  mockMust.mockRejectedValue(error);
  for (const handler of [POST, PATCH])
    expect((await handler(request(input))).status).toBe(
      error instanceof AuthzUnauthenticatedError
        ? 401
        : error instanceof AuthzForbiddenError
          ? 403
          : 503,
    );
  expect(mockConnect).not.toHaveBeenCalled();
});
it("rejects malformed JSON and input without a transaction", async () => {
  expect(
    (
      await POST(
        new Request("https://example.test", { method: "POST", body: "{" }),
      )
    ).status,
  ).toBe(400);
  expect((await POST(request({ ...input, card_count: -1 }))).status).toBe(400);
  expect(
    (await PATCH(request({ snapshot_id: "invalid", card_count: 0 }))).status,
  ).toBe(400);
  expect(mockConnect).not.toHaveBeenCalled();
});
it("returns a duplicate conflict, rolls back, and never overwrites or invalidates", async () => {
  const original = mockQuery.getMockImplementation()!;
  mockQuery.mockImplementation((sql: string, args: unknown[]) =>
    sql.includes("INSERT INTO dojo.card_category_snapshot")
      ? Promise.reject({
          code: "23505",
          constraint: "card_category_snapshot_category_date_key",
        })
      : original(sql, args),
  );
  const response = await POST(request(input));
  expect(response.status).toBe(409);
  expect(await response.json()).toEqual({ error: "SNAPSHOT_ALREADY_EXISTS" });
  expect(mockQuery).toHaveBeenCalledWith("ROLLBACK");
  expect(mockQuery.mock.calls.some(([sql]) => sql.startsWith("UPDATE"))).toBe(
    false,
  );
  expect(mockQuery.mock.calls.some(([sql]) => sql === "COMMIT")).toBe(false);
  expect(mockTag).not.toHaveBeenCalled();
});
it.each(["insert", "audit", "connect", "pool"])(
  "returns a persistence failure without false success: %s",
  async (failure) => {
    const original = mockQuery.getMockImplementation()!;
    mockQuery.mockImplementation((sql: string, args: unknown[]) =>
      sql.includes(
        failure === "audit"
          ? "INSERT INTO dojo.audit_log"
          : "INSERT INTO dojo.card_category_snapshot",
      )
        ? Promise.reject(new Error("fixture failure"))
        : original(sql, args),
    );
    if (failure === "connect")
      mockConnect.mockRejectedValue(new Error("offline"));
    if (failure === "pool")
      mockPool.mockImplementation(() => {
        throw new Error("offline");
      });
    const error = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    expect((await POST(request(input))).status).toBe(503);
    expect(mockQuery.mock.calls.some(([sql]) => sql === "COMMIT")).toBe(false);
    expect(mockTag).not.toHaveBeenCalled();
    error.mockRestore();
  },
);
it.each([false, true])(
  "keeps a committed save truthful if cache expiration fails: correction %p",
  async (correction) => {
    mockTag.mockImplementation(() => {
      throw new Error("cache offline");
    });
    const warn = jest
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const response = await (correction
      ? PATCH(request({ snapshot_id: "9", card_count: 0 }))
      : POST(request({ ...input, card_count: 0 })));
    expect(response.status).toBe(correction ? 200 : 201);
    expect(await response.json()).toMatchObject({
      status: "ok",
      freshness: "pending",
    });
    expect(mockQuery).toHaveBeenCalledWith("COMMIT");
    expect(mockQuery).not.toHaveBeenCalledWith("ROLLBACK");
    warn.mockRestore();
  },
);
it.each([false, true])(
  "returns 404 for unknown identity (correction %p)",
  async (correction) => {
    mockQuery.mockResolvedValue({ rows: [] });
    expect(
      (
        await (correction
          ? PATCH(request({ snapshot_id: "42", card_count: 0 }))
          : POST(request(input)))
      ).status,
    ).toBe(404);
    expect(mockQuery).toHaveBeenCalledWith("ROLLBACK");
    expect(mockTag).not.toHaveBeenCalled();
  },
);

it("does not misreport an audit uniqueness failure as a duplicate measurement", async () => {
  const original = mockQuery.getMockImplementation()!;
  mockQuery.mockImplementation((sql: string, args: unknown[]) =>
    sql.includes("INSERT INTO dojo.audit_log")
      ? Promise.reject({ code: "23505", constraint: "audit_log_pkey" })
      : original(sql, args),
  );
  const error = jest
    .spyOn(console, "error")
    .mockImplementation(() => undefined);
  const response = await POST(request(input));
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ error: "SNAPSHOT_SAVE_FAILED" });
  expect(mockQuery).toHaveBeenCalledWith("ROLLBACK");
  expect(mockQuery).not.toHaveBeenCalledWith("COMMIT");
  expect(mockTag).not.toHaveBeenCalled();
  error.mockRestore();
});

it("creates ranking and count together and audits the recorded rank", async () => {
  expect((await POST(request({ ...input, ranking: 1400 }))).status).toBe(201);
  expect(mockQuery).toHaveBeenCalledWith(
    expect.stringContaining(
      "VALUES ($1::bigint, $2::date, $3::int, $4::int, $5::int)",
    ),
    ["1", input.measured_on, 12125, 1400, null],
  );
  const audit = mockQuery.mock.calls.find(([sql]) =>
    sql.includes("INSERT INTO dojo.audit_log"),
  );
  expect(JSON.parse(audit?.[1][2])).toMatchObject({
    before_ranking: null,
    after_ranking: 1400,
  });
});
it.each([
  { ranking: 1400, expected: 1400 },
  { ranking: null, expected: null },
  { ranking: undefined, expected: 1500 },
])("corrects, clears or preserves rank: %p", async ({ ranking, expected }) => {
  const original = mockQuery.getMockImplementation()!;
  mockQuery.mockImplementation((sql: string, args: unknown[]) =>
    sql.includes("FOR UPDATE")
      ? Promise.resolve({ rows: [{ ...existing, ranking: 1500 }] })
      : original(sql, args),
  );
  expect(
    (await PATCH(request({ snapshot_id: "9", card_count: 12060, ranking })))
      .status,
  ).toBe(200);
  expect(mockQuery).toHaveBeenCalledWith(
    expect.stringContaining(
      "ranking = CASE WHEN $3::boolean THEN $4::int ELSE ranking END",
    ),
    [12060, "9", ranking !== undefined, ranking ?? null, false, null],
  );
  const audit = mockQuery.mock.calls.find(([sql]) =>
    sql.includes("INSERT INTO dojo.audit_log"),
  );
  expect(JSON.parse(audit?.[1][2])).toMatchObject({
    before_ranking: 1500,
    after_ranking: expected,
  });
});
it.each([POST, PATCH])(
  "rejects rank zero before acquiring a transaction client",
  async (handler) => {
    const payload =
      handler === POST ? input : { snapshot_id: "9", card_count: 0 };
    expect((await handler(request({ ...payload, ranking: 0 }))).status).toBe(
      400,
    );
    expect(mockConnect).not.toHaveBeenCalled();
  },
);

it.each([-100, 0, 100])(
  "creates signed difference %p with atomic provenance",
  async (difference) => {
    expect(
      (await POST(request({ ...input, ranking: 1400, difference }))).status,
    ).toBe(201);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining(
        "VALUES ($1::bigint, $2::date, $3::int, $4::int, $5::int)",
      ),
      ["1", input.measured_on, 12125, 1400, difference],
    );
    const audit = mockQuery.mock.calls.find(([sql]) =>
      sql.includes("INSERT INTO dojo.audit_log"),
    );
    expect(JSON.parse(audit?.[1][2])).toMatchObject({
      before_difference: null,
      after_difference: difference,
    });
  },
);
it.each([
  { difference: -50, expected: -50 },
  { difference: 0, expected: 0 },
  { difference: null, expected: null },
  { difference: undefined, expected: -100 },
])(
  "corrects, clears or preserves difference: %p",
  async ({ difference, expected }) => {
    const original = mockQuery.getMockImplementation()!;
    mockQuery.mockImplementation((sql: string, args: unknown[]) =>
      sql.includes("FOR UPDATE")
        ? Promise.resolve({
            rows: [{ ...existing, ranking: 1400, difference: -100 }],
          })
        : original(sql, args),
    );
    expect(
      (
        await PATCH(
          request({ snapshot_id: "9", card_count: 12060, difference }),
        )
      ).status,
    ).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining(
        "difference = CASE WHEN $5::boolean THEN $6::int ELSE difference END",
      ),
      [12060, "9", false, null, difference !== undefined, difference ?? null],
    );
    const audit = mockQuery.mock.calls.find(([sql]) =>
      sql.includes("INSERT INTO dojo.audit_log"),
    );
    expect(JSON.parse(audit?.[1][2])).toMatchObject({
      before_difference: -100,
      after_difference: expected,
      before_ranking: 1400,
      after_ranking: 1400,
    });
  },
);
it.each([POST, PATCH])(
  "rejects overflow difference before acquiring a client",
  async (handler) => {
    const payload =
      handler === POST ? input : { snapshot_id: "9", card_count: 0 };
    expect(
      (await handler(request({ ...payload, difference: 2147483648 }))).status,
    ).toBe(400);
    expect(mockConnect).not.toHaveBeenCalled();
  },
);
