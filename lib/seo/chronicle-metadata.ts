import type { Metadata } from "next";

import { SHARED_OPEN_GRAPH_FIELDS, SHARED_TWITTER_FIELDS } from "./constants";

type ChronicleMetadataInput = {
  title: string;
  summary: string;
  canonical?: string;
};

export function buildChronicleMetadata({
  title,
  summary,
  canonical,
}: ChronicleMetadataInput): Metadata {
  return {
    title,
    description: summary,
    alternates: { canonical },
    openGraph: {
      ...SHARED_OPEN_GRAPH_FIELDS,
      title,
      description: summary,
    },
    twitter: {
      ...SHARED_TWITTER_FIELDS,
      title,
      description: summary,
    },
  };
}
