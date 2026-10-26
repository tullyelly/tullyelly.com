import {
  saveCategorySnapshot,
  categorySaveError,
} from "@/lib/client/categorySnapshots";
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});
it.each([false, true])(
  "uses the explicit method and propagates committed freshness (correction %p)",
  async (correction) => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "1", status: "ok", freshness: "pending" }),
    });
    globalThis.fetch = fetchMock;
    const input = correction
      ? { snapshot_id: "1", card_count: 0 }
      : { category: "basketball", measured_on: "2026-10-01", card_count: 0 };
    expect(await saveCategorySnapshot(input)).toMatchObject({
      status: "ok",
      freshness: "pending",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/cardattack/categories/snapshots",
      expect.objectContaining({
        method: correction ? "PATCH" : "POST",
        body: JSON.stringify(input),
      }),
    );
  },
);
it("preserves structured duplicate errors", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ error: "SNAPSHOT_ALREADY_EXISTS" }),
  });
  await expect(
    saveCategorySnapshot({ snapshot_id: "1", card_count: 1 }),
  ).rejects.toEqual({ error: "SNAPSHOT_ALREADY_EXISTS" });
});
it.each([
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "CATEGORY_NOT_FOUND",
  "SNAPSHOT_NOT_FOUND",
  "INVALID_INPUT",
  "SNAPSHOT_ALREADY_EXISTS",
  "SNAPSHOT_SAVE_FAILED",
])("explains %s", (error) =>
  expect(categorySaveError({ error })).not.toMatch(
    /undefined|\[object Object\]/,
  ),
);
it("warns about uncertain network outcomes before retrying", () =>
  expect(categorySaveError(new Error("network"))).toContain(
    "Check history before retrying",
  ));
