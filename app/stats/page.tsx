import Link from "next/link";
import DataPageShell from "@/components/layout/DataPageShell";
import SectionHeader from "@/components/layout/SectionHeader";
import { TrafficChart } from "@/components/analytics/TrafficChart";
import {
  formatViews,
  getPublicAnalytics,
} from "@/lib/analytics-archive/public";
import { canonicalUrl } from "@/lib/share/canonicalUrl";
import {
  SHARED_OPEN_GRAPH_FIELDS,
  SHARED_TWITTER_FIELDS,
} from "@/lib/seo/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
const title = "Traffic statistics | tullyelly";
const description =
  "Archived production views for public Chronicles and traffic statistics, with UTC date coverage.";
export const metadata = {
  title,
  description,
  alternates: { canonical: canonicalUrl("stats") },
  openGraph: {
    ...SHARED_OPEN_GRAPH_FIELDS,
    title,
    description,
    url: "/stats",
    type: "website",
  },
  twitter: { ...SHARED_TWITTER_FIELDS, title, description },
};
export default async function TrafficStatisticsPage() {
  const { snapshot, pages } = await getPublicAnalytics();
  const rankings = (snapshot?.pages ?? [])
    .map((row) => ({
      ...row,
      page: pages.find((page) => page.path === row.path),
    }))
    .filter((row) => row.page)
    .sort((a, b) =>
      BigInt(a.views) === BigInt(b.views)
        ? a.path.localeCompare(b.path)
        : BigInt(a.views) > BigInt(b.views)
          ? -1
          : 1,
    )
    .slice(0, 20);
  return (
    <DataPageShell>
      <SectionHeader title="Traffic statistics" />
      <p>
        Production traffic for currently public Chronicles, the Chronicle index
        and this statistics page. Other site routes are outside this public
        summary.
      </p>
      {!snapshot?.from || snapshot.verified === "0" ? (
        <p role="status">
          Archived traffic is unavailable. Content remains available; check back
          later.
        </p>
      ) : (
        <>
          <p className="text-xl font-semibold">
            {formatViews(snapshot.total)} total archived public views
          </p>
          <p>
            Coverage: {snapshot.from} through {snapshot.through} UTC;{" "}
            {snapshot.verified} of {snapshot.expected} days verified.{" "}
            {snapshot.verified !== snapshot.expected
              ? "Coverage is incomplete; missing days are not zero traffic."
              : "All days within this range are verified."}{" "}
            Earlier history is not included.
          </p>
          <p>
            Last archive update: {snapshot.updated ?? "Unavailable"} (UTC).
            Cached displays may take five minutes to refresh.
          </p>
          <SectionHeader title="Daily views" />
          <p>
            Latest 90 calendar days within archive coverage. Gaps mean
            unverified data.
          </p>
          <TrafficChart rows={snapshot.trend} />
          <details>
            <summary>Daily values</summary>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th scope="col">UTC day</th>
                  <th scope="col">Archived views</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.trend.map((row) => (
                  <tr key={row.day}>
                    <th scope="row">{row.day}</th>
                    <td>
                      {row.views === null
                        ? "Unverified"
                        : formatViews(row.views)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
          <SectionHeader title="Most-viewed public pages" />
          {rankings.length ? (
            <ol className="list-decimal pl-6">
              {rankings.map((row) => (
                <li key={row.page!.id}>
                  <Link className="link-blue" href={row.page!.path}>
                    {row.page!.title}
                  </Link>
                  {": "}
                  {formatViews(row.views)} views
                </li>
              ))}
            </ol>
          ) : (
            <p>
              No views recorded on the listed public pages during verified days.
            </p>
          )}
        </>
      )}
      <Link className="link-blue" href="/shaolin">
        Browse Chronicles
      </Link>
    </DataPageShell>
  );
}
