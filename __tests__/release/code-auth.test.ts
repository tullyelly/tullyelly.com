/** @jest-environment node */
import {
  checkCodeAuth,
  releaseTokenState,
} from "../../scripts/release/code-auth";
import {
  CodeDiagnosticError,
  classifyCodeFailure,
} from "../../scripts/release/code-diagnostics";
import type { codeCli } from "../../scripts/release/code-cli";

const token = "PLANTED_PROTECTED_TOKEN_DO_NOT_PUBLISH";
const projectId = "prj_fixture",
  teamId = "team_fixture";
function fixture() {
  const fetcher: typeof fetch = jest.fn(async () =>
    Response.json({ id: projectId, accountId: teamId }),
  );
  const runCli = jest.fn<
    ReturnType<typeof codeCli>,
    Parameters<typeof codeCli>
  >(() => JSON.stringify({ id: projectId, accountId: teamId }));
  const report = jest.fn();
  return {
    fetcher,
    runCli,
    report,
    run: (value: string | undefined = token) =>
      checkCodeAuth({
        token: value,
        projectId,
        teamId,
        fetcher,
        runCli,
        report,
      }),
  };
}
test.each([
  undefined,
  "",
  " ",
  "token\n",
  "token\u0000",
  '"token"',
  "'token'",
  "token\u007f",
  "token\u00e9",
])(
  "token inspection reveals only presence and malformed booleans %#",
  (value) => {
    const result = releaseTokenState(value);
    expect(Object.keys(result)).toEqual(["present", "malformed"]);
    expect(result.present).toBe(typeof value === "string" && value.length > 0);
    expect(result.malformed).toBe(
      typeof value === "string" && value.length > 0,
    );
    expect(
      Object.values(result).every((field) => typeof field === "boolean"),
    ).toBe(true);
  },
);
test("same protected credential verifies exact project and team through REST then read-only installed CLI", async () => {
  const { fetcher, runCli, run, report } = fixture();
  await expect(run()).resolves.toEqual({
    token: { present: true, malformed: false },
    rest: { projectMatches: true, teamMatches: true },
    cli: { projectMatches: true, teamMatches: true },
  });
  expect(fetcher).toHaveBeenCalledWith(
    `https://api.vercel.com/v9/projects/${projectId}?teamId=${teamId}`,
    expect.objectContaining({
      method: "GET",
      redirect: "error",
      headers: expect.objectContaining({ Authorization: `Bearer ${token}` }),
    }),
  );
  expect(runCli).toHaveBeenCalledWith(
    "vercel.auth-cli",
    ["api", `/v9/projects/${projectId}?teamId=${teamId}`, "--method", "GET"],
    teamId,
    token,
  );
  expect(report.mock.calls.map((call) => call[0])).toEqual([
    {
      event: "auth",
      tokenPresent: true,
      tokenMalformed: false,
      restVerified: false,
      cliVerified: false,
    },
    {
      event: "auth",
      tokenPresent: true,
      tokenMalformed: false,
      restVerified: true,
      cliVerified: false,
    },
    {
      event: "auth",
      tokenPresent: true,
      tokenMalformed: false,
      restVerified: true,
      cliVerified: true,
    },
  ]);
  expect(JSON.stringify(report.mock.calls)).not.toContain(token);
  expect(fetcher).toHaveBeenCalledTimes(1);
});
test.each([undefined, "", `${token}\n`, `"${token}"`])(
  "missing or malformed protected credential stops before either provider read %#",
  async (value) => {
    const { fetcher, runCli, report } = fixture();
    await expect(
      checkCodeAuth({
        token: value,
        projectId,
        teamId,
        fetcher,
        runCli,
        report,
      }),
    ).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
    expect(runCli).not.toHaveBeenCalled();
    expect(report).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(report.mock.calls)).not.toContain(token);
  },
);
test("REST success does not excuse a CLI authentication failure", async () => {
  const { runCli, report, run } = fixture();
  runCli.mockImplementation(() => {
    throw new CodeDiagnosticError({
      guard: "vercel.auth-cli",
      operation: "vercel.auth-cli",
      category: "process",
      exitStatus: 1,
    });
  });
  await expect(run()).rejects.toMatchObject({
    diagnostic: { guard: "vercel.auth-cli", exitStatus: 1 },
  });
  expect(
    report.mock.calls.filter((call) => call[0].event === "auth").at(-1)?.[0],
  ).toEqual({
    event: "auth",
    tokenPresent: true,
    tokenMalformed: false,
    restVerified: true,
    cliVerified: false,
  });
});
test.each([
  "rest-project",
  "rest-team",
  "cli-project",
  "cli-team",
  "cli-malformed",
])(
  "preflight rejects mismatched or invalid %s output without exposing values",
  async (boundary) => {
    const { fetcher, runCli, run, report } = fixture();
    const value = {
      id: boundary.endsWith("project") ? token : projectId,
      accountId: boundary.endsWith("team") ? token : teamId,
    };
    if (boundary.startsWith("rest"))
      (fetcher as jest.Mock).mockResolvedValue(Response.json(value));
    else
      runCli.mockReturnValue(
        boundary === "cli-malformed" ? token : JSON.stringify(value),
      );
    let failure: unknown;
    try {
      await run();
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeDefined();
    expect(
      JSON.stringify(classifyCodeFailure("production.check", failure)),
    ).not.toContain(token);
    expect(JSON.stringify(report.mock.calls)).not.toContain(token);
    expect(
      report.mock.calls.filter((call) => call[0].event === "auth").at(-1)?.[0]
        .cliVerified,
    ).toBe(false);
    if (boundary.startsWith("rest")) expect(runCli).not.toHaveBeenCalled();
  },
);
test("REST rejection prevents CLI access and retains its existing safe HTTP evidence", async () => {
  const { fetcher, runCli, run } = fixture();
  (fetcher as jest.Mock).mockResolvedValue(
    new Response(token, { status: 403 }),
  );
  await expect(run()).rejects.toMatchObject({
    diagnostic: { operation: "vercel.project", category: "http", status: 403 },
  });
  expect(runCli).not.toHaveBeenCalled();
});
test("CLI failure is preserved while same-token read-only probes identify denied user and allowed team reads", async () => {
  const { fetcher, runCli, run, report } = fixture();
  const original = new CodeDiagnosticError({
    guard: "vercel.auth-cli",
    operation: "vercel.auth-cli",
    category: "process",
    exitStatus: 1,
  });
  runCli.mockImplementation(() => {
    throw original;
  });
  (fetcher as jest.Mock).mockImplementation(async (url: string) =>
    new URL(url).pathname === "/v2/user"
      ? new Response(token, { status: 401 })
      : Response.json({ id: projectId, accountId: teamId, private: token }),
  );
  let failure: unknown;
  try {
    await run();
  } catch (error) {
    failure = error;
  }
  expect(classifyCodeFailure("production.check", failure)).toEqual(
    classifyCodeFailure("production.check", original),
  );
  expect(runCli).toHaveBeenCalledTimes(1);
  expect(fetcher).toHaveBeenCalledTimes(3);
  for (const [url, options] of (fetcher as jest.Mock).mock.calls) {
    expect(new URL(url).pathname).toMatch(
      /^\/(?:v9\/projects\/prj_fixture|v2\/user|teams\/team_fixture)$/,
    );
    expect(options).toMatchObject({
      method: "GET",
      redirect: "error",
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  expect(
    report.mock.calls
      .filter((call) => call[0].event === "auth-probe")
      .map((call) => call[0]),
  ).toEqual(
    expect.arrayContaining([
      {
        event: "auth-probe",
        operation: "vercel.user",
        succeeded: false,
        status: 401,
      },
      { event: "auth-probe", operation: "vercel.team", succeeded: true },
    ]),
  );
  expect(JSON.stringify(report.mock.calls)).not.toContain(token);
});
test("failed capability probes and report callbacks cannot replace the original CLI failure", async () => {
  const { fetcher, runCli, report } = fixture();
  runCli.mockImplementation(() => {
    throw new CodeDiagnosticError({
      guard: "vercel.auth-cli",
      category: "process",
      exitStatus: 7,
    });
  });
  (fetcher as jest.Mock)
    .mockResolvedValueOnce(Response.json({ id: projectId, accountId: teamId }))
    .mockRejectedValue(new Error(token));
  report.mockImplementation((event) => {
    if (event.event === "auth-probe") throw new Error("report failed");
  });
  await expect(
    checkCodeAuth({ token, projectId, teamId, fetcher, runCli, report }),
  ).rejects.toMatchObject({
    diagnostic: { guard: "vercel.auth-cli", exitStatus: 7 },
  });
  expect(runCli).toHaveBeenCalledTimes(1);
});
