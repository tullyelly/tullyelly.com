import ClientAppShell from "./ClientAppShell";
import PersonaChip from "./PersonaChip";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import E2EOnlyNav from "@/components/e2e/E2EOnlyNav";
import type { NavItem } from "@/types/nav";
import type { MenuPayload, PersonaChildren } from "@/lib/menu/types";
import type { ResolvedPersona } from "@/lib/menu/persona";
import Footer from "@/app/_components/Footer";

type AppShellProps = {
  announcement?: string | null;
  menuItems: NavItem[];
  menu: MenuPayload;
  menuChildren: PersonaChildren;
  siteTitle: string;
  currentPersona: ResolvedPersona;
  children: React.ReactNode;
};

export default function AppShell({
  announcement,
  menuItems,
  menu,
  menuChildren,
  siteTitle,
  currentPersona,
  children,
}: AppShellProps) {
  const breadcrumbSlot = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="max-w-full">
        <Breadcrumbs sticky />
      </div>
      {currentPersona ? (
        <PersonaChip persona={currentPersona} className="shrink-0" />
      ) : null}
    </div>
  );

  return (
    <ClientAppShell
      announcement={announcement}
      menuItems={menuItems}
      menu={menu}
      menuChildren={menuChildren}
      siteTitle={siteTitle}
      initialPersona={currentPersona}
      footerSlot={<Footer />}
      breadcrumbSlot={breadcrumbSlot}
    >
      <>
        {process.env.NEXT_PUBLIC_E2E_MODE === "1" ? <E2EOnlyNav /> : null}
        {children}
      </>
    </ClientAppShell>
  );
}
