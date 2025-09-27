jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
}));

const getPoolMock = jest.fn();
jest.mock("@/db/pool", () => ({
  getPool: getPoolMock,
}));

describe("ensureAuthzInvalidationListener", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    getPoolMock.mockReset();
    const { revalidateTag } = require("next/cache");
    revalidateTag.mockReset();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("skips subscribing while running tests", () => {
    process.env.NODE_ENV = "test";

    const {
      ensureAuthzInvalidationListener,
    } = require("@/lib/authz/invalidation");
    ensureAuthzInvalidationListener();
    expect(getPoolMock).not.toHaveBeenCalled();
  });

  test("connects to Postgres and revalidates tags", async () => {
    process.env.NODE_ENV = "development";

    const client = {
      on: jest.fn(),
      query: jest.fn().mockResolvedValue(undefined),
    };
    const connect = jest.fn().mockResolvedValue(client);
    getPoolMock.mockReturnValue({ connect });

    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const {
      ensureAuthzInvalidationListener,
    } = require("@/lib/authz/invalidation");
    ensureAuthzInvalidationListener();
    ensureAuthzInvalidationListener();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getPoolMock).toHaveBeenCalledTimes(1);
    expect(connect).toHaveBeenCalledTimes(1);
    expect(client.query).toHaveBeenCalledWith("LISTEN authz_changed");

    const notificationHandler = client.on.mock.calls.find(
      ([event]) => event === "notification",
    )?.[1];
    const errorHandler = client.on.mock.calls.find(
      ([event]) => event === "error",
    )?.[1];
    expect(notificationHandler).toBeInstanceOf(Function);
    expect(errorHandler).toBeInstanceOf(Function);

    const { revalidateTag } = require("next/cache");
    notificationHandler?.({ channel: "authz_changed", payload: "abc" });
    expect(revalidateTag).toHaveBeenCalledWith("auth:user:abc");

    errorHandler?.(new Error("boom"));

    ensureAuthzInvalidationListener();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(connect).toHaveBeenCalledTimes(2);

    consoleErrorSpy.mockRestore();
  });

  test("ignores pools without connect method", () => {
    process.env.NODE_ENV = "development";
    getPoolMock.mockReturnValue({});

    const {
      ensureAuthzInvalidationListener,
    } = require("@/lib/authz/invalidation");
    ensureAuthzInvalidationListener();
    expect(getPoolMock).toHaveBeenCalledTimes(1);
  });
});
