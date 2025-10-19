import Link from "next/link";

export default function NotFound() {
  return (
    <main className="max-w-3xl mx-auto py-24 text-center space-y-4">
      <h1 className="text-2xl font-semibold">Nothing to see here.</h1>
      <p>That post or tag does not exist.</p>
      <Link className="underline" href="/shaolin">
        Back to chronicles
      </Link>
    </main>
  );
}
