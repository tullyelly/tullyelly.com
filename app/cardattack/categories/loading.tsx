import DataPageShell from "@/components/layout/DataPageShell";
export default function Loading() {
  return (
    <DataPageShell>
      <p role="status" aria-live="polite">
        Loading category counts…
      </p>
    </DataPageShell>
  );
}
