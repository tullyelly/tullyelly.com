import { notFound, redirect } from "next/navigation";
import DataPageShell from "@/components/layout/DataPageShell";
import SectionHeader from "@/components/layout/SectionHeader";
import { requireAnalyticsOwner } from "@/lib/analytics-archive/authorization";
import {
  AuthzForbiddenError,
  AuthzUnauthenticatedError,
} from "@/lib/authz/types";
import {
  analyticsErrorLabels,
  getAnalyticsStatus,
  type RunStatus,
} from "@/lib/analytics-archive/status";
import { fmtDateTime } from "@/lib/datetime";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import {
  SHARED_OPEN_GRAPH_FIELDS,
  SHARED_TWITTER_FIELDS,
} from "@/lib/seo/constants";
import AnalyticsControls from "./Controls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;
const title = "Analytics administration | tullyelly";
const description =
  "Owner analytics archive operations, daily freshness and resumable history imports.";
export const metadata = {
  title,
  description,
  robots: { index: false, follow: false },
  alternates: { canonical: canonicalUrl("mark2/admin/analytics") },
  openGraph: {
    ...SHARED_OPEN_GRAPH_FIELDS,
    title,
    description,
    url: "/mark2/admin/analytics",
    type: "website",
  },
  twitter: { ...SHARED_TWITTER_FIELDS, title, description },
};
function runLabel(run: RunStatus | null) {
  return run
    ? `${fmtDateTime(run.finished_at ?? run.started_at)}; ${run.lane ?? "legacy lane unknown"}; ${run.status}; ${run.processed_days} days committed`
    : "None recorded";
}
export default async function AnalyticsAdminPage() {
  try {
    await requireAnalyticsOwner();
  } catch (error) {
    if (error instanceof AuthzUnauthenticatedError)
      redirect("/login?callbackUrl=%2Fmark2%2Fadmin%2Fanalytics");
    if (error instanceof AuthzForbiddenError) notFound();
    throw error;
  }
  const status = await getAnalyticsStatus();
  const history = status.history;
  const dailyPending =
    status.dailyNext && status.range
      ? Math.max(
          0,
          Math.floor(
            (Date.parse(status.range.through) - Date.parse(status.dailyNext)) /
              86400000,
          ) + 1,
        )
      : null;
  const pending = history
    ? history.total - history.verified - history.unavailable
    : 0;
  return (
    <DataPageShell>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Analytics administration</h1>
        <p>
          Collection is {status.enabled ? "enabled" : "disabled"}. All archive
          days use UTC.
        </p>
      </header>
      <section className="space-y-3">
        <SectionHeader title="Daily collection" />
        <p
          role="status"
          className={
            status.stale ? "text-destructive" : "text-muted-foreground"
          }
        >
          {status.stale
            ? "Stale: no successful daily collection in the last 36 hours."
            : "Daily collection is fresh."}
        </p>
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="font-semibold">Last attempted run</dt>
            <dd>{runLabel(status.lastAttempt)}</dd>
          </div>
          <div>
            <dt className="font-semibold">Last successful run (any lane)</dt>
            <dd>{runLabel(status.lastSuccess)}</dd>
          </div>
          <div>
            <dt className="font-semibold">Last successful daily run</dt>
            <dd>{runLabel(status.lastDailySuccess)}</dd>
          </div>
          <div>
            <dt className="font-semibold">Latest fully archived date</dt>
            <dd>
              {status.latestDay ?? "None verified"}; earlier dates may contain
              gaps
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Daily catch-up cursor</dt>
            <dd>
              {status.dailyNext
                ? `${status.dailyNext}${status.range && status.dailyNext > status.range.through ? "; caught up" : `; ${dailyPending ?? "unknown"} completed days pending`}`
                : "Not initialized"}
            </dd>
          </div>
        </dl>
        {status.lastAttempt?.error_code && (
          <p role="alert">
            {analyticsErrorLabels[status.lastAttempt.error_code] ??
              "The last operation failed; test connection and retry."}
          </p>
        )}
        {status.error && <p role="alert">{status.error}</p>}
        <p className="text-sm text-muted-foreground">
          Execution failures use the configured error reporter. Missing-run
          notifications are not configured; this stale indicator does not send
          an external alert.
        </p>
      </section>
      <section className="space-y-3">
        <SectionHeader title="History import" />
        <p>
          {status.range
            ? `Supported selection: ${status.range.from} through ${status.range.through}, inclusive (UTC).`
            : "Configure ANALYTICS_AVAILABLE_FROM to confirm the first fully available UTC day. Collection is unavailable until the supported window is configured."}
        </p>
        {history ? (
          <div className="space-y-2 text-sm">
            <p>
              Saved range: {history.start_day} through {history.end_day}. Next
              day: {history.next_day}.
            </p>
            <p>
              {history.verified} of {history.total} days verified;{" "}
              {history.unavailable} unavailable; {history.incomplete}{" "}
              incomplete; {history.api_failures} API failures;{" "}
              {history.total - history.recorded} unattempted.
            </p>
            <p>
              {pending} days pending verification.{" "}
              {history.next_day > history.end_day
                ? "No batches remain for this selection."
                : "Use Continue import for the next bounded batch."}
            </p>
          </div>
        ) : (
          <p>
            No selected import range. Phase 1 cursors without a saved range
            require an explicit selection.
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Backfill gaps do not establish daily freshness. Unavailable history
          and verified zero traffic remain distinct.
        </p>
        <AnalyticsControls
          enabled={status.enabled}
          range={status.range}
          hasPendingImport={Boolean(
            history && history.next_day <= history.end_day,
          )}
        />
      </section>
    </DataPageShell>
  );
}
