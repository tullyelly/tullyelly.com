export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Hello, Admin.</h1>
      <p className="mt-2 text-sm text-gray-500">
        This page is protected by DB-backed capabilities (admin.app.view).
      </p>
    </main>
  );
}
