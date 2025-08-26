// No-op DB mock. Unit tests should not hit a real database.
export const pool = {
  connect: async () => ({
    query: async () => ({ rows: [], rowCount: 0 }),
    release: () => {}
  }),
  query: async () => ({ rows: [], rowCount: 0 })
};

export async function withClient<T>(fn: (q: (sql: string, params?: any[]) => Promise<any>) => Promise<T>): Promise<T> {
  const q = async () => ({ rows: [], rowCount: 0 });
  return fn(q);
}
