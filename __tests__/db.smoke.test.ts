import { query, endPool } from '@/app/lib/db';

describe('database smoke test', () => {
  it('SELECT 1 returns 1', async () => {
    const { rows } = await query<{ result: number }>('SELECT 1 as result');
    expect(rows[0].result).toBe(1);
  });

  it('reports current database name', async () => {
    const { rows } = await query<{ current_database: string }>('SELECT current_database()');
    // Not asserting exact name; just ensure we got *something* in test env
    expect(typeof rows[0].current_database).toBe('string');
    expect(rows[0].current_database.length).toBeGreaterThan(0);
  });

  afterAll(async () => {
    await endPool();
  });
});