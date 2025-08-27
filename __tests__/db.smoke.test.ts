jest.mock('@/db/pool', () => ({
  getPool: () => ({
    query: (sql: string) => {
      if (sql.includes('current_database')) {
        return Promise.resolve({ rows: [{ current_database: 'test' }] });
      }
      return Promise.resolve({ rows: [{ result: 1 }] });
    },
  }),
}));

import { getPool } from '@/db/pool';

describe('database smoke test', () => {
  it('SELECT 1 returns 1', async () => {
    const { rows } = await getPool().query<{ result: number }>('SELECT 1 as result');
    expect(rows[0].result).toBe(1);
  });

  it('reports current database name', async () => {
    const { rows } = await getPool().query<{ current_database: string }>(
      'SELECT current_database()'
    );
    expect(rows[0].current_database).toBe('test');
  });
});
