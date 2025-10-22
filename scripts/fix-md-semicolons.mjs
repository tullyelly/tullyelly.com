#!/usr/bin/env node
import fs from "node:fs";

const files = process.argv.slice(2);
for (const file of files) {
  let text = fs.readFileSync(file, "utf8");
  if (/^---[\s\S]*?punctuation:\s*allowed[\s\S]*?---/.test(text)) {
    continue;
  }
  let out = "";
  let inFence = false;
  let inInline = false;
  for (let i = 0; i < text.length; i++) {
    if (!inInline && text.startsWith("```", i)) {
      inFence = !inFence;
      out += "```";
      i += 2;
      continue;
    }
    if (!inFence && text[i] === "`") {
      inInline = !inInline;
      out += "`";
      continue;
    }
    if (!inFence && !inInline && text[i] === "—") {
      out += ";";
    } else {
      out += text[i];
    }
  }
  fs.writeFileSync(file, out);
}
