/* eslint-disable @next/next/no-img-element */

export default function LoopedGif({ src, alt }: { src: string; alt?: string }) {
  return (
    <div className="flex justify-center">
      <img
        src={src}
        alt={alt || "looped animation"}
        loading="lazy"
        className="rounded-3xl border border-white/10 shadow-lg shadow-black/40 max-w-3xl w-full"
      />
    </div>
  );
}
