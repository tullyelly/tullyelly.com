import { AppSkeleton } from "@/components/app-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

const ROW_COUNT = 10;
const SCROLL_ROW_KEYS = Array.from(
  { length: ROW_COUNT },
  (_, index) => `scroll-row-${index + 1}`,
);

export default function Loading() {
  return (
    <section
      id="scrolls-root"
      className="flex min-h-screen flex-col gap-4"
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <Skeleton className="h-7 w-48 rounded-md bg-border-subtle" />
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm">
        <Skeleton className="h-9 w-64 max-w-full rounded-md bg-border-subtle/80" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-full bg-border-subtle/80" />
          <Skeleton className="h-9 w-24 rounded-full bg-border-subtle/80" />
        </div>
      </div>
      <div className="space-y-3">
        {SCROLL_ROW_KEYS.map((key) => (
          <AppSkeleton.TableRow key={key} cells={5} />
        ))}
      </div>
    </section>
  );
}
