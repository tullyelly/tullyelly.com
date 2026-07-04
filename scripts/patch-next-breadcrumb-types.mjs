// Legacy escape hatch for unsupported page-level `breadcrumb` exports.
//
// Do not run this from normal dev/build scripts. Current breadcrumbs are
// source-driven and do not require mutating Next.js internals.

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function ensureBreadcrumbAllowedExports() {
  const targets = [
    resolve(
      process.cwd(),
      "node_modules/next/dist/server/typescript/constant.js",
    ),
    resolve(
      process.cwd(),
      "node_modules/next/dist/esm/server/typescript/constant.js",
    ),
  ];
  let patched = false;
  for (const target of targets) {
    let source;
    try {
      source = readFileSync(target, "utf8");
    } catch {
      continue;
    }
    if (source.includes("'breadcrumb'")) {
      continue;
    }
    const nextContent = source.replace(
      /'generateViewport'\s*\n\s*\];/,
      `'generateViewport',\n    'breadcrumb'\n];`,
    );
    if (nextContent !== source) {
      try {
        writeFileSync(target, nextContent);
        patched = true;
      } catch {
        /* noop */
      }
    }
  }
  if (patched) {
    console.log("✓ Enabled breadcrumb export in Next.js type guard");
  }
}

function patchTypeGuardTemplates() {
  const targets = [
    resolve(
      process.cwd(),
      "node_modules/next/dist/build/webpack/plugins/next-types-plugin/index.js",
    ),
    resolve(
      process.cwd(),
      "node_modules/next/dist/esm/build/webpack/plugins/next-types-plugin/index.js",
    ),
  ];
  let patched = false;
  for (const target of targets) {
    let source;
    try {
      source = readFileSync(target, "utf8");
    } catch {
      continue;
    }
    if (source.includes("breadcrumb?: any")) {
      continue;
    }
    const nextContent = source.replace(
      /metadata\?: any\n  generateMetadata\?: Function/,
      "metadata?: any\n  breadcrumb?: any\n  generateMetadata?: Function",
    );
    if (nextContent !== source) {
      try {
        writeFileSync(target, nextContent);
        patched = true;
      } catch {
        /* noop */
      }
    }
  }
  if (patched) {
    console.log("✓ Updated Next type guard templates for breadcrumb export");
  }
}

function patchRouteTypeDeclarations() {
  const baseDirs = [
    resolve(process.cwd(), ".next/types/app"),
    resolve(process.cwd(), ".next/dev/types/app"),
  ];
  let mutated = false;
  for (const baseDir of baseDirs) {
    const queue = [baseDir];
    while (queue.length > 0) {
      const current = queue.pop();
      if (!current) continue;
      let entries;
      try {
        entries = readdirSync(current, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const entry of entries) {
        const entryPath = resolve(current, entry.name);
        if (entry.isDirectory()) {
          queue.push(entryPath);
          continue;
        }
        if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;
        let source;
        try {
          source = readFileSync(entryPath, "utf8");
        } catch {
          continue;
        }
        if (source.includes("breadcrumb?:")) continue;
        const nextContent = source.replace(
          /(\n\s+metadata\?: any\s*\n)/,
          `$1  breadcrumb?: any\n`,
        );
        if (nextContent !== source) {
          try {
            writeFileSync(entryPath, nextContent);
            mutated = true;
          } catch {
            /* noop */
          }
        }
      }
    }
  }
  if (mutated) {
    console.log("✓ Patched Next route type declarations for breadcrumb export");
  }
}

ensureBreadcrumbAllowedExports();
patchTypeGuardTemplates();
patchRouteTypeDeclarations();
