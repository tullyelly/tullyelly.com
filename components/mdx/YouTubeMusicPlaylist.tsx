import "server-only";

/* eslint-disable @next/next/no-img-element */
import {
  extractPlaylistAlbums,
  fetchYouTubeMusicPlaylistDetail,
  fetchYouTubeMusicPlaylistMeta,
  parseYouTubeMusicPlaylistId,
} from "@/lib/youtubeMusic";

export type YouTubeMusicPlaylistProps = {
  id?: string;
  url?: string;
  title?: string;
  showMeta?: boolean;
  showAlbums?: boolean;
  maxAlbumCount?: number;
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
  showAlbums = true,
  maxAlbumCount = 200,
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

  const [detail, meta] = await Promise.all([
    fetchYouTubeMusicPlaylistDetail(playlistId, 3),
    showMeta !== false ? fetchYouTubeMusicPlaylistMeta(playlistId) : null,
  ]);

  const albums =
    showAlbums !== false && detail ? extractPlaylistAlbums(detail as any) : [];
  const displayAlbums = albums.slice(0, maxAlbumCount);
  const remainingAlbums = Math.max(albums.length - displayAlbums.length, 0);

  const resolvedTitle =
    title ??
    meta?.title ??
    (detail as { name?: string; title?: string } | null | undefined)?.name ??
    (detail as { name?: string; title?: string } | null | undefined)?.title;
  const thumbnailUrl = meta?.thumbnailUrl;
  const description = (detail as { description?: string } | null | undefined)
    ?.description;
  const embedSrc = `https://www.youtube-nocookie.com/embed?listType=playlist&list=${encodeURIComponent(playlistId)}`;
  const stackSpacing = compact ? "space-y-2" : "space-y-3";

  return (
    <figure className={stackSpacing}>
      {showMeta !== false && (resolvedTitle || thumbnailUrl || description) ? (
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={
                  resolvedTitle ? `${resolvedTitle} cover` : "Playlist cover"
                }
                className="h-16 w-16 rounded-md object-cover shadow-sm"
                loading="lazy"
              />
            ) : null}
            <div className="space-y-1">
              {resolvedTitle ? (
                <h3 className="text-lg font-semibold leading-tight">
                  {resolvedTitle}
                  {description ? (
                    <span className="text-sm font-normal leading-snug text-muted-foreground">
                      : {description}
                    </span>
                  ) : null}
                </h3>
              ) : null}
            </div>
          </div>

          {showAlbums !== false && displayAlbums.length > 0 ? (
            <div className="space-y-1">
              <ul className="list-disc list-inside space-y-1">
                {displayAlbums.map(({ album, artist }) => (
                  <li
                    key={`${artist}-${album}`}
                    className="text-sm leading-snug"
                  >
                    <span className="font-semibold">{artist}</span>
                    <span className="ml-1 opacity-90">{album}</span>
                  </li>
                ))}
              </ul>
              {remainingAlbums > 0 ? (
                <div className="text-xs text-muted-foreground">
                  + {remainingAlbums} more...
                </div>
              ) : null}
            </div>
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
