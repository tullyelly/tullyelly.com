// lib/storage/persistence.ts
// Standardized helpers around the StorageManager API.
// Use these instead of deprecated webkit* storage/quota APIs.

export type StorageEstimate = {
  usage?: number;
  quota?: number;
  usageDetails?: Record<string, number> | null;
};

/**
 * Returns the current storage estimate using the standardized API.
 * If unavailable, returns an empty object rather than touching deprecated APIs.
 */
export async function getStorageEstimate(): Promise<StorageEstimate> {
  if (typeof navigator === 'undefined') return {};
  const storage = (navigator as any).storage as StorageManager | undefined;
  if (!storage?.estimate) return {};
  try {
    return await storage.estimate();
  } catch {
    return {};
  }
}

/**
 * Requests persistent storage to reduce eviction risk.
 * Returns true if the origin is persisted (either already or after requesting).
 * No-ops safely if the browser does not support it.
 */
export async function ensurePersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;
  const storage = (navigator as any).storage as StorageManager | undefined;
  if (!storage?.persist || !storage.persisted) return false;
  try {
    if (await storage.persisted()) return true;
    return await storage.persist();
  } catch {
    return false;
  }
}

/** Checks if the origin currently has persistent storage. */
export async function isPersistent(): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;
  const storage = (navigator as any).storage as StorageManager | undefined;
  if (!storage?.persisted) return false;
  try {
    return await storage.persisted();
  } catch {
    return false;
  }
}

