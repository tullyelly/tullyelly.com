export default function CategoryUnavailable() {
  return (
    <div role="status" className="rounded-xl border p-4">
      <h2 className="text-xl font-semibold">Category counts unavailable</h2>
      <p>
        Measurements could not be loaded. Please try again later. First-time
        setup requires the category migrations before use.
      </p>
    </div>
  );
}
