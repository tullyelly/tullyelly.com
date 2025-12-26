"use client";

import { useEffect, useRef } from "react";

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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    node.innerHTML = `<blockquote class="reddit-embed-bq" data-embed-height="${height}" data-embed-theme="light">Posts from the <a href="${href}" rel="noopener noreferrer">${subreddit}</a><br />community on Reddit</blockquote>`;

    const script = document.createElement("script");
    script.src = "https://embed.reddit.com/widgets.js";
    script.async = true;
    script.charset = "UTF-8";
    node.appendChild(script);

    return () => {
      while (node.firstChild) {
        node.removeChild(node.firstChild);
      }
    };
  }, [height, href, subreddit]);

  return (
    <div ref={containerRef} className={className} data-testid="reddit-embed" />
  );
}
