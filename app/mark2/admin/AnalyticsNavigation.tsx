import Link from "next/link";
import { requireAnalyticsOwner } from "@/lib/analytics-archive/authorization";

/** Request-scoped discovery; the enclosing Admin layout also enforces app.view. */
export default async function AnalyticsNavigation() {
  try {
    await requireAnalyticsOwner();
  } catch {
    return null;
  }
  return (
    <nav aria-label="Analytics administration">
      <Link href="/mark2/admin/analytics" className="link-blue">
        Analytics administration
      </Link>
    </nav>
  );
}
