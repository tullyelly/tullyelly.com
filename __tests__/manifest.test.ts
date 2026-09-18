import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

import manifest from "@/app/manifest";
import {
  CREAM_CITY_CREAM,
  GREAT_LAKES_BLUE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
} from "@/lib/seo/constants";

describe("web app manifest", () => {
  const webManifest = manifest();

  it("uses the site identity and standalone root launch behavior", () => {
    expect(webManifest).toMatchObject({
      name: SITE_NAME,
      short_name: SITE_TITLE,
      description: SITE_DESCRIPTION,
      start_url: "/",
      display: "standalone",
      background_color: CREAM_CITY_CREAM,
      theme_color: GREAT_LAKES_BLUE,
    });
  });

  it("declares existing standard-size PNG icons", async () => {
    expect(webManifest.icons).toEqual([
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
    ]);

    for (const icon of webManifest.icons ?? []) {
      const relativePath =
        icon.src === "/icon.png" ? `app${icon.src}` : `public${icon.src}`;
      const iconPath = path.join(process.cwd(), relativePath);

      expect(fs.existsSync(iconPath)).toBe(true);

      const metadata = await sharp(iconPath).metadata();
      expect(icon.sizes).toBeDefined();
      if (!icon.sizes) throw new Error(`Missing sizes for ${icon.src}`);
      const size = Number.parseInt(icon.sizes.split("x")[0], 10);
      expect(metadata).toMatchObject({
        width: size,
        height: size,
        format: "png",
      });
    }
  });

  it("provides an Apple touch icon through the App Router convention", async () => {
    const appleIconPath = path.join(process.cwd(), "app/apple-icon.png");

    expect(fs.existsSync(appleIconPath)).toBe(true);
    await expect(sharp(appleIconPath).metadata()).resolves.toMatchObject({
      width: 180,
      height: 180,
      format: "png",
    });
  });

  it("uses valid six-digit hexadecimal brand colors", () => {
    expect(webManifest.background_color).toMatch(/^#[\dA-F]{6}$/i);
    expect(webManifest.theme_color).toMatch(/^#[\dA-F]{6}$/i);
  });
});
