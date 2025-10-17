import type { ReactElement } from "react";
import { breadcrumbJsonLd } from "@/lib/breadcrumb";
import {
  clearBreadcrumb,
  getBreadcrumb,
  type Crumb,
} from "@/lib/breadcrumb-registry";
import BookmarkBreadcrumb from "./BookmarkBreadcrumb";

type BreadcrumbSlotProps = {
  defaultItems: readonly Crumb[];
  forcedItems?: readonly Crumb[] | null;
};

function cloneCrumbs(items: readonly Crumb[]): Crumb[] {
  return items.map((item) => ({ ...item }));
}

export default function BreadcrumbSlot({
  defaultItems,
  forcedItems,
}: BreadcrumbSlotProps): ReactElement | null {
  const registered = getBreadcrumb();
  clearBreadcrumb();

  const hasForced = Array.isArray(forcedItems) && forcedItems.length > 0;
  const hasRegistered = Array.isArray(registered) && registered.length > 0;
  const hasDefault = Array.isArray(defaultItems) && defaultItems.length > 0;

  const items = hasForced
    ? cloneCrumbs(forcedItems!)
    : hasRegistered
      ? cloneCrumbs(registered!)
      : hasDefault
        ? cloneCrumbs(defaultItems)
        : [];

  if (!items.length) {
    return null;
  }

  const hasLinkedCrumbs = items.some((crumb) => Boolean(crumb.href));
  const jsonLd = hasLinkedCrumbs ? breadcrumbJsonLd(items) : null;

  return (
    <>
      <BookmarkBreadcrumb items={items} />
      {hasLinkedCrumbs && jsonLd ? (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
    </>
  );
}
