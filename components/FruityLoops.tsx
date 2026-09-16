/* eslint-disable @next/next/no-img-element */

import { getOptimusImageMetadata } from "@/lib/images/optimus-image-metadata";

export function resolveFruityLoopsSrc(loop: string) {
  return loop.includes("/")
    ? `/images/optimus/${loop}`
    : `/images/optimus/fruity-loops/${loop}.webp`;
}

export default function FruityLoops({
  loop,
  alt,
}: {
  loop: string;
  alt?: string;
}) {
  const src = resolveFruityLoopsSrc(loop);
  const dimensions = getOptimusImageMetadata(src);

  return (
    <div className="mx-auto w-full md:max-w-[520px]">
      <img
        src={src}
        alt={alt || "looped animation"}
        width={dimensions?.width}
        height={dimensions?.height}
        sizes="(max-width: 768px) 100vw, 520px"
        loading="lazy"
        decoding="async"
        className="w-full rounded-3xl border border-white/10 shadow-lg shadow-black/40"
      />
    </div>
  );
}
