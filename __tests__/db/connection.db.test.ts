import { withClient } from '@/app/lib/db';

describe('database smoke test', () => {
  it('SELECT 1 returns 1', async () => {
    await withClient(async (query) => {
      const { rows } = await query('SELECT 1 as result');
      expect(rows[0].result).toBe(1);
    });
  });

  it('reports current database name', async () => {
    await withClient(async (query) => {
      const { rows } = await query('SELECT current_database()');
      expect(typeof rows[0].current_database).toBe('string');
      expect(rows[0].current_database.length).toBeGreaterThan(0);
    });
  });
});
