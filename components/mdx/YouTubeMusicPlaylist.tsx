import "server-only";

/* eslint-disable @next/next/no-img-element */
import {
  fetchYouTubeMusicPlaylistMeta,
  parseYouTubeMusicPlaylistId,
} from "@/lib/youtubeMusic";

export type YouTubeMusicPlaylistProps = {
  id?: string;
  url?: string;
  title?: string;
  showMeta?: boolean;
  compact?: boolean;
};

function WarningBox({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
      {message}
    </div>
  );
}

export default async function YouTubeMusicPlaylist({
  id,
  url,
  title,
  showMeta = true,
  compact = false,
}: YouTubeMusicPlaylistProps) {
  const playlistId =
    parseYouTubeMusicPlaylistId(id ?? "") ??
    (url ? parseYouTubeMusicPlaylistId(url) : null);

  if (!playlistId) {
    const provided = id ?? url ?? "unknown playlist";
    return (
      <WarningBox
        message={`Playlist id could not be parsed; input: ${provided}`}
      />
    );
  }

  const meta =
    showMeta !== false ? await fetchYouTubeMusicPlaylistMeta(playlistId) : null;

  const resolvedTitle = title ?? meta?.title;
  const thumbnailUrl = meta?.thumbnailUrl;
  const embedSrc = `https://www.youtube-nocookie.com/embed?listType=playlist&list=${encodeURIComponent(playlistId)}`;
  const stackSpacing = compact ? "space-y-2" : "space-y-3";

  return (
    <figure className={stackSpacing}>
      {showMeta !== false && (resolvedTitle || thumbnailUrl) ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={resolvedTitle ? `${resolvedTitle} cover` : "Playlist cover"}
              className="h-16 w-16 rounded-md object-cover shadow-sm"
              loading="lazy"
            />
          ) : null}
          {resolvedTitle ? (
            <h3 className="text-lg font-semibold leading-tight">
              {resolvedTitle}
            </h3>
          ) : null}
        </div>
      ) : null}

      <div className="relative w-full aspect-video overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-black">
        <iframe
          src={embedSrc}
          title={resolvedTitle ?? "YouTube Music playlist"}
          className="absolute inset-0 h-full w-full"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </figure>
  );
}
