/** @jest-environment node */
import {
  checkCodeHealth,
  readHealthResponse,
  verifyHealthDomainAliases,
} from "../../scripts/release/code-health";
const stage = "approved-stage.vercel.app";
const apex = "https://tullyelly.com";
const www = "https://www.tullyelly.com";
const secret = "fixture-bypass-secret";
const deployment = {
  id: "dpl_approved",
  url: stage,
  projectId: "prj_fixture",
  target: "production",
  readyState: "READY",
};
const redirect = (location: string, status = 307) =>
  new Response(null, { status, headers: { location } });
const read = (
  fetcher: typeof fetch,
  path = "/shaolin?view=public&sort=date",
  publicDomain = true,
) =>
  readHealthResponse({
    stagedHost: stage,
    publicDomain,
    path,
    bypassSecret: secret,
    timeoutMs: 15000,
    fetcher,
  });

test.each([301, 302, 307, 308])(
  "accepts exact HTTPS apex-to-www %s and preserves path/query without credentials",
  async (status) => {
    const target = `${www}/shaolin?view=public&sort=date`;
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(redirect(target, status))
      .mockResolvedValueOnce(new Response("ok"));
    expect((await read(fetcher)).status).toBe(200);
    expect(fetcher.mock.calls.map(([u]) => String(u))).toEqual([
      `${apex}/shaolin?view=public&sort=date`,
      target,
    ]);
    for (const [, init] of fetcher.mock.calls) {
      expect(init).toMatchObject({
        method: "GET",
        redirect: "manual",
        credentials: "omit",
        headers: {},
      });
      expect(JSON.stringify(init)).not.toContain(secret);
    }
  },
);
test.each([
  "https://unexpected.example/shaolin?view=public&sort=date",
  "https://www.tullyelly.com.evil.example/shaolin?view=public&sort=date",
  "http://www.tullyelly.com/shaolin?view=public&sort=date",
  "https://www.tullyelly.com:8443/shaolin?view=public&sort=date",
  "https://www.tullyelly.com/other?view=public&sort=date",
  "https://www.tullyelly.com/shaolin?sort=date&view=public",
  "https://www.tullyelly.com/shaolin?view=public&sort=date#fragment",
])(
  "rejects unapproved redirect destination %# before sending another request",
  async (location) => {
    const fetcher = jest.fn().mockResolvedValue(redirect(location));
    await expect(read(fetcher)).rejects.toThrow("code.health-redirect");
    expect(fetcher).toHaveBeenCalledTimes(1);
  },
);
test("rejects redirect userinfo, missing Location and arbitrary initial URLs", async () => {
  const u = new URL(`${www}/shaolin?view=public&sort=date`);
  u.username = "fixture-user";
  u.password = "fixture-password";
  const fetcher = jest.fn().mockResolvedValue(redirect(String(u)));
  await expect(read(fetcher)).rejects.toThrow();
  expect(fetcher).toHaveBeenCalledTimes(1);
  fetcher.mockReset().mockResolvedValue(new Response(null, { status: 307 }));
  await expect(read(fetcher)).rejects.toThrow();
  expect(fetcher).toHaveBeenCalledTimes(1);
  fetcher.mockReset();
  await expect(
    read(fetcher, "https://unexpected.example/path"),
  ).rejects.toThrow("code.health-path");
  expect(fetcher).not.toHaveBeenCalled();
});
test("bounds loops and second domain redirects to two requests", async () => {
  const fetcher = jest
    .fn()
    .mockResolvedValueOnce(redirect(`${www}/shaolin?view=public&sort=date`))
    .mockResolvedValueOnce(redirect(`${apex}/shaolin?view=public&sort=date`));
  await expect(read(fetcher)).rejects.toThrow();
  expect(fetcher).toHaveBeenCalledTimes(2);
});
test("staged checks cannot redirect to production, another staged host, or the same page", async () => {
  for (const target of [
    `${apex}/shaolin?view=public&sort=date`,
    `${www}/shaolin?view=public&sort=date`,
    "https://other-stage.vercel.app/shaolin?view=public&sort=date",
    `https://${stage}/shaolin?view=public&sort=date`,
  ]) {
    const fetcher = jest.fn().mockResolvedValue(redirect(target));
    await expect(read(fetcher, undefined, false)).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][1].headers).toEqual({
      "x-vercel-protection-bypass": secret,
    });
  }
});
test("rejects invalid staged host and wrong deployment identity before any HTTP request", async () => {
  const fetcher = jest.fn();
  for (const host of [
    "tullyelly.com",
    `https://${stage}`,
    `${stage}/path`,
    `${stage}.evil.example`,
  ])
    await expect(
      readHealthResponse({
        stagedHost: host,
        publicDomain: false,
        path: "/",
        timeoutMs: 15000,
        fetcher,
        bypassSecret: secret,
      }),
    ).rejects.toThrow("code.health-host");
  await expect(
    checkCodeHealth({
      deployment: { ...deployment, projectId: "prj_other" },
      projectId: "prj_fixture",
      publicDomain: false,
      operation: "deploy",
      fetcher,
    }),
  ).rejects.toThrow("identity");
  expect(fetcher).not.toHaveBeenCalled();
});
function fixture(
  publicDomain: boolean,
  adminLocation = "/login?callbackUrl=%2Fmark2%2Fadmin%2Fanalytics",
  cronStatus = 401,
  adminStatus = 302,
) {
  return jest.fn(async (input: string | URL | Request) => {
    const u = new URL(String(input));
    if (publicDomain && u.origin === apex)
      return redirect(`${www}${u.pathname}${u.search}`);
    if (u.pathname === "/api/cron/analytics")
      return new Response(null, { status: cronStatus });
    if (u.pathname === "/mark2/admin/analytics")
      return adminStatus === 302
        ? redirect(adminLocation, 302)
        : new Response(null, { status: adminStatus });
    return new Response("<!doctype html><html>fixture</html>");
  });
}
test("public health normalizes domain routing then inspects owner login redirect without following it", async () => {
  const fetcher = fixture(true);
  await checkCodeHealth({
    deployment,
    projectId: "prj_fixture",
    publicDomain: true,
    operation: "deploy",
    fetcher,
    bypassSecret: secret,
  });
  expect(fetcher).toHaveBeenCalledTimes(10);
  for (const [input, init] of fetcher.mock.calls as unknown as [
    URL,
    RequestInit,
  ][]) {
    expect(input.pathname).not.toBe("/login");
    expect(init.headers).toEqual({});
    expect(init.credentials).toBe("omit");
  }
});
test("stage health stays on the exact URL and sends only the stage bypass header", async () => {
  const fetcher = fixture(false);
  await checkCodeHealth({
    deployment,
    projectId: "prj_fixture",
    publicDomain: false,
    operation: "deploy",
    fetcher,
    bypassSecret: secret,
  });
  expect(fetcher).toHaveBeenCalledTimes(5);
  for (const [input, init] of fetcher.mock.calls as unknown as [
    URL,
    RequestInit,
  ][]) {
    expect(input.origin).toBe(`https://${stage}`);
    expect(init.headers).toEqual({ "x-vercel-protection-bypass": secret });
  }
});
test("owner and cron authorization failures remain failures", async () => {
  for (const [cronStatus, adminStatus] of [
    [200, 302],
    [401, 200],
  ])
    await expect(
      checkCodeHealth({
        deployment,
        projectId: "prj_fixture",
        publicDomain: true,
        operation: "deploy",
        fetcher: fixture(true, undefined, cronStatus, adminStatus),
      }),
    ).rejects.toThrow("authorization");
  for (const login of [
    "https://unexpected.example/login",
    `${apex}/login`,
    `http://${stage}/login`,
    "/unapproved",
  ]) {
    const fetcher = fixture(false, login);
    await expect(
      checkCodeHealth({
        deployment,
        projectId: "prj_fixture",
        publicDomain: false,
        operation: "deploy",
        fetcher,
        bypassSecret: secret,
      }),
    ).rejects.toThrow("login-redirect");
    expect(fetcher).toHaveBeenCalledTimes(5);
  }
});
test("both exact domain aliases must belong to the approved project and deployment", () => {
  const aliases = ["tullyelly.com", "www.tullyelly.com"].map((alias) => ({
    alias,
    projectId: "prj_fixture",
    deploymentId: "dpl_approved",
  }));
  expect(() =>
    verifyHealthDomainAliases(aliases, "prj_fixture", "dpl_approved"),
  ).not.toThrow();
  for (const change of [
    { projectId: "prj_other" },
    { deploymentId: "dpl_previous" },
    { alias: "unexpected.example" },
  ])
    expect(() =>
      verifyHealthDomainAliases(
        [aliases[0], { ...aliases[1], ...change }],
        "prj_fixture",
        "dpl_approved",
      ),
    ).toThrow();
  expect(() =>
    verifyHealthDomainAliases([aliases[0]], "prj_fixture", "dpl_approved"),
  ).toThrow();
});
