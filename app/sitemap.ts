import type { MetadataRoute } from "next";

const baseUrl = "https://tullyelly.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/mark2/shaolin-scrolls`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/theabbott/heels-have-eyes`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/theabbott/roadwork-rappin`,
      lastModified: new Date(),
    },
  ];
}
