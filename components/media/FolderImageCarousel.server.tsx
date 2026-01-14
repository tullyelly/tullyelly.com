import "server-only";

import path from "node:path";
import FolderImageCarousel from "@/components/media/FolderImageCarousel";
import { listOptimizedImages } from "@/lib/images/list-optimized-images";

type FolderImageCarouselServerProps = {
  folder: string;
  altPrefix?: string;
};

const humanizeFilename = (src: string) => {
  const baseName = path.basename(src, path.extname(src));
  return baseName.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
};

const buildAltText = (src: string, altPrefix?: string) => {
  const humanized = humanizeFilename(src);
  if (altPrefix) {
    return humanized ? `${altPrefix}: ${humanized}` : altPrefix;
  }
  return humanized || "Image";
};

export default async function FolderImageCarouselServer({
  folder,
  altPrefix,
}: FolderImageCarouselServerProps) {
  const images = await listOptimizedImages(folder);
  if (images.length === 0) {
    return null;
  }

  const slides = images.map((src) => ({
    src,
    alt: buildAltText(src, altPrefix),
  }));

  return <FolderImageCarousel slides={slides} />;
}
