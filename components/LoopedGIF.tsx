/* eslint-disable @next/next/no-img-element */

export default function LoopedGif({ src, alt }: { src: string; alt?: string }) {
  return (
    <div className="mx-auto w-full md:max-w-[520px]">
      <img
        src={src}
        alt={alt || "looped animation"}
        loading="lazy"
        className="w-full rounded-3xl border border-white/10 shadow-lg shadow-black/40"
      />
    </div>
  );
}
