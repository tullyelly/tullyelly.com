import type { MenuIndex } from "@/lib/menu.index";
import {
  getBreadcrumbs,
  getSegmentAwareLabel,
  type Breadcrumb,
} from "@/lib/menu.breadcrumbs";

export type Crumb = Breadcrumb;

export function buildPageMetadata(
  pathname: string,
  index: MenuIndex,
): { title: string; breadcrumbs: Crumb[] } {
  const breadcrumbs = getBreadcrumbs(pathname, index);
  const title = getSegmentAwareLabel(pathname, index);
  return { title, breadcrumbs };
}
