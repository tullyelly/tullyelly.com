type Props = { date?: string };

export function MothersDaySection({ date }: Props) {
  return (
    <section aria-label="Mother&apos;s Day 2025" className="space-y-2">
      <h2 className="text-xl md:text-2xl font-semibold leading-snug">
        <span aria-hidden>🌷</span>Mother&apos;s Day 2025{date ? `; ${date}` : ''}
      </h2>
      <p className="text-sm">
        A heartfelt introduction will appear here when the time is right; for now please enjoy the videos below.
      </p>
      <div className="space-y-4">
        <figure className="space-y-2">
          <div className="yt-wrapper-bucks">
            <iframe
              src="https://www.youtube-nocookie.com/embed/n8fOQ4DOZTk"
              title="Mother&apos;s Day video 1"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <figcaption className="text-xs text-fg/60">
            Embedded via YouTube&apos;s privacy-enhanced player.
          </figcaption>
        </figure>
        <figure className="space-y-2">
          <div className="yt-wrapper-bucks">
            <iframe
              src="https://www.youtube-nocookie.com/embed/br1qpJ2mCpE"
              title="Mother&apos;s Day video 2"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <figcaption className="text-xs text-fg/60">
            Embedded via YouTube&apos;s privacy-enhanced player.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
