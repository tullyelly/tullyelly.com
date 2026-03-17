import PersonTag from "@/components/mdx/PersonTag";
import { getTagDisplayName, normalizeTagSlug } from "@/lib/tags";
import { cn } from "@/lib/utils";

export type YouTubeVideoProps = {
  id: string;
  orientation?: "landscape" | "portrait";
  playlist?: string;
  loop?: boolean;
  className?: string;
  artist?: string;
  song?: string;
  album?: string;
};

export default function YouTubeVideo({
  id,
  orientation = "landscape",
  playlist,
  loop = false,
  className,
  artist,
  song,
  album,
}: YouTubeVideoProps) {
  const params = new URLSearchParams({
    modestbranding: "1",
    rel: "0",
  });

  if (playlist || loop) {
    params.set("playlist", playlist ?? id);
  }

  if (loop) {
    params.set("loop", "1");
  }

  const embedSrc = `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
  const artistTag = artist ? normalizeTagSlug(artist) : "";
  const songTitle = song?.trim();
  const albumTitle = album?.trim();
  const hasMetadata = Boolean(artistTag || songTitle || albumTitle);

  return (
    <>
      <div
        className={cn(
          "relative",
          orientation === "portrait"
            ? "mx-auto w-full max-w-[360px] aspect-[9/16]"
            : "w-full aspect-video",
          className,
        )}
      >
        <iframe
          src={embedSrc}
          title="YouTube video player"
          className="absolute inset-0 w-full h-full rounded-lg"
          frameBorder={0}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      {hasMetadata ? (
        <div
          className={cn(
            "mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm leading-snug text-muted-foreground",
            orientation === "portrait" && "mx-auto w-full max-w-[360px]",
          )}
        >
          {artistTag ? (
            <PersonTag
              tag={artistTag}
              displayName={getTagDisplayName(artistTag)}
            />
          ) : null}
          {songTitle ? (
            <span>
              <span className="font-medium text-ink">song:</span> {songTitle}
            </span>
          ) : null}
          {albumTitle ? (
            <span>
              <span className="font-medium text-ink">album:</span> {albumTitle}
            </span>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
