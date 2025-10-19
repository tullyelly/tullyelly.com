import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default function MenuTargetPage() {
  if (process.env.E2E_MODE !== "1") {
    notFound();
  }

  return (
    <section className="mx-auto flex min-h-[30vh] max-w-3xl flex-col gap-4 py-10">
      <h1
        data-testid="menu-test-target-heading"
        className="text-xl font-semibold"
      >
        Menu Target Page
      </h1>
      <p className="text-muted-foreground">Navigation success placeholder.</p>
    </section>
  );
}
