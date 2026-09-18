import type { MetadataRoute } from "next";

import {
  CREAM_CITY_CREAM,
  GREAT_LAKES_BLUE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
} from "@/lib/seo/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_TITLE,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: CREAM_CITY_CREAM,
    theme_color: GREAT_LAKES_BLUE,
    icons: [
      {
        src: "/app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
