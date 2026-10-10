import Link from "next/link";
import {
  formatViews,
  getPublicAnalytics,
} from "@/lib/analytics-archive/public";

/** Archive-only server component; missing analytics never blocks the content. */
export async function PageViewCounter({ path }: { path: string }) {
  const { snapshot, pages } = await getPublicAnalytics();
  if (!pages.some((page) => page.path === path)) return null;
  if (!snapshot?.from || snapshot.verified === "0")
    return (
      <p className="text-sm text-muted-foreground">Page views unavailable.</p>
    );
  const views = snapshot.pages.find((page) => page.path === path)?.views ?? "0";
  return (
    <p className="text-sm text-muted-foreground">
      {formatViews(views)} archived views from {snapshot.from} through{" "}
      {snapshot.through} UTC
      {snapshot.verified !== snapshot.expected
        ? "; coverage incomplete"
        : ""}.{" "}
      <Link href="/stats" className="link-blue">
        Traffic statistics
      </Link>
    </p>
  );
}
