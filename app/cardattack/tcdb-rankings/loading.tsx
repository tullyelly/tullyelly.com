import { AppSkeleton } from "@/components/app-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

const ROW_COUNT = 10;
const RANKING_ROW_KEYS = Array.from(
  { length: ROW_COUNT },
  (_, index) => `tcdb-ranking-row-${index + 1}`,
);

export default function Loading() {
  return (
    <main
      className="mx-auto max-w-5xl space-y-6 p-6"
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-8 w-40 rounded-md bg-border-subtle" />
        <Skeleton className="h-6 w-32 rounded-full bg-border-subtle/80" />
      </div>
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <Skeleton className="h-9 w-full rounded-md bg-border-subtle/80 md:w-64" />
          <Skeleton className="h-9 w-24 rounded-full bg-border-subtle/80 md:w-32" />
        </div>
        <Skeleton className="h-9 w-40 rounded-md bg-border-subtle/80" />
      </div>
      <div className="space-y-3">
        {RANKING_ROW_KEYS.map((key) => (
          <AppSkeleton.TableRow key={key} cells={5} />
        ))}
      </div>
    </main>
  );
}
