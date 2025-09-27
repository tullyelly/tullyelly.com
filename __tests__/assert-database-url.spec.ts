describe("assertValidDatabaseUrl", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("ignores non-production environments", () => {
    process.env.VERCEL_ENV = "preview";

    const { assertValidDatabaseUrl } = require("@/db/assert-database-url");
    expect(() =>
      assertValidDatabaseUrl("postgres://neondb_owner@host/db"),
    ).not.toThrow();
  });

  test("checks default neon credentials in production", () => {
    process.env.VERCEL_ENV = "production";
    const { assertValidDatabaseUrl } = require("@/db/assert-database-url");

    expect(() =>
      assertValidDatabaseUrl("postgres://neondb_owner@host/neondb"),
    ).not.toThrow();
  });

  test("ignores malformed urls without crashing", () => {
    process.env.VERCEL_ENV = "production";

    const { assertValidDatabaseUrl } = require("@/db/assert-database-url");

    expect(() =>
      assertValidDatabaseUrl("not-a-url" as unknown as string),
    ).not.toThrow();
  });

  test("allows valid production urls", () => {
    process.env.VERCEL_ENV = "production";
    const { assertValidDatabaseUrl } = require("@/db/assert-database-url");

    expect(() =>
      assertValidDatabaseUrl("postgres://tullyelly_admin@host/tullyelly_db"),
    ).not.toThrow();
  });
});
