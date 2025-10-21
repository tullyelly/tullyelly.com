import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/builders";

type LegacyInput = {
  title: string;
  description: string;
  canonical?: string;
  // Future-friendly fields can be added without breaking callers
};

export function buildPageMetadata(input: LegacyInput): Metadata {
  return buildMetadata({
    title: input.title,
    description: input.description,
    canonical: input.canonical,
    type: "website",
    twitterCard: "summary",
  });
}
