import ClientAppShell from "./ClientAppShell";
import PersonaChip from "./PersonaChip";
import type { NavItem } from "@/types/nav";
import type { Crumb } from "@/app/_menu/metadata";
import type { MenuPayload, PersonaChildren } from "@/lib/menu/types";
import type { ResolvedPersona } from "@/lib/menu/persona";
import Footer from "@/app/_components/Footer";
import { BreadcrumbTrail } from "@/components/ui/breadcrumb";

type AppShellProps = {
  announcement?: string | null;
  menuItems: NavItem[];
  menu: MenuPayload;
  menuChildren: PersonaChildren;
  breadcrumbs: Crumb[];
  siteTitle: string;
  currentPersona: ResolvedPersona;
  children: React.ReactNode;
};

export default function AppShell({
  announcement,
  menuItems,
  menu,
  menuChildren,
  breadcrumbs,
  siteTitle,
  currentPersona,
  children,
}: AppShellProps) {
  return (
    <ClientAppShell
      announcement={announcement}
      menuItems={menuItems}
      menu={menu}
      menuChildren={menuChildren}
      siteTitle={siteTitle}
      initialPersona={currentPersona}
      footerSlot={<Footer />}
    >
      <>
        {breadcrumbs.length ? (
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="max-w-full">
                <BreadcrumbTrail crumbs={breadcrumbs} />
              </div>
              {currentPersona ? (
                <PersonaChip persona={currentPersona} className="shrink-0" />
              ) : null}
            </div>
          </div>
        ) : null}
        {children}
      </>
    </ClientAppShell>
  );
}
