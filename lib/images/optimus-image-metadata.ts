import "server-only";

import manifest from "@/lib/images/optimus-images-manifest.json";

export type ImageDimensions = {
  width: number;
  height: number;
};

const imageMetadata = new Map(
  manifest.images.map(({ src, width, height }) => [src, { width, height }]),
);

/** Keep the manifest on the server; send only the displayed images to clients. */
export function getOptimusImageMetadata(
  src: string,
): ImageDimensions | undefined {
  const pathname = src.split(/[?#]/, 1)[0];
  return imageMetadata.get(pathname);
}
