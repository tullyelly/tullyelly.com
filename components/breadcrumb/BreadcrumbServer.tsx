import ClientBreadcrumb from "./ClientBreadcrumb";
import { breadcrumbJsonLd } from "@/lib/breadcrumb";
import { deriveCrumbsFromPath, type MenuNode } from "@/lib/crumbs";
import type { Crumb } from "@/components/ui/breadcrumb";

type BreadcrumbServerProps = {
  pathname: string;
  menuSnapshot: MenuNode;
  forcedItems?: Crumb[] | null;
};

export default function BreadcrumbServer({
  pathname,
  menuSnapshot,
  forcedItems,
}: BreadcrumbServerProps) {
  const isForced = Boolean(forcedItems && forcedItems.length);
  const initialItems = forcedItems?.length
    ? forcedItems
    : deriveCrumbsFromPath(menuSnapshot, pathname);
  const jsonLd = breadcrumbJsonLd(initialItems);
  const hasLinkedCrumbs =
    !isForced && initialItems.some((crumb) => Boolean(crumb.href));

  return (
    <>
      <ClientBreadcrumb
        initialItems={initialItems}
        menuSnapshot={menuSnapshot}
        forceItems={forcedItems}
      />
      {hasLinkedCrumbs ? (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
    </>
  );
}
