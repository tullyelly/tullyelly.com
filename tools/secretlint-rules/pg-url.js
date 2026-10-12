const { spawnSync } = require("node:child_process");
const { resolve } = require("node:path");

// Validate with the release policy itself; never maintain a weaker scanner schema.
function allowedManifestHost(content) {
  try {
    const parsed = JSON.parse(content);
    if (parsed.version !== 2 || parsed.kind !== "code-only") return null;
    const fields = [...content.matchAll(/"databaseHost"\s*:\s*"([^"\\]*)"/g)];
    if (fields.length !== 1) return null;
    const result = spawnSync(
      process.execPath,
      [
        "--import",
        "tsx",
        "--input-type=module",
        "-e",
        'import {readFileSync} from "node:fs"; import {validateCodeManifest} from "./scripts/release/code-manifest.ts"; validateCodeManifest(JSON.parse(readFileSync(0,"utf8")));',
      ],
      {
        cwd: resolve(__dirname, "../.."),
        input: content,
        encoding: "utf8",
        timeout: 10000,
        maxBuffer: 65536,
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
    if (result.status !== 0 || result.error) return null;
    const match = fields[0];
    return [match.index + match[0].indexOf(match[1]), match[1]];
  } catch {
    return null;
  }
}

function concealedCredential(content) {
  try {
    const visit = (value) => {
      if (typeof value === "string") {
        let decoded = value;
        for (let i = 0; i < 4; i++) {
          if (
            /postgres(?:ql)?:\/\//i.test(decoded) ||
            /https?:\/\/[^/\s]*@/i.test(decoded) ||
            /[?&](?:password|passwd|token|secret|api[_-]?key|username|user)=/i.test(
              decoded,
            )
          )
            return true;
          try {
            const next = decodeURIComponent(decoded);
            if (next === decoded) break;
            decoded = next;
          } catch {
            break;
          }
        }
      } else if (value && typeof value === "object")
        return Object.values(value).some(visit);
      return false;
    };
    return visit(JSON.parse(content));
  } catch {
    return false;
  }
}

const messages = {
  CREDENTIALS: "Potential secret: Postgres URL with credentials detected",
  NEON_HOST: "Potential secret: Neon host appears in committed text",
};

const creator = {
  meta: {
    id: "custom-pg-url",
    docs: { description: "Flag postgres URLs with creds or Neon hosts" },
    type: "scanner",
    supportedContentTypes: ["text"],
    messages,
  },
  create(context) {
    const pgWithCreds =
      /\bpostgres(?:ql)?:\/\/[^:\/\s]+:[^@\s]+@[^\/\s]+\/[^\s"'`?]+/gi;
    const neonHost = /\bep-[a-z0-9-]+\.c-\d\.[a-z0-9-]+\.aws\.neon\.tech\b/gi;

    // allow-list for obvious dummy locals or placeholders
    const allowDummy =
      /\bpostgres(?:ql)?:\/\/(?:[a-z0-9._-]+:[^@\s]+@)?(localhost|127\.0\.0\.1)(:\d+)?\/[a-z0-9_-]+/i;

    return {
      file({ content }) {
        let match;
        const allowed = allowedManifestHost(content);
        if (
          concealedCredential(content) &&
          /"kind"\s*:\s*"code-only"/.test(content)
        ) {
          context.report({
            message: messages.CREDENTIALS,
            messageId: "CREDENTIALS",
            range: [0, content.length],
          });
        }

        while ((match = pgWithCreds.exec(content))) {
          const value = match[0];
          if (value.includes("<") || value.includes(">")) continue;
          if (allowDummy.test(value)) continue;
          context.report({
            message: messages.CREDENTIALS,
            messageId: "CREDENTIALS",
            range: [match.index, match.index + value.length],
          });
        }

        while ((match = neonHost.exec(content))) {
          const value = match[0];
          if (allowed && match.index === allowed[0] && value === allowed[1])
            continue;
          context.report({
            message: messages.NEON_HOST,
            messageId: "NEON_HOST",
            range: [match.index, match.index + value.length],
          });
        }
      },
    };
  },
};

module.exports = { creator };
