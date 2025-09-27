describe("getPool", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("uses in-memory pool when E2E_MODE enabled", async () => {
    process.env.E2E_MODE = "1";
    let queryPromise: Promise<any> | undefined;
    const promises: Array<Promise<any>> = [];

    jest.isolateModules(() => {
      const { getPool } = require("@/db/pool");
      const pool = getPool();
      expect(typeof pool.query).toBe("function");
      queryPromise = pool.query("SELECT * FROM dojo.v_shaolin_scrolls");

      promises.push(
        pool.query({
          text: "SELECT COUNT(*) FROM dojo.v_shaolin_scrolls",
        }),
      );
      promises.push(
        pool.query({
          text: "SELECT * FROM dojo.v_shaolin_scrolls WHERE id = $1",
          values: [1],
        }),
      );
      promises.push(pool.query("SELECT 1"));
      promises.push(pool.query("SELECT * FROM nowhere"));
    });

    const result = await queryPromise!;
    expect(result.rows).toHaveLength(1);

    const [countResult, singleResult, selectOne, fallbackResult] =
      await Promise.all(promises);
    expect(countResult.rows[0]).toHaveProperty("total", 1);
    expect(singleResult.rowCount).toBe(1);
    expect(selectOne.rows[0]).toHaveProperty("?column?", 1);
    expect(fallbackResult.rows).toEqual([]);
  });

  test("initialises pg Pool when database url is present", () => {
    const fakePool = { query: jest.fn(), end: jest.fn() };
    const PoolMock = jest.fn(() => fakePool);

    jest.doMock("pg", () => ({ Pool: PoolMock }));
    const assertValidDatabaseUrl = jest.fn();
    jest.doMock("@/db/assert-database-url", () => ({ assertValidDatabaseUrl }));

    process.env.E2E_MODE = "0";
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/test_db";

    jest.isolateModules(() => {
      const { getPool } = require("@/db/pool");
      const pool = getPool();

      expect(assertValidDatabaseUrl).toHaveBeenCalledWith(
        "postgres://user:pass@localhost:5432/test_db",
      );
      expect(PoolMock).toHaveBeenCalledWith({
        connectionString: "postgres://user:pass@localhost:5432/test_db",
        ssl: { rejectUnauthorized: false },
      });
      expect(pool).toBe(fakePool);

      // Module-level singleton should reuse the first pool instance.
      const again = getPool();
      expect(again).toBe(pool);
    });
  });
});
