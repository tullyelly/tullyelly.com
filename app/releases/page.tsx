export const dynamic = "force-dynamic";
export const revalidate = 0;

import { fetchReleases } from "@/app/lib/fetchReleases";

export default async function ReleasesPage() {
  const releases = await fetchReleases();
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Releases</h1>
      {releases.length === 0 ? (
        <p className="opacity-70">No releases yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {releases.map((r) => (
            <li key={r.id} className="rounded border p-3">
              <pre className="text-sm">{JSON.stringify(r, null, 2)}</pre>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
