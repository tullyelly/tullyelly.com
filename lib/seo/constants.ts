import type { Metadata } from "next";

export const SITE_NAME = "tullyelly.com";
export const SITE_TITLE = "tullyelly";
export const SITE_DESCRIPTION =
  "Experiments across shaolin, mark2, cardattack and friends.";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const DEFAULT_TWITTER_HANDLE = "@tullyelly"; // adjust if needed

export const SOCIAL_IMAGE_PATH = "/opengraph-image";
export const SOCIAL_IMAGE_ALT =
  "tullyelly; experiments across shaolin, mark2, cardattack and friends";

export const SHARED_OPEN_GRAPH_FIELDS = {
  images: [
    {
      url: SOCIAL_IMAGE_PATH,
      width: 1200,
      height: 630,
      alt: SOCIAL_IMAGE_ALT,
      type: "image/png",
    },
  ],
} satisfies Metadata["openGraph"];

export const SHARED_TWITTER_FIELDS = {
  card: "summary_large_image",
  site: DEFAULT_TWITTER_HANDLE,
  creator: DEFAULT_TWITTER_HANDLE,
  images: [{ url: SOCIAL_IMAGE_PATH, alt: SOCIAL_IMAGE_ALT }],
} satisfies Metadata["twitter"];
