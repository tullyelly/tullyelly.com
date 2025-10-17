import { headers } from "next/headers";
import type { ReactElement } from "react";
import BreadcrumbsHydrator from "@/app/components/BreadcrumbsHydrator";
import { breadcrumbJsonLd } from "@/lib/breadcrumb";
import type { Crumb } from "@/lib/breadcrumbs/types";
import { buildCrumbs } from "@/server/lib/breadcrumbs/buildCrumbs";

type BreadcrumbsServerProps = {
  pathname?: string;
  forced?: Crumb[] | null;
};

async function resolvePathname(explicit?: string): Promise<string> {
  if (explicit) return explicit;
  const hdrs = await headers();
  const candidates = [
    hdrs.get("x-pathname"),
    hdrs.get("x-invoke-path"),
    hdrs.get("x-next-url"),
    hdrs.get("x-matched-path"),
  ];
  const match = candidates.find((value) => value && value.startsWith("/"));
  return match ?? "/";
}

export default async function BreadcrumbsServer({
  pathname,
  forced,
}: BreadcrumbsServerProps): Promise<ReactElement | null> {
  const targetPath = await resolvePathname(pathname);
  const seed: Crumb[] =
    forced && forced.length
      ? forced.map((crumb, index, array) => ({
          ...crumb,
          kind: "forced",
          href: index === array.length - 1 ? undefined : crumb.href,
        }))
      : await buildCrumbs(targetPath);
  if (!seed.length) {
    return null;
  }
  const hasLinkedCrumbs = seed.some((crumb) => Boolean(crumb.href));
  const jsonLd = hasLinkedCrumbs ? breadcrumbJsonLd(seed) : null;
  return (
    <>
      <BreadcrumbsHydrator seed={seed} />
      {jsonLd ? (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
    </>
  );
}
