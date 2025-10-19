import AdminAuthzPanel from "./authz/ClientPanel";
import { listMemberships } from "./authz/actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminPage() {
  const memberships = await listMemberships();
  return (
    <main className="space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Admin Tools</h1>
        <p className="text-sm text-gray-500">
          Memberships update immediately; grants and revokes refresh auth policy
          caches.
        </p>
      </header>
      <AdminAuthzPanel initialMemberships={memberships} />
    </main>
  );
}
