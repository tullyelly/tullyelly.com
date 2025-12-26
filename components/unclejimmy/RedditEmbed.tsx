"use client";

import Script from "next/script";

type RedditEmbedProps = {
  permalink: string;
  height?: number;
  subreddit?: string;
  className?: string;
};

export default function RedditEmbed({
  permalink,
  height = 739,
  subreddit = "reddit",
  className,
}: RedditEmbedProps) {
  const href = permalink.startsWith("http")
    ? permalink
    : `https://www.reddit.com${permalink}`;

  return (
    <div className={className} data-testid="reddit-embed">
      <blockquote
        className="reddit-embed-bq"
        data-embed-height={height}
        data-embed-theme="light"
      >
        Posts from the{" "}
        <a href={href} rel="noopener noreferrer">
          {subreddit}
        </a>
        <br />
        community on Reddit
      </blockquote>
      <Script
        src="https://embed.reddit.com/widgets.js"
        strategy="afterInteractive"
      />
    </div>
  );
}
