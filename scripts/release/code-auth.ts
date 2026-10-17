/** Read-only checks using the exact protected credential supplied to provider operations. */
import { codeCli } from "./code-cli";
import {
  classifyCodeFailure,
  codeGuard,
  codeMetadataRequest,
} from "./code-diagnostics";

export function releaseTokenState(token: string | undefined) {
  return {
    present: typeof token === "string" && token.length > 0,
    malformed:
      typeof token === "string" &&
      token.length > 0 &&
      (/\s/.test(token) ||
        [...token].some(
          (character) =>
            character.charCodeAt(0) < 32 || character.charCodeAt(0) > 126,
        ) ||
        /^['"]|['"]$/.test(token)),
  };
}

function assertTarget(value: unknown, projectId: string, teamId: string) {
  if (
    !value ||
    typeof value !== "object" ||
    !("id" in value) ||
    value.id !== projectId ||
    !("accountId" in value) ||
    value.accountId !== teamId
  )
    throw new Error("code.auth-target-mismatch");
}

export async function checkCodeAuth(options: {
  token: string | undefined;
  projectId: string;
  teamId: string;
  fetcher?: typeof fetch;
  runCli?: typeof codeCli;
  report?: (event: Record<string, unknown>) => void;
}) {
  const tokenState = releaseTokenState(options.token);
  const event = {
    event: "auth",
    tokenPresent: tokenState.present,
    tokenMalformed: tokenState.malformed,
    restVerified: false,
    cliVerified: false,
  };
  options.report?.({ ...event });
  if (!tokenState.present) throw new Error("code.release-token-missing");
  if (tokenState.malformed) throw new Error("code.release-token-malformed");
  const token = options.token!;
  if (
    !/^prj_[A-Za-z0-9]+$/.test(options.projectId) ||
    !/^team_[A-Za-z0-9]+$/.test(options.teamId)
  )
    throw new Error("code.auth-target-mismatch");
  const path = `/v9/projects/${options.projectId}?teamId=${options.teamId}`;
  await codeGuard("vercel.auth-rest", async () => {
    assertTarget(
      await codeMetadataRequest(
        `https://api.vercel.com${path}`,
        token,
        options.fetcher,
      ),
      options.projectId,
      options.teamId,
    );
  });
  event.restVerified = true;
  options.report?.({ ...event });
  try {
    await codeGuard("vercel.auth-cli", () => {
      // Project inspect JSON omits the owner ID. The read-only API command gives
      // both IDs and exercises the same CLI scope/user resolution as deployment.
      const output = (options.runCli ?? codeCli)(
        "vercel.auth-cli",
        ["api", path, "--method", "GET"],
        options.teamId,
        token,
      );
      let value: unknown;
      try {
        value = JSON.parse(output);
      } catch {
        throw new Error("code.auth-cli-output");
      }
      assertTarget(value, options.projectId, options.teamId);
    });
  } catch (originalFailure) {
    // These reads localize capability failures without retrying the CLI or any
    // mutation. Bodies are discarded; the original CLI observation always wins.
    const probe = async (
      operation: "vercel.user" | "vercel.team",
      endpoint: string,
    ) => {
      try {
        await codeMetadataRequest(
          `https://api.vercel.com${endpoint}`,
          token,
          options.fetcher,
        );
        options.report?.({ event: "auth-probe", operation, succeeded: true });
      } catch (error) {
        const diagnostic = classifyCodeFailure("vercel.auth-cli", error);
        options.report?.({
          event: "auth-probe",
          operation,
          succeeded: false,
          ...(diagnostic.status === undefined
            ? {}
            : { status: diagnostic.status }),
        });
      }
    };
    await Promise.allSettled([
      probe("vercel.user", "/v2/user"),
      probe("vercel.team", `/teams/${options.teamId}`),
    ]);
    throw originalFailure;
  }
  event.cliVerified = true;
  options.report?.({ ...event });
  return {
    token: tokenState,
    rest: { projectMatches: true, teamMatches: true },
    cli: { projectMatches: true, teamMatches: true },
  };
}
