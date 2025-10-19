describe("env", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  it("prefers DATABASE_URL when provided", () => {
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/main";
    process.env.TEST_DATABASE_URL = "postgres://user:pass@localhost:5432/test";
    jest.isolateModules(() => {
      const { DATABASE_URL } = require("@/lib/env");
      expect(DATABASE_URL).toBe("postgres://user:pass@localhost:5432/main");
    });
  });

  it("falls back to TEST_DATABASE_URL in tests", () => {
    delete process.env.DATABASE_URL;
    process.env.TEST_DATABASE_URL = "postgres://user:pass@localhost:5432/test";
    jest.isolateModules(() => {
      const { DATABASE_URL } = require("@/lib/env");
      expect(DATABASE_URL).toBe("postgres://user:pass@localhost:5432/test");
    });
  });

  it("uses TEST_DATABASE_URL outside the test environment when present", () => {
    delete process.env.DATABASE_URL;
    Object.assign(process.env, { NODE_ENV: "development" });
    process.env.TEST_DATABASE_URL = "postgres://user:pass@localhost:5432/test";
    jest.isolateModules(() => {
      const { DATABASE_URL } = require("@/lib/env");
      expect(DATABASE_URL).toBe("postgres://user:pass@localhost:5432/test");
    });
  });

  it("uses baked-in fallback when nothing is configured", () => {
    delete process.env.DATABASE_URL;
    delete process.env.TEST_DATABASE_URL;
    Object.assign(process.env, { NODE_ENV: "test" });
    jest.isolateModules(() => {
      const { DATABASE_URL } = require("@/lib/env");
      expect(DATABASE_URL).toBe(
        "postgres://user:pass@localhost:5432/tullyelly_test",
      );
    });
  });
});
