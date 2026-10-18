/** Portable GET-only verifier; no dotenv, owner login, CLI, App key or mutations. */
import { readFileSync, statSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  publicVerificationInput,
  verifyPublicRelease,
} from "./release/public-verification";

export function publicVerificationArguments(args: string[]) {
  const names = new Set([
    "run",
    "attempt",
    "deployment",
    "sha",
    "location",
    "evidence",
  ]);
  const values: Record<string, string> = {};
  for (let index = 0; index < args.length; index += 2) {
    const name = args[index]?.slice(2);
    const value = args[index + 1];
    if (
      !args[index]?.startsWith("--") ||
      !names.has(name) ||
      !value ||
      value.startsWith("--") ||
      values[name]
    )
      throw new Error("code.public-verification-input");
    values[name] = value;
  }
  const { evidence, ...input } = values;
  if (!evidence) throw new Error("code.public-verification-input");
  return { evidence, input: publicVerificationInput.parse(input) };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const { evidence, input } = publicVerificationArguments(
      process.argv.slice(2),
    );
    const file = statSync(evidence);
    if (!file.isFile() || file.size > 1024 * 1024)
      throw new Error("code.public-verification-input");
    verifyPublicRelease(input, readFileSync(evidence, "utf8"), {
      readToken: process.env.VERCEL_RELEASE_READ_TOKEN,
      githubToken: process.env.GH_TOKEN,
    })
      .then((result) => {
        console.log(JSON.stringify(result));
        process.exitCode =
          result.state === "public verification passed" ? 0 : 1;
      })
      .catch(() => {
        console.log(
          JSON.stringify({
            state: "public verification pending",
            error: "invalid-input",
          }),
        );
        process.exitCode = 1;
      });
  } catch {
    console.log(
      JSON.stringify({
        state: "public verification pending",
        error: "invalid-input",
      }),
    );
    process.exitCode = 1;
  }
}
