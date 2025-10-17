export const dynamic = "force-static";

export default function Mark2BlueprintLanding() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold font-mono">mark2: blueprint</h1>
        <p className="text-base text-muted-foreground">
          A quick landing page to verify breadcrumb interactions across nested
          routes.
        </p>
      </header>
      <section className="space-y-3">
        <p className="leading-relaxed">
          When this route is active, breadcrumbs should resolve to the mark2
          section without introducing an extra blueprint crumb. This mirrors the
          behaviour we want for marketing landing pages that alias deeper paths.
        </p>
      </section>
    </main>
  );
}
