export type CapabilityKey = string;

export interface Capabilities {
  has(key: CapabilityKey): boolean;
  all: Set<string>;
}

function normalize(input: string | null | undefined): string | null {
  if (typeof input !== "string") return null;
  const value = input.trim();
  if (!value) return null;
  return value;
}

function toSet(source: string[] | Set<string> | undefined | null): Set<string> {
  const keys = new Set<string>();
  if (!source) return keys;

  if (Array.isArray(source)) {
    for (const raw of source) {
      const key = normalize(raw);
      if (key) {
        keys.add(key);
      }
    }
    return keys;
  }

  if (source instanceof Set) {
    for (const raw of source) {
      const key = normalize(raw);
      if (key) {
        keys.add(key);
      }
    }
  }

  return keys;
}

export function buildCapabilities(
  input: string[] | Set<string> | undefined | null,
): Capabilities {
  const all = toSet(input);
  return {
    all,
    has(key: CapabilityKey) {
      const normalized = normalize(key);
      if (!normalized) return false;
      return all.has(normalized);
    },
  };
}
