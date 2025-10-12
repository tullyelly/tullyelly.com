import ActivityDemo from "./ActivityDemo";

export const metadata = {
  title: "Activity Demo",
};

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold">Activity status demo</h1>
        <p className="text-base text-muted-foreground">
          Launch simulated jobs to see the background activity toaster in
          action.
        </p>
      </section>
      <ActivityDemo />
    </main>
  );
}
