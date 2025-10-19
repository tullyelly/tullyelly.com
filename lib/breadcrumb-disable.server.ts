"use server";

import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { cache } from "react";
import { normalizeUrl, splitPathSegments } from "@/lib/url";

const DISABLE_MARKER = /export\s+const\s+disableGlobalBreadcrumb\s*=\s*true\b/;

type SegmentPattern =
  | { kind: "static"; value: string }
  | { kind: "dynamic" }
  | { kind: "catchall" }
  | { kind: "optionalCatchall" };

type DisableEntry = {
  segments: SegmentPattern[];
};

const APP_DIR = path.join(process.cwd(), "app");

const isRouteFile = (name: string): boolean => {
  if (!/\.(tsx|ts|jsx|js)$/.test(name)) return false;
  return name.startsWith("page.");
};

function parseSegment(name: string): SegmentPattern | null {
  if (!name) return null;
  if (name.startsWith("(") && name.endsWith(")")) {
    return null;
  }
  if (name.startsWith("@")) {
    return null;
  }
  if (name.startsWith("[[...") && name.endsWith("]]")) {
    return { kind: "optionalCatchall" };
  }
  if (name.startsWith("[...") && name.endsWith("]")) {
    return { kind: "catchall" };
  }
  if (name.startsWith("[") && name.endsWith("]")) {
    return { kind: "dynamic" };
  }
  return { kind: "static", value: name };
}

async function fileIncludesDisableMarker(filePath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return DISABLE_MARKER.test(content);
  } catch {
    return false;
  }
}

async function walkRoutes(
  dir: string,
  segmentStack: SegmentPattern[],
  entries: DisableEntry[],
): Promise<void> {
  let dirents;
  try {
    dirents = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const dirent of dirents) {
    if (dirent.isDirectory()) {
      const parsed = parseSegment(dirent.name);
      const nextSegments =
        parsed === null ? segmentStack : [...segmentStack, parsed];
      await walkRoutes(path.join(dir, dirent.name), nextSegments, entries);
      continue;
    }

    if (!dirent.isFile()) continue;
    if (!isRouteFile(dirent.name)) continue;

    const filePath = path.join(dir, dirent.name);
    const hasMarker = await fileIncludesDisableMarker(filePath);
    if (!hasMarker) continue;

    entries.push({ segments: [...segmentStack] });
  }
}

const loadDisableEntries = cache(async (): Promise<DisableEntry[]> => {
  const entries: DisableEntry[] = [];
  await walkRoutes(APP_DIR, [], entries);
  return entries;
});

function matchesStatic(segment: string, pattern: SegmentPattern): boolean {
  return (
    pattern.kind === "static" &&
    segment.toLowerCase() === pattern.value.toLowerCase()
  );
}

function matchPagePattern(
  segments: readonly string[],
  pattern: SegmentPattern[],
): boolean {
  let index = 0;
  for (let i = 0; i < pattern.length; i += 1) {
    const entry = pattern[i];
    const isLast = i === pattern.length - 1;
    switch (entry.kind) {
      case "static":
        if (index >= segments.length) return false;
        if (!matchesStatic(segments[index]!, entry)) return false;
        index += 1;
        break;
      case "dynamic":
        if (index >= segments.length) return false;
        index += 1;
        break;
      case "catchall":
        if (!isLast) return false;
        if (index >= segments.length) return false;
        index = segments.length;
        break;
      case "optionalCatchall":
        if (!isLast) return false;
        index = segments.length;
        break;
    }
  }
  return index === segments.length;
}

export async function shouldDisableGlobalBreadcrumb(
  pathname: string,
): Promise<boolean> {
  const entries = await loadDisableEntries();
  if (!entries.length) return false;
  const normalized = normalizeUrl(pathname);
  const segments = splitPathSegments(normalized);

  for (const entry of entries) {
    if (matchPagePattern(segments, entry.segments)) {
      if (process.env.NODE_ENV !== "production") {
        console.log(
          "[breadcrumb:disable] route disabled via page export:",
          normalized,
        );
      }
      return true;
    }
  }

  return false;
}
