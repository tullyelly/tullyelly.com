import { setBreadcrumb } from "@/lib/breadcrumb-registry";
import type { Crumb } from "@/lib/breadcrumb-registry";

type BreadcrumbRegisterProps = {
  items: readonly Crumb[];
};

export default function BreadcrumbRegister({
  items,
}: BreadcrumbRegisterProps): null {
  setBreadcrumb(items);
  return null;
}
