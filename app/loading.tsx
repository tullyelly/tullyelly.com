import { AppSkeleton } from "@/components/app-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section
      aria-busy="true"
      aria-live="polite"
      className="space-y-8"
      role="status"
    >
      <span className="sr-only">Loading page content</span>

      <div aria-hidden="true" className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-8 w-2/3 max-w-md" />
          <Skeleton className="h-4 w-full max-w-2xl" />
          <Skeleton className="h-4 w-4/5 max-w-xl" />
        </div>

        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-32 rounded-full" />
        </div>

        <AppSkeleton.Card lines={6} />
      </div>
    </section>
  );
}
