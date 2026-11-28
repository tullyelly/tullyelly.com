import Link from "next/link";
import { flattenLinks } from "@/lib/menu.flatten";
import type { NavItem, Persona } from "@/types/nav";

/** Only pass the existing server-filtered menu, never an unfiltered fallback. */
export default function PersonaApplications({
  tree,
  persona,
}: {
  tree: NavItem[];
  persona: Persona;
}) {
  const seen = new Set<string>();
  const links = flattenLinks(tree).filter((link) => {
    if (
      link.persona?.id !== persona ||
      link.href === `/${persona}` ||
      seen.has(link.href)
    )
      return false;
    seen.add(link.href);
    return true;
  });
  if (!links.length) return null;
  return (
    <nav aria-label={`${persona} applications`} className="space-y-3">
      <h2 className="text-xl font-semibold">Explore {persona}</h2>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <li key={link.id} className="min-w-0">
            {link.kind === "external" ? (
              <a
                href={link.href}
                target={link.target ?? "_blank"}
                rel="noopener noreferrer"
                className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-border bg-white/70 px-4 py-3 link-blue"
              >
                <span className="break-words">{link.label}</span>
                <span aria-label="External link">↗</span>
              </a>
            ) : (
              <Link
                href={link.href}
                className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-border bg-white/70 px-4 py-3 link-blue"
              >
                <span className="break-words">{link.label}</span>
                <span aria-hidden="true">→</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
