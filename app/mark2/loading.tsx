import { AppSkeleton } from "@/components/app-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main
      className="mx-auto max-w-4xl space-y-12 p-6"
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <section className="space-y-4">
        <Skeleton className="h-8 w-48 rounded-md bg-border-subtle" />
        <Skeleton className="h-4 w-full rounded-md bg-border-subtle/80" />
        <Skeleton className="h-4 w-11/12 rounded-md bg-border-subtle/80" />
      </section>
      <section>
        <div className="grid gap-4 md:grid-cols-3">
          <AppSkeleton.Card lines={4} />
          <AppSkeleton.Card lines={4} />
          <AppSkeleton.Card lines={4} />
        </div>
      </section>
    </main>
  );
}
