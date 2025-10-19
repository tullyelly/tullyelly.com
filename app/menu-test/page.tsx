import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default function MenuTestPage() {
  if (process.env.E2E_MODE !== "1") {
    notFound();
  }

  return (
    <section className="mx-auto flex min-h-[40vh] max-w-4xl flex-col gap-4 py-10">
      <h1 className="text-2xl font-semibold">Menu Interaction Testbed</h1>
      <p data-testid="menu-test-copy" className="text-muted-foreground">
        This page exists solely for Playwright coverage; navigation surfaces are
        rendered in the global layout.
      </p>
    </section>
  );
}
