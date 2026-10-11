import "server-only";
import { z } from "zod";

const metrics = z.object({
  pageviews: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  visitors: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
});
const responseSchema = z.object({
  version: z.literal(1),
  query: z.object({}).passthrough(),
  data: z.array(
    metrics.extend({
      requestPath: z.string().optional(),
      timestamp: z.string().optional(),
    }),
  ),
});
export type Metrics = z.infer<typeof metrics>;
export type Page = Metrics & { requestPath: string };
export class AnalyticsApiError extends Error {
  constructor(
    public readonly kind: "api_failure" | "incomplete",
    message: string,
  ) {
    super(message);
  }
}
export class AnalyticsBudgetError extends Error {}

export function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}
export function addDays(day: string, days: number): string {
  assertDay(day);
  return utcDay(new Date(Date.parse(day) + days * 86400000));
}
export function assertDay(day: string): void {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
    !Number.isFinite(Date.parse(day)) ||
    utcDay(new Date(day)) !== day
  ) {
    throw new Error("Expected a UTC calendar date (YYYY-MM-DD).");
  }
}
export function createAnalyticsClient(
  fetcher: typeof fetch = fetch,
  sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms)),
  budget?: { deadlineAt: number; timeoutMs: number },
) {
  const config = z
    .object({
      ANALYTICS_VERCEL_TOKEN: z.string().trim().min(1),
      ANALYTICS_PROJECT_ID: z.string().trim().min(1),
      ANALYTICS_TEAM_ID: z.preprocess(
        (value) => (value === "" ? undefined : value),
        z.string().trim().min(1).optional(),
      ),
    })
    .safeParse(process.env);
  if (!config.success)
    throw new Error(
      "Configure ANALYTICS_VERCEL_TOKEN, ANALYTICS_PROJECT_ID and, for team projects, ANALYTICS_TEAM_ID.",
    );
  const settings = config.data;
  async function query(
    day: string,
    by: "day" | "requestPath",
    excluded: string[] = [],
  ) {
    assertDay(day);
    const url = new URL(
      "https://api.vercel.com/v1/query/web-analytics/visits/aggregate",
    );
    const filter = [
      "environment eq 'production'",
      ...excluded.map(
        (path) => `requestPath ne '${path.replaceAll("'", "''")}'`,
      ),
    ].join(" and ");
    for (const [key, value] of Object.entries({
      projectId: settings.ANALYTICS_PROJECT_ID,
      since: `${day}T00:00:00.000Z`,
      until: `${day}T23:59:59.999Z`,
      by,
      limit: "100",
      filter,
    }))
      url.searchParams.set(key, value);
    if (settings.ANALYTICS_TEAM_ID)
      url.searchParams.set("teamId", settings.ANALYTICS_TEAM_ID);
    // No documented pagination or maximum filter length. Fail closed before oversized requests.
    if (url.toString().length > 24000)
      throw new AnalyticsApiError(
        "incomplete",
        "Path exclusions exceed the safe request size; complete enumeration requires an alternative source.",
      );
    for (let attempt = 0; attempt < 3; attempt++) {
      const remaining = (budget?.deadlineAt ?? Infinity) - Date.now();
      if (remaining <= 0)
        throw new AnalyticsBudgetError("Invocation time budget reached.");
      const controller = new AbortController();
      const timer = setTimeout(
        () => controller.abort(),
        Math.min(budget?.timeoutMs ?? 10000, remaining),
      );
      let transient = false;
      try {
        const response = await fetcher(url, {
          headers: {
            Authorization: `Bearer ${settings.ANALYTICS_VERCEL_TOKEN}`,
          },
          signal: controller.signal,
          cache: "no-store",
          redirect: "error",
        });
        if (!response.ok) {
          transient = response.status === 429 || response.status >= 500;
          if (!transient || attempt === 2)
            throw new AnalyticsApiError(
              "api_failure",
              `Vercel analytics HTTP ${response.status}; check token access, project/team, plan retention and rate limits. Response body omitted.`,
            );
        } else {
          const parsed = responseSchema.safeParse(await response.json());
          if (!parsed.success)
            throw new AnalyticsApiError(
              "api_failure",
              "Vercel analytics response does not match the documented aggregate contract; review API schema. Payload omitted.",
            );
          return parsed.data.data;
        }
      } catch (error) {
        if (budget && Date.now() >= budget.deadlineAt)
          throw new AnalyticsBudgetError("Invocation time budget reached.");
        if (error instanceof AnalyticsApiError) throw error;
        transient = true;
        if (attempt === 2)
          throw new AnalyticsApiError(
            "api_failure",
            "Vercel analytics request timed out or failed; check connectivity. Request details omitted.",
          );
      } finally {
        clearTimeout(timer);
      }
      if (transient)
        await sleep(
          Math.min(
            250 * 2 ** attempt,
            Math.max(0, (budget?.deadlineAt ?? Infinity) - Date.now()),
          ),
        );
    }
    throw new AnalyticsApiError(
      "api_failure",
      "Vercel analytics retries exhausted.",
    );
  }
  return {
    async pages(day: string, excluded: string[]) {
      const rows = await query(day, "requestPath", excluded);
      const pages: Page[] = [];
      let others = false;
      for (const row of rows) {
        if (row.requestPath === "Others") {
          others = true;
          continue;
        }
        if (
          !row.requestPath?.startsWith("/") ||
          row.requestPath.includes("?") ||
          row.requestPath.includes("#") ||
          excluded.includes(row.requestPath) ||
          pages.some((p) => p.requestPath === row.requestPath)
        )
          throw new AnalyticsApiError(
            "incomplete",
            "Invalid, duplicate or already excluded requestPath; cannot verify coverage.",
          );
        pages.push({
          requestPath: row.requestPath,
          pageviews: row.pageviews,
          visitors: row.visitors,
        });
      }
      if (others && !pages.length)
        throw new AnalyticsApiError(
          "incomplete",
          "Others bucket without enumerable paths; coverage is incomplete.",
        );
      return { pages, others };
    },
    async total(day: string): Promise<Metrics | null> {
      const rows = await query(day, "day");
      if (!rows.length) return null; // Empty history is not proof of zero traffic.
      if (
        rows.length !== 1 ||
        Date.parse(rows[0].timestamp ?? "") !==
          Date.parse(`${day}T00:00:00.000Z`)
      )
        throw new AnalyticsApiError(
          "incomplete",
          "Unexpected daily time bucket; verify UTC boundaries.",
        );
      return { pageviews: rows[0].pageviews, visitors: rows[0].visitors };
    },
  };
}
export type AnalyticsClient = ReturnType<typeof createAnalyticsClient>;
