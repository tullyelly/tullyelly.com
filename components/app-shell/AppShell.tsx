import ClientAppShell from "./ClientAppShell";
import type { NavItem } from "@/types/nav";
import type { Crumb } from "@/app/_menu/metadata";
import Footer from "@/app/_components/Footer";
import { BreadcrumbTrail } from "@/components/ui/breadcrumb";

type AppShellProps = {
  announcement?: string | null;
  menuItems: NavItem[];
  breadcrumbs: Crumb[];
  siteTitle: string;
  children: React.ReactNode;
};

export default function AppShell({
  announcement,
  menuItems,
  breadcrumbs,
  siteTitle,
  children,
}: AppShellProps) {
  return (
    <ClientAppShell
      announcement={announcement}
      menuItems={menuItems}
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
