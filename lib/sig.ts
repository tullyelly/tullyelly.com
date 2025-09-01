// lib/sig.ts — Deterministic signature helpers for hydration diagnostics

// Deterministic fast hash for JSON-able inputs (stable across SSR/CSR)
export function stableStringify(x: unknown): string {
  if (Array.isArray(x)) return '[' + x.map(stableStringify).join(',') + ']';
  if (x && typeof x === 'object') {
    const o = x as Record<string, unknown>;
    const keys = Object.keys(o).sort();
    return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(o[k])).join(',') + '}';
  }
  if (x instanceof Date) return JSON.stringify(x.toISOString());
  return JSON.stringify(x);
}

export function tinyHash(s: string): string {
  // DJB2 variant in base36
  let h = 5381 >>> 0;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export function signSnapshot(input: unknown): string {
  return tinyHash(stableStringify(input));
}

