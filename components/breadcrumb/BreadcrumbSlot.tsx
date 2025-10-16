import type { ReactElement } from "react";
import { getBreadcrumb } from "@/lib/breadcrumb-registry";
import BookmarkBreadcrumb from "./BookmarkBreadcrumb";

export default function BreadcrumbSlot(): ReactElement | null {
  const items = getBreadcrumb();

  if (!items || items.length === 0) {
    return null;
  }

  return <BookmarkBreadcrumb items={items} />;
}
