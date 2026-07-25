/** @jest-environment node */

const queryMock = jest.fn();
const unstableCacheMock = jest.fn(
  (
    loader: () => Promise<unknown>,
    keyParts: string[],
    _options?: unknown,
  ) => {
    const wrapped = () => loader();
    Object.assign(wrapped, { keyParts });
    return wrapped;
  },
);

jest.mock("@/db/pool", () => ({
  getPool: () => ({ query: queryMock }),
}));
jest.mock("next/cache", () => ({
  unstable_cache: (
    loader: () => Promise<unknown>,
    keyParts: string[],
    options: unknown,
  ) => unstableCacheMock(loader, keyParts, options),
}));

import { getEffectivePolicy } from "@/lib/authz/resolve";

describe("authz policy cache", () => {
  beforeEach(() => {
    queryMock.mockReset();
    unstableCacheMock.mockClear();
  });

  it("keys cached policy snapshots by the current database revision", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ revision: 7 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            key: "tcdb.homie.update",
            effect: "allow",
            enabled: true,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ revision: 7 }] });

    const policy = await getEffectivePolicy(
      "3139edc3-2957-4804-aabc-814070eab5d2",
    );

    expect(unstableCacheMock).toHaveBeenCalledWith(
      expect.any(Function),
      ["authz-policy", "3139edc3-2957-4804-aabc-814070eab5d2", "revision:7"],
      {
        tags: ["auth:user:3139edc3-2957-4804-aabc-814070eab5d2"],
      },
    );
    expect(policy.allow).toContain("tcdb.homie.update");
    expect(policy.enabled).toContain("tcdb.homie.update");
  });

  it("uses a new cache key after the policy revision changes", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ revision: 7 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ revision: 7 }] })
      .mockResolvedValueOnce({ rows: [{ revision: 8 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ revision: 8 }] });

    await getEffectivePolicy("3139edc3-2957-4804-aabc-814070eab5d2");
    await getEffectivePolicy("3139edc3-2957-4804-aabc-814070eab5d2");

    expect(unstableCacheMock.mock.calls[0]?.[1]).toContain("revision:7");
    expect(unstableCacheMock.mock.calls[1]?.[1]).toContain("revision:8");
  });
});
