import type { MetadataRoute } from "next";

const baseUrl = "https://tullyelly.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/shaolin-scrolls`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/heels-have-eyes`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/roadwork-rappin`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/ui-lab`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/typography-demo`,
      lastModified: new Date(),
    },
  ];
}
