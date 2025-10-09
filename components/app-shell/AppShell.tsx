import ClientAppShell from "./ClientAppShell";
import type { NavItem } from "@/types/nav";
import type { Crumb } from "@/app/_menu/metadata";
import type { MenuPayload, PersonaChildren } from "@/lib/menu/types";
import Footer from "@/app/_components/Footer";
import { BreadcrumbTrail } from "@/components/ui/breadcrumb";

type AppShellProps = {
  announcement?: string | null;
  menuItems: NavItem[];
  menu: MenuPayload;
  menuChildren: PersonaChildren;
  breadcrumbs: Crumb[];
  siteTitle: string;
  children: React.ReactNode;
};

export default function AppShell({
  announcement,
  menuItems,
  menu,
  menuChildren,
  breadcrumbs,
  siteTitle,
  children,
}: AppShellProps) {
  return (
    <ClientAppShell
      announcement={announcement}
      menuItems={menuItems}
      menu={menu}
      menuChildren={menuChildren}
      siteTitle={siteTitle}
      footerSlot={<Footer />}
    >
      <>
        {breadcrumbs.length ? (
          <div className="mb-6">
            <BreadcrumbTrail crumbs={breadcrumbs} />
          </div>
        ) : null}
        {children}
      </>
    </ClientAppShell>
  );
}
