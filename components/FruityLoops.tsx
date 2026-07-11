/* eslint-disable @next/next/no-img-element */

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
  return (
    <div className="mx-auto w-full md:max-w-[520px]">
      <img
        src={resolveFruityLoopsSrc(loop)}
        alt={alt || "looped animation"}
        loading="lazy"
        className="w-full rounded-3xl border border-white/10 shadow-lg shadow-black/40"
      />
    </div>
  );
}
