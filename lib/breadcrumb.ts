import type { Crumb } from "@/components/ui/breadcrumb";

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  const itemListElement = crumbs
    .filter((crumb) => typeof crumb.href === "string" && crumb.href.length > 0)
    .map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: crumb.href!,
    }));

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement,
  };
}
