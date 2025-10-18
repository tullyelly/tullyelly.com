#!/usr/bin/env tsx
import { globby } from "globby";
import fs from "fs-extra";

type Rule = {
  name: string;
  regex: RegExp;
  replace: string | ((m: string, ...args: any[]) => string);
};

function buildRules(): Rule[] {
  return [
    // Star-bullet shouts to → 💐 Flowers:
    {
      name: "star-bullet-shouts-to",
      regex: /^([ \t]*)(?:[★\*])[ \t]*shouts?\s+to\s+/gim,
      replace: (_m: string, indent: string) => `${indent}💐 Flowers: `,
    },
    // Line-start shouts to → 💐 Flowers:
    {
      name: "line-start-shouts-to",
      regex: /^([ \t]*)shouts?\s+to\s+/gim,
      replace: (_m: string, indent: string) => `${indent}💐 Flowers: `,
    },
    // Headings (Shouts|Liner Notes) → Flowers
    {
      name: "headings",
      regex: /^(\s*#{1,6}\s*)(Shouts|Liner Notes)\b/gim,
      replace: "$1Flowers",
    },
    // Label-only lines: Shouts|Liner Notes|Credits:
    {
      name: "label-only",
      regex: /^(\s*)(Shouts|Liner Notes|Credits)\s*:\s*$/gim,
      replace: "$1Flowers:",
    },
    // Noun form in display contexts: Shout[- ]?outs? → Flowers
    {
      name: "noun-form",
      regex: /\bShout[- ]?outs?\b/gi,
      replace: "Flowers",
    },
  ];
}

function splitFences(content: string) {
  const lines = content.split(/\n/);
  const parts: { inside: boolean; text: string }[] = [];
  let buf: string[] = [];
  let inside = false;
  for (const line of lines) {
    const fence = /^\s*```/.test(line);
    if (fence) {
      buf.push(line);
      if (!inside) {
        // flush outside chunk
        if (buf.length > 1) {
          const head = buf.slice(0, -1).join("\n");
          if (head) parts.push({ inside: false, text: head });
          buf = [buf[buf.length - 1]];
        }
      }
      inside = !inside;
    } else {
      buf.push(line);
    }
  }
  if (buf.length) parts.push({ inside, text: buf.join("\n") });
  return parts;
}

async function run() {
  const write = process.argv.includes("--write");
  const patterns = ["**/*.{md,mdx,tsx,ts}"];
  const ignore = [
    "**/node_modules/**",
    "**/.next/**",
    "**/dist/**",
    "**/coverage/**",
    "public/**/*.{png,jpg,webp,svg}",
  ];
  const files = await globby(patterns, { ignore });
  const rules = buildRules();

  let modifiedCount = 0;
  let replaceCounts: Record<string, number> = Object.fromEntries(
    rules.map((r) => [r.name, 0]),
  );

  for (const file of files) {
    const orig = await fs.readFile(file, "utf8");
    let changed = false;
    const parts = splitFences(orig);
    const out: string[] = [];
    for (const part of parts) {
      if (part.inside) {
        out.push(part.text); // leave code fences untouched
        continue;
      }
      let text = part.text;
      // Skip replacements in likely URL-heavy lines to reduce risk
      const processLine = (line: string) => {
        if (/https?:\/\//i.test(line)) return line;
        let lineChanged = false;
        for (const rule of rules) {
          const before = line;
          line = line.replace(rule.regex, rule.replace as any);
          if (line !== before) {
            const diff = (before.match(rule.regex) || []).length;
            if (diff > 0) replaceCounts[rule.name] += diff;
            lineChanged = true;
          }
        }
        return lineChanged ? line : line;
      };
      text = text.split(/\n/).map(processLine).join("\n");
      if (text !== part.text) changed = true;
      out.push(text);
    }
    const result = out.join("\n");
    if (changed) {
      modifiedCount++;
      if (write) await fs.writeFile(file, result, "utf8");
    }
  }

  const summary = {
    scanned: files.length,
    modified: modifiedCount,
    replacements: replaceCounts,
    mode: write ? "write" : "dry",
  };
  console.log(JSON.stringify(summary, null, 2));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
