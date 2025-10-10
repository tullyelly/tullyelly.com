import { describe, it, expect, vi } from "vitest";
import { createFeatureGate } from "@/lib/menu/featureGate";

const makeCapabilities = (keys: string[]) => {
  const set = new Set(keys);
  return {
    has(key: string) {
      return set.has(key);
    },
  };
};

describe("createFeatureGate", () => {
  it("short-circuits when the capability snapshot already includes the feature", async () => {
    const capabilities = makeCapabilities(["menu.mark2.admin"]);
    const fallback = vi.fn();

    const gate = createFeatureGate(capabilities, fallback);
    const allowed = await gate("menu.mark2.admin");

    expect(allowed).toBe(true);
    expect(fallback).not.toHaveBeenCalled();
  });

  it("falls back to the live checker and caches the result", async () => {
    const capabilities = makeCapabilities([]);
    const fallback = vi.fn().mockResolvedValue(true);

    const gate = createFeatureGate(capabilities, fallback);

    expect(await gate("menu.mark2.admin")).toBe(true);
    expect(await gate("menu.mark2.admin")).toBe(true);
    expect(fallback).toHaveBeenCalledTimes(1);
  });

  it("returns false when both snapshot and fallback deny access", async () => {
    const capabilities = makeCapabilities([]);
    const fallback = vi.fn().mockRejectedValue(new Error("nope"));

    const gate = createFeatureGate(capabilities, fallback);
    expect(await gate("menu.mark2.admin")).toBe(false);
    expect(fallback).toHaveBeenCalledTimes(1);
  });
});
