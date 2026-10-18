/** Release-only reads; one verified domain redirect, never a staged fallback. */
import { z } from "zod";
import type { CodeDeployment } from "./code-release";
import { CodeHealthError } from "./code-diagnostics";

const apex = "https://tullyelly.com";
const www = "https://www.tullyelly.com";
const redirects = new Set([301, 302, 303, 307, 308]);

/** Next can emit its login redirect after the HTTP headers have already streamed. */
function verifyStreamedLoginRedirect(html: string, checkedUrl: URL) {
  // A redirect cannot excuse exposure of the private analytics page or controls.
  if (
    /Last attempted run|Daily catch-up cursor|No selected import range|Test connection|Continue import/.test(
      html,
    )
  )
    throw new Error("code.health-owner-authorization");
  // Only actual metadata counts; examples inside comments or raw-text elements do not.
  const markup = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|textarea|title)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
  const tags = [
    ...markup.matchAll(
      /<meta id="__next-page-redirect" http-equiv="refresh" content="([01]);url=([^"<>]+)"\s*\/?>/g,
    ),
  ];
  const refreshes =
    markup.match(/<meta\b[^>]*\bhttp-equiv=["']refresh["'][^>]*>/gi) ?? [];
  if (
    !tags.length ||
    tags.length !== refreshes.length ||
    /<(script|style|textarea|title)\b/i.test(markup)
  )
    throw new Error("code.health-owner-authorization");
  for (const tag of tags) {
    const destination = tag[2].replaceAll("&amp;", "&");
    if (/&(?:#[xX]?[0-9a-fA-F]+|[a-zA-Z]+);/.test(destination))
      throw new Error("code.health-login-redirect");
    const login = new URL(destination, checkedUrl);
    if (
      login.origin !== checkedUrl.origin ||
      login.username ||
      login.password ||
      login.hash ||
      !["/login", "/api/auth/signin"].includes(login.pathname)
    )
      throw new Error("code.health-login-redirect");
  }
}

export function verifyHealthDomainAliases(
  values: unknown[],
  projectId: string,
  deploymentId: string,
) {
  if (values.length !== 2) throw new Error("code.domain-drift");
  const schema = z.object({
    alias: z.string(),
    projectId: z.string(),
    deploymentId: z.string(),
  });
  for (const [index, value] of values.entries()) {
    const alias = schema.parse(value);
    if (
      alias.alias !== (index === 0 ? "tullyelly.com" : "www.tullyelly.com") ||
      alias.projectId !== projectId ||
      alias.deploymentId !== deploymentId
    )
      throw new Error("code.domain-drift");
  }
}

export async function readHealthResponse(options: {
  stagedHost: string;
  publicDomain: boolean;
  publicOrigin?: "https://tullyelly.com" | "https://www.tullyelly.com";
  path: string;
  bypassSecret?: string;
  allowLoginRedirect?: boolean;
  onLoginRedirect?: (protocol: "http" | "streamed") => void;
  timeoutMs: number;
  fetcher?: typeof fetch;
}) {
  if (!/^[a-z0-9-]+\.vercel\.app$/.test(options.stagedHost))
    throw new Error("code.health-host");
  if (options.publicOrigin && ![apex, www].includes(options.publicOrigin))
    throw new Error("code.health-host");
  const base = options.publicDomain
    ? (options.publicOrigin ?? apex)
    : `https://${options.stagedHost}`;
  const initial = new URL(options.path, base);
  if (
    initial.origin !== base ||
    initial.username ||
    initial.password ||
    initial.hash
  )
    throw new Error("code.health-path");
  const fetcher = options.fetcher ?? fetch;
  // One deadline covers both requests. Public-domain reads never receive bypass credentials.
  const signal = AbortSignal.timeout(options.timeoutMs);
  const request = (url: URL) =>
    fetcher(url, {
      method: "GET",
      redirect: "manual",
      credentials: "omit",
      signal,
      headers:
        !options.publicDomain && options.bypassSecret
          ? { "x-vercel-protection-bypass": options.bypassSecret }
          : {},
    });
  let url = initial;
  let response = await request(url);
  if (response.redirected) throw new Error("code.health-unexpected-follow");
  if (options.publicDomain && redirects.has(response.status)) {
    const location = response.headers.get("location");
    if (!location) throw new Error("code.health-redirect");
    const next = new URL(location, url);
    if (
      next.origin === www &&
      !next.username &&
      !next.password &&
      !next.hash &&
      next.pathname === url.pathname &&
      next.search === url.search
    ) {
      url = next;
      response = await request(url);
      if (response.redirected) throw new Error("code.health-unexpected-follow");
    } else if (!options.allowLoginRedirect)
      throw new Error("code.health-redirect");
  }
  if (redirects.has(response.status)) {
    // Authorization redirects are inspected, never followed, on the actual checked origin.
    const location = response.headers.get("location");
    if (!location || !options.allowLoginRedirect)
      throw new Error("code.health-redirect");
    const login = new URL(location, url);
    if (
      login.origin !== url.origin ||
      login.username ||
      login.password ||
      login.hash ||
      !["/login", "/api/auth/signin"].includes(login.pathname)
    )
      throw new Error("code.health-login-redirect");
    options.onLoginRedirect?.("http");
  } else if (response.status === 200 && options.allowLoginRedirect) {
    verifyStreamedLoginRedirect(await response.clone().text(), url);
    options.onLoginRedirect?.("streamed");
  }
  return response;
}

export async function checkCodeHealth(options: {
  deployment: CodeDeployment;
  projectId: string;
  publicDomain: boolean;
  operation: "deploy" | "rollback";
  bypassSecret?: string;
  fetcher?: typeof fetch;
}) {
  const d = options.deployment;
  if (
    d.projectId !== options.projectId ||
    d.target !== "production" ||
    d.readyState !== "READY"
  )
    throw new Error("code.health-deployment-identity");
  const read = (
    path: string,
    timeoutMs: number,
    allowLoginRedirect = false,
    onLoginRedirect?: (protocol: "http" | "streamed") => void,
  ) =>
    readHealthResponse({
      stagedHost: d.url,
      publicDomain: options.publicDomain,
      path,
      bypassSecret: options.bypassSecret,
      fetcher: options.fetcher,
      timeoutMs,
      allowLoginRedirect,
      onLoginRedirect,
    });
  const paths =
    options.operation === "deploy"
      ? (["/", "/shaolin", "/stats"] as const)
      : (["/", "/shaolin"] as const);
  for (const path of paths) {
    const r = await read(path, 30000);
    if (r.status !== 200)
      throw new CodeHealthError(path, r.status, "http-status");
    if (!(await r.text()).toLowerCase().includes("<!doctype html>"))
      throw new CodeHealthError(path, r.status, "missing-doctype");
  }
  if (options.operation === "rollback") return;
  if ((await read("/api/cron/analytics", 15000)).status !== 401)
    throw new Error("code.health-cron-authorization");
  let loginDenied = false;
  const admin = await read("/mark2/admin/analytics", 15000, true, () => {
    loginDenied = true;
  });
  if (
    ![302, 303, 307, 308, 401, 403, 404].includes(admin.status) &&
    !(admin.status === 200 && loginDenied)
  )
    throw new Error("code.health-owner-authorization");
}
