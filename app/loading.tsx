import { AppSkeleton } from "@/components/app-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div
      id="page-root"
      className="flex min-h-dvh flex-col bg-[var(--page-bg,white)]"
    >
      <header className="site-header bg-[var(--blue)] text-white">
        <div className="sticky top-0 z-50 border-b border-white/10 bg-[var(--blue)]/95 pb-2 pt-[max(env(safe-area-inset-top),0px)] shadow-sm backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 md:px-6">
            <Skeleton className="h-8 w-32 rounded-full bg-white/20" />
            <div className="hidden items-center gap-2 md:flex">
              <Skeleton className="h-6 w-24 bg-white/20" />
              <Skeleton className="h-6 w-24 bg-white/20" />
              <Skeleton className="h-6 w-24 bg-white/20" />
            </div>
            <Skeleton className="h-9 w-9 rounded-full bg-white/20" />
          </div>
        </div>
        <div className="hidden border-b border-white/10 bg-[var(--blue)]/90 md:block">
          <div className="mx-auto flex w-full max-w-7xl gap-6 px-6 py-4">
            <div className="flex w-72 flex-col gap-3">
              <Skeleton className="h-4 w-40 bg-white/25" />
              <Skeleton className="h-4 w-48 bg-white/20" />
              <Skeleton className="h-4 w-44 bg-white/20" />
              <Skeleton className="h-4 w-52 bg-white/20" />
            </div>
            <div className="flex-1 space-y-3">
              <Skeleton className="h-9 w-full rounded-md bg-white/15" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24 rounded-full bg-white/20" />
                <Skeleton className="h-9 w-20 rounded-full bg-white/20" />
                <Skeleton className="h-9 w-16 rounded-full bg-white/20" />
              </div>
            </div>
          </div>
        </div>
      </header>
      <main
        id="page-main"
        tabIndex={-1}
        className="m-0 flex-1 bg-transparent p-0"
      >
        <div
          id="content-pane"
          className="crop-block-margins mx-auto max-w-[var(--content-max)] bg-white px-6 py-6 shadow-sm md:px-8 md:py-8 lg:px-10"
        >
          <section
            aria-live="polite"
            aria-busy="true"
            className="space-y-6"
            role="status"
          >
            <div className="flex flex-wrap items-center gap-4">
              <Skeleton className="h-6 w-32 rounded-md bg-border-subtle" />
              <Skeleton className="h-6 w-24 rounded-md bg-border-subtle/80" />
            </div>
            <AppSkeleton.Card lines={6} />
          </section>
        </div>
      </main>
      <footer className="mt-auto border-t border-border bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-6 md:px-8 lg:px-10">
          <Skeleton className="h-4 w-40 bg-border-subtle/90" />
          <Skeleton className="h-4 w-24 bg-border-subtle/80" />
        </div>
      </footer>
    </div>
  );
}
