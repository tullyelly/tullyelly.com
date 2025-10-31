import AdminAuthzPanel from "./authz/ClientPanel";
import { listMemberships } from "./authz/actions";
import { canonicalUrl } from "@/lib/share/canonicalUrl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const pageTitle = "mark2 admin tools | tullyelly";
const pageDescription =
  "Manage mark2 memberships; grant or revoke access; refresh authorization caches for tullyelly operations.";

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: canonicalUrl("mark2/admin") },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/mark2/admin",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: pageTitle,
    description: pageDescription,
  },
};

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
