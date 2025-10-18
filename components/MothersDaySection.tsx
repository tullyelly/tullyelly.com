import FlowersInline from "@/components/flowers/FlowersInline";

type Props = { date?: string };

export function MothersDaySection({ date }: Props) {
  return (
    <section aria-label="Mother's Day 2025" className="space-y-2">
      <h2 className="text-xl md:text-2xl font-semibold leading-snug">
        <span aria-hidden>🌷</span>Mother&apos;s Day 2025
        {date ? `; ${date}` : ""}
      </h2>
      <p className="text-[16px] md:text-[18px] text-muted-foreground">
        Before we dive too deep into the nerd, here&apos;s some additional
        wholesome Mother&apos;s Day content for you to enjoy! I found them to be
        just as impactful as the first time around.
      </p>
      <div className="space-y-4">
        <figure className="space-y-2">
          <div className="yt-wrapper-bucks yt-wrapper-bucks--compact">
            <iframe
              src="https://www.youtube-nocookie.com/embed/n8fOQ4DOZTk?loop=1&playlist=n8fOQ4DOZTk"
              title="Mother's Day video 1"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </figure>
        <figure className="space-y-2">
          <div className="yt-wrapper-bucks yt-wrapper-bucks--compact">
            <iframe
              src="https://www.youtube-nocookie.com/embed/br1qpJ2mCpE?loop=1&playlist=br1qpJ2mCpE"
              title="Mother's Day video 2"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </figure>
        <p className="mt-3 text-[16px] md:text-[18px] text-muted-foreground">
          <FlowersInline>
            nikkigirl, Big Ter,{" "}
            <a
              className="underline hover:no-underline"
              href="https://www.youtube.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              YouTube
            </a>
            {", "}
            <a
              className="underline hover:no-underline"
              href="https://www.python.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Python
            </a>
            {" & "}
            <a
              className="underline hover:no-underline"
              href="https://www.kapwing.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Kapwing
            </a>
          </FlowersInline>
        </p>
      </div>
    </section>
  );
}
