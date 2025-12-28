import type { MetadataRoute } from "next";
import { getScrollsPage } from "@/lib/scrolls";

const baseUrl = "https://tullyelly.com";

async function fetchScrollEntries() {
  const pageSize = 200;
  let offset = 0;
  let total = Number.MAX_SAFE_INTEGER;
  const entries: MetadataRoute.Sitemap = [];

  try {
    while (offset < total) {
      const { items, page } = await getScrollsPage({
        limit: pageSize,
        offset,
        sort: "semver:desc",
      });
      total = page.total;
      if (!items.length) break;

      for (const item of items) {
        entries.push({
          url: `${baseUrl}/mark2/shaolin-scrolls/${item.id}`,
          lastModified: item.release_date
            ? new Date(item.release_date)
            : undefined,
        });
      }

      offset += items.length;
      if (items.length < pageSize) break;
    }
  } catch {
    return [];
  }

  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const scrollEntries = await fetchScrollEntries();

  return [
    { url: baseUrl, lastModified: now },
    { url: `${baseUrl}/mark2/shaolin-scrolls`, lastModified: now },
    ...scrollEntries,
    { url: `${baseUrl}/theabbott/heels-have-eyes`, lastModified: now },
    { url: `${baseUrl}/theabbott/roadwork-rappin`, lastModified: now },
    { url: `${baseUrl}/tullyelly/ruins`, lastModified: now },
  ];
}
