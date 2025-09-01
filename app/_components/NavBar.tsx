import Link from 'next/link';

type NavLink = { href: string; label: string };

const brand = 'tullyelly';
const uiLabEnabled = process.env.NEXT_PUBLIC_UI_LAB_ENABLED === '1';
const typeDemoEnabled = process.env.NEXT_PUBLIC_TYPOGRAPHY_ENABLED === '1';

const baseLinks: NavLink[] = [{ href: '/shaolin-scrolls', label: 'Shaolin Scrolls' }];
const extraLinks: NavLink[] = [
  ...(uiLabEnabled ? [{ href: '/ui-lab', label: 'UI Lab' }] : []),
  ...(typeDemoEnabled ? [{ href: '/typography-demo', label: 'Typography' }] : []),
];

const links = [...baseLinks, ...extraLinks];

export default function NavBar() {
  return (
    <div className="w-full border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold" aria-label="tullyelly — home">
          {brand}
        </Link>

        <nav aria-label="Main">
          <ul className="flex gap-6">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <span data-theme-slot="" aria-hidden="true" />
          <span data-menu-slot="" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

