import Link from "next/link";

export const metadata = { title: "Access denied" };

export default function ForbiddenPage() {
  return (
    <main className="mx-auto max-w-xl space-y-4 p-8">
      <h1 className="text-2xl font-semibold">Access denied</h1>
      <p className="text-muted-foreground">
        You’re signed in, but your account isn’t authorized for this page.
      </p>
      <div className="flex gap-4">
        <Link className="underline" href="/">
          Home
        </Link>
      </div>
    </main>
  );
}
