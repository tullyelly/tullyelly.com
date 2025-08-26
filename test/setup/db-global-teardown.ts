export default async function globalTeardown() {
  const ctx = (global as any).__db;
  if (!ctx) return;

  if (ctx.kind === 'pg') {
    if (ctx.pool?.end) { try { await ctx.pool.end(); } catch { /* noop */ } }
    return;
  }

  if (ctx.kind === 'tc') {
    try { if (ctx.pool?.end) await ctx.pool.end(); } catch { /* noop */ }
    try { if (ctx.container?.stop) await ctx.container.stop(); } catch { /* noop */ }
  }
}
