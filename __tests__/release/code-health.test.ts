/** @jest-environment node */
import {
  checkCodeHealth,
  readHealthResponse,
  verifyHealthDomainAliases,
} from "../../scripts/release/code-health";
import {
  classifyCodeFailure,
  codeGuard,
} from "../../scripts/release/code-diagnostics";
const stage = "approved-stage.vercel.app";
const apex = "https://tullyelly.com";
const www = "https://www.tullyelly.com";
const secret = "fixture-bypass-secret";
// Next aliases this renderer to the edge implementation for server-inserted HTML.
jest.mock("react-dom/server", () =>
  jest.requireActual("react-dom/server.edge"),
);
import { getRedirectError } from "next/dist/client/components/redirect";
import { makeGetServerInsertedHTML } from "next/dist/server/app-render/make-get-server-inserted-html";

async function streamedRedirect(location: string) {
  return makeGetServerInsertedHTML({
    polyfills: [],
    renderServerInsertedHTML: () => [],
    serverCapturedErrors: [getRedirectError(location, "replace")],
    tracingMetadata: undefined,
    basePath: "",
  })();
}
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

test("canonical public image reads preserve query and never carry bypass credentials", async () => {
  const fetcher = jest.fn().mockResolvedValue(new Response("image"));
  await readHealthResponse({
    stagedHost: stage,
    publicDomain: true,
    publicOrigin: "https://www.tullyelly.com",
    path: "/_next/image?url=%2Fimages%2Ffixture.webp&w=640&q=75&dpl=dpl_fixture",
    bypassSecret: secret,
    timeoutMs: 15000,
    fetcher,
  });
  expect(String(fetcher.mock.calls[0][0])).toBe(
    `${www}/_next/image?url=%2Fimages%2Ffixture.webp&w=640&q=75&dpl=dpl_fixture`,
  );
  expect(fetcher.mock.calls[0][1]).toMatchObject({
    headers: {},
    credentials: "omit",
    redirect: "manual",
  });
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
test.each([
  [false, "/"],
  [false, "/shaolin"],
  [false, "/stats"],
  [true, "/"],
  [true, "/shaolin"],
  [true, "/stats"],
] as const)(
  "failed HTML status retains %s public-domain context and exact %s probe without response contents",
  async (publicDomain, path) => {
    const sensitive = "PRIVATE_RESPONSE_BODY_AND_COOKIE";
    const baseline = fixture(publicDomain);
    const response = new Response(sensitive, {
      status: 503,
      headers: { "set-cookie": sensitive },
    });
    const bodyRead = jest.spyOn(response, "text");
    const fetcher = jest.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      if (url.pathname === path && (!publicDomain || url.origin === www))
        return response;
      return baseline(input);
    });
    const guard = publicDomain ? "health.public" : "health.staged";
    let diagnostic: ReturnType<typeof classifyCodeFailure> | undefined;
    try {
      await codeGuard(guard, () =>
        checkCodeHealth({
          deployment,
          projectId: "prj_fixture",
          publicDomain,
          operation: "deploy",
          fetcher,
          bypassSecret: secret,
        }),
      );
      throw new Error("Expected the failed probe to reject");
    } catch (error) {
      diagnostic = classifyCodeFailure(guard, error);
    }
    expect(diagnostic).toMatchObject({
      guard,
      category: "invariant",
      invariant: "code.health-page",
      status: 503,
      health: { path, condition: "http-status" },
    });
    expect(bodyRead).not.toHaveBeenCalled();
    expect(JSON.stringify(diagnostic)).not.toContain(sensitive);
  },
);
test.each([apex, www])(
  "a public homepage 403 at %s preserves its actual origin and redirect hop",
  async (rejectedOrigin) => {
    const sensitive = "PRIVATE_RESPONSE_BODY_COOKIE_BYPASS";
    const denied = new Response(sensitive, {
      status: 403,
      headers: {
        "x-vercel-id": "cle1::iad1::abc12-1792331886740-bd412d2176fe",
        "x-vercel-error": "DEPLOYMENT_BLOCKED",
        "x-vercel-mitigated": "challenge",
        "cf-ray": "a4c80e51c8b91891-ORD",
        "cf-mitigated": "challenge",
        "set-cookie": sensitive,
        authorization: sensitive,
        location: `https://private.example/?token=${sensitive}`,
      },
    });
    const readBody = jest.spyOn(denied, "text");
    const fetcher = jest.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      return url.origin === rejectedOrigin ? denied : redirect(www + "/");
    });
    let diagnostic;
    try {
      await checkCodeHealth({
        deployment,
        projectId: "prj_fixture",
        publicDomain: true,
        operation: "deploy",
        bypassSecret: sensitive,
        fetcher,
      });
      throw new Error("Expected homepage denial");
    } catch (error) {
      diagnostic = classifyCodeFailure("health.public", error);
    }
    expect(diagnostic).toMatchObject({
      guard: "health.public",
      invariant: "code.health-page",
      status: 403,
      health: {
        path: "/",
        condition: "security-challenge",
        request: {
          initialOrigin: apex,
          effectiveOrigin: rejectedOrigin,
        },
      },
    });
    const responses = diagnostic.health?.request?.responses;
    expect(responses).toHaveLength(rejectedOrigin === apex ? 1 : 2);
    expect(responses?.at(-1)).toEqual({
      origin: rejectedOrigin,
      hop: rejectedOrigin === apex ? 0 : 1,
      status: 403,
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      headers: {
        "x-vercel-id": "cle1::iad1::abc12-1792331886740-bd412d2176fe",
        "x-vercel-error": "DEPLOYMENT_BLOCKED",
        "x-vercel-mitigated": "challenge",
        "cf-ray": "a4c80e51c8b91891-ORD",
        "cf-mitigated": "challenge",
      },
    });
    if (rejectedOrigin === www)
      expect(responses?.[0]).toMatchObject({
        origin: apex,
        hop: 0,
        status: 307,
      });
    for (const [, init] of fetcher.mock.calls as unknown as [
      URL,
      RequestInit,
    ][])
      expect(init).toMatchObject({
        headers: {},
        credentials: "omit",
        redirect: "manual",
      });
    expect(readBody).not.toHaveBeenCalled();
    expect(JSON.stringify(diagnostic)).not.toContain(sensitive);
    expect(JSON.stringify(diagnostic)).not.toContain("private.example");
  },
);
test.each([false, true])(
  "successful HTTP with missing HTML doctype still fails with its exact probe; public=%s",
  async (publicDomain) => {
    const baseline = fixture(publicDomain);
    const fetcher = jest.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      if (url.pathname === "/stats" && (!publicDomain || url.origin === www))
        return new Response("<html>PRIVATE_RESPONSE_BODY</html>");
      return baseline(input);
    });
    const guard = publicDomain ? "health.public" : "health.staged";
    await expect(
      codeGuard(guard, () =>
        checkCodeHealth({
          deployment,
          projectId: "prj_fixture",
          publicDomain,
          operation: "deploy",
          fetcher,
        }),
      ),
    ).rejects.toMatchObject({
      diagnostic: {
        guard,
        invariant: "code.health-page",
        status: 200,
        health: { path: "/stats", condition: "missing-doctype" },
      },
    });
  },
);
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

test.each([false, true])(
  "actual Next streamed login redirect is checked on the correct origin, public=%s",
  async (publicDomain) => {
    const body = await streamedRedirect(
      `/login?callbackUrl=%2Fmark2%2Fadmin%2Fanalytics&source=release`,
    );
    const fetcher: typeof fetch = jest.fn(async (input) => {
      const u = new URL(String(input));
      if (publicDomain && u.origin === apex)
        return redirect(`${www}${u.pathname}${u.search}`);
      if (u.pathname === "/api/cron/analytics")
        return new Response(null, { status: 401 });
      if (u.pathname === "/mark2/admin/analytics")
        return new Response(`<!doctype html><html>${body}</html>`);
      return new Response("<!doctype html><html>fixture</html>");
    });
    await expect(
      checkCodeHealth({
        deployment,
        projectId: "prj_fixture",
        publicDomain,
        operation: "deploy",
        fetcher,
        bypassSecret: secret,
      }),
    ).resolves.toBeUndefined();
    for (const [input, init] of (fetcher as jest.Mock).mock.calls) {
      expect(new URL(String(input)).pathname).not.toBe("/login");
      expect(init.headers).toEqual(
        publicDomain ? {} : { "x-vercel-protection-bypass": secret },
      );
    }
  },
);

test.each([
  "https://unexpected.example/login",
  `${apex}/login`,
  `http://${stage}/login`,
  `https://user:password@${stage}/login`,
  `/login#fragment`,
  "/unapproved",
])(
  "streamed redirect rejects unapproved login destination %# without following it",
  async (location) => {
    const body = await streamedRedirect(location);
    const fetcher = jest.fn(
      async () => new Response(`<!doctype html><html>${body}</html>`),
    );
    await expect(
      readHealthResponse({
        stagedHost: stage,
        publicDomain: false,
        path: "/mark2/admin/analytics",
        timeoutMs: 15000,
        allowLoginRedirect: true,
        bypassSecret: secret,
        fetcher,
      }),
    ).rejects.toThrow("login-redirect");
    expect(fetcher).toHaveBeenCalledTimes(1);
  },
);

test("streamed denial does not excuse private content, hidden markers or a second refresh", async () => {
  const body = await streamedRedirect("/login");
  for (const html of [
    "<!doctype html><h1>Analytics administration</h1>",
    `<!doctype html><!--${body}-->`,
    `<!doctype html><script>${body}</script>`,
    `<!doctype html><textarea>${body}</textarea>`,
    `<!doctype html><textarea>${body}`,
    `<!doctype html>${body}<p>Last attempted run</p>`,
    `<!doctype html>${body}<button>Test connection</button>`,
    `<!doctype html>${body}<meta http-equiv="refresh" content="0;url=https://unexpected.example/login"/>`,
  ]) {
    const fetcher = jest.fn(async () => new Response(html));
    await expect(
      readHealthResponse({
        stagedHost: stage,
        publicDomain: false,
        path: "/mark2/admin/analytics",
        timeoutMs: 15000,
        allowLoginRedirect: true,
        fetcher,
      }),
    ).rejects.toThrow("authorization");
    expect(fetcher).toHaveBeenCalledTimes(1);
  }
});

test("an unexpectedly followed response cannot be accepted as a Cloudflare pending challenge", async () => {
  const response = new Response(null, {
    status: 403,
    headers: { "cf-mitigated": "challenge", "cf-ray": "a4c9030a7b8f6b31-DFW" },
  });
  Object.defineProperty(response, "redirected", { value: true });
  await expect(
    readHealthResponse({
      stagedHost: stage,
      publicDomain: true,
      path: "/",
      timeoutMs: 1000,
      rejectChallenges: true,
      fetcher: jest.fn(async () => response),
    }),
  ).rejects.toThrow("code.health-unexpected-follow");
});
