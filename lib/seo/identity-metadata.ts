import "server-only";
import type { Metadata } from "next";
import { getIdentityBySlug } from "@/lib/identity-server";
import type { IdentityKind } from "@/lib/identity";
import { buildMetadata } from "./builders";
import { canonicalUrl } from "@/lib/share/canonicalUrl";

export function makeIdentityGenerateMetadata({
  directory,
  kind,
  noun,
  authored = {},
}: {
  directory: string;
  kind: IdentityKind;
  noun: string;
  authored?: Record<string, Metadata>;
}) {
  return async function generateMetadata({
    params,
  }: {
    params: Promise<{ slug: string }>;
  }): Promise<Metadata> {
    const { slug } = await params;
    const original = Object.hasOwn(authored, slug) ? authored[slug] : undefined;
    if (original) {
      const canonical = canonicalUrl(
        `${directory}/${encodeURIComponent(slug)}`,
      );
      return {
        ...original,
        alternates: { canonical },
        openGraph: { ...original.openGraph, url: canonical },
      };
    }
    const identity = await getIdentityBySlug(slug);
    const found = identity?.metadata.kind === kind;
    const name = found ? identity.displayName : "Not found";
    return buildMetadata({
      title: `${name} | ${noun} | tullyelly`,
      description: found
        ? `${name}: relationships, stories and ${noun.toLowerCase()} details.`
        : "The requested identity could not be found.",
      canonical: canonicalUrl(
        `${directory}/${encodeURIComponent(found ? identity.slug : slug)}`,
      ),
      robots: { index: found, follow: true },
    });
  };
}
