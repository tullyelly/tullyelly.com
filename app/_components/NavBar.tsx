import Link from "next/link";

export default function NavBar() {
  return (
    <div className="w-full border-b bg-blue on-blue">
      <div className="mx-auto flex h-12 max-w-[var(--content-max)] items-center px-6">
        <Link
          href="/"
          className="font-semibold underline underline-offset-4"
          aria-label="tullyelly; home"
        >
          tullyelly
        </Link>
        <nav aria-label="Main" className="ml-auto">
          <ul className="flex items-center gap-8">
            <li>
              <Link href="/ui-lab" className="underline underline-offset-4">
                UI Lab
              </Link>
            </li>
            <li>
              <Link
                href="/credits"
                className="underline underline-offset-4"
                title="Sources, credits, and shout-outs."
              >
                Flowers
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
