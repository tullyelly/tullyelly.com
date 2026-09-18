import Link from "next/link";

export default function NotFound() {
  return (
    <section
      data-recent-history-exclude
      aria-labelledby="not-found-heading"
      className="not-found-screen relative isolate flex min-h-[50vh] w-full flex-col items-center justify-center gap-8 overflow-hidden px-4 py-8 sm:gap-10 sm:px-6 sm:py-12 lg:py-16"
    >
      <div aria-hidden className="absolute inset-0 -z-20 bg-neutral-950" />
      <div className="relative z-10 max-w-xl text-center text-white">
        <h1
          id="not-found-heading"
          className="text-3xl font-semibold md:text-4xl"
        >
          Page Not Found
        </h1>
        <p className="mt-4 text-base text-white/85 md:text-lg">
          We could not find the page you requested; try heading back to the
          start - just like Booker & the Suns did after this series.
        </p>
        <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link href="/" className="btn w-full px-6 no-underline sm:w-auto">
            <span className="text-white">Go Home</span>
          </Link>
          <span className="text-sm uppercase tracking-wide text-white/70">
            or
          </span>
          <a
            href="https://www.youtube.com/watch?v=-DJVk4bEA_s"
            target="_blank"
            rel="noreferrer"
            className="btn w-full px-6 no-underline sm:w-auto"
          >
            <span className="text-white">
              50 Piece<span className="sr-only"> (opens in a new tab)</span>
            </span>
          </a>
        </div>
      </div>
      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 shadow-lg shadow-black/40">
        <div className="relative h-0 w-full pb-[56.25%]">
          <div aria-hidden className="absolute inset-0 bg-neutral-950" />
          <video
            aria-hidden="true"
            className="absolute inset-0 z-10 h-full w-full object-cover motion-reduce:hidden"
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
