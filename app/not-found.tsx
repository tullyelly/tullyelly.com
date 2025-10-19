import Link from "next/link";

export default function NotFound() {
  return (
    <section className="not-found-screen relative isolate flex w-full flex-1 flex-col items-center justify-center gap-10 overflow-hidden px-6 py-16 lg:py-24">
      <div aria-hidden className="absolute inset-0 -z-20 bg-neutral-950" />
      <div className="relative z-10 max-w-xl text-center text-white">
        <h1 className="text-3xl font-semibold md:text-4xl">Page Not Found</h1>
        <p className="mt-4 text-base text-white/85 md:text-lg">
          We could not find the page you requested; try heading back to the
          start - just like Booker & the Suns did after this series.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/" className="btn px-6 no-underline">
            <span className="text-white">Go Home</span>
          </Link>
          <span className="text-white/70 text-sm uppercase tracking-wide">
            or
          </span>
          <a
            href="https://www.youtube.com/watch?v=-DJVk4bEA_s"
            target="_blank"
            rel="noreferrer"
            className="btn px-6 no-underline"
          >
            <span className="text-white">50 Piece</span>
          </a>
        </div>
      </div>
      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 shadow-lg shadow-black/40">
        <div className="relative h-0 w-full pb-[56.25%]">
          <div aria-hidden className="absolute inset-0 bg-neutral-950" />
          <video
            className="absolute inset-0 z-10 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          >
            <source src="/videos/valley-oop.webm" type="video/webm" />
            <source src="/videos/valley-oop.mp4" type="video/mp4" />
          </video>
          <div
            aria-hidden
            className="absolute inset-0 z-20 bg-gradient-to-b from-black/30 via-black/25 to-black/60"
          />
        </div>
      </div>
    </section>
  );
}
