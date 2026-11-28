/** Focused compilation and asset checks; never evaluate authored MDX or call a database. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import sharp from "sharp";
import { compile, createProcessor } from "@mdx-js/mdx";
import { checkChroniclePublication } from "../check-chronicle-publication";
import { supportedMdx, type ContentProfile } from "./content-profile";
import {
  inferAlterEgosFromTree,
  inferPersonTagUsagesFromTree,
  inferClanSnapshotTagUsagesFromTree,
  inferYouTubeVideoTagsFromTree,
  inferChronicleMusicUsagesFromTree,
} from "../../lib/alterEgo";

export async function validateChangedContent(
  profile: ContentProfile,
  root = process.cwd(),
) {
  if (profile.profile !== "content")
    throw new Error("Content profile required");
  const manifest = JSON.parse(
    readFileSync(join(root, "lib/images/optimus-images-manifest.json"), "utf8"),
  ) as {
    images: { src: string; width: number; height: number }[];
  };
  const images = new Set(profile.assets);
  for (const slug of profile.chronicles) {
    try {
      const source = readFileSync(
        join(root, `content/chronicles/${slug}.mdx`),
        "utf8",
      );
      if (!supportedMdx(source)) throw new Error("Unsupported MDX");
      const { data, content } = matter(source);
      if (
        typeof data.date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(data.date) ||
        !Number.isFinite(Date.parse(data.date)) ||
        new Date(data.date).toISOString().slice(0, 10) !==
          data.date.slice(0, 10)
      )
        throw new Error("Invalid publication date");
      const tree = createProcessor().parse(content);
      inferAlterEgosFromTree(tree);
      inferPersonTagUsagesFromTree(tree);
      inferClanSnapshotTagUsagesFromTree(tree);
      inferYouTubeVideoTagsFromTree(tree);
      inferChronicleMusicUsagesFromTree(tree);
      await compile(content);
      for (const image of checkChroniclePublication(slug, root).assets)
        images.add(image);
    } catch {
      throw new Error(
        `Chronicle validation failed: content/chronicles/${slug}.mdx`,
      );
    }
  }
  for (const src of images) {
    try {
      const metadata = await sharp(join(root, "public", src)).metadata();
      const record = manifest.images.find((image) => image.src === src);
      if (
        !record ||
        metadata.width !== record.width ||
        metadata.height !== record.height
      )
        throw new Error("Manifest dimensions differ from image bytes");
    } catch {
      throw new Error(`Chronicle image validation failed: ${src}`);
    }
  }
  return { chronicles: profile.chronicles.length, images: images.size };
}
