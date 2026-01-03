import "server-only";

import YouTubeMusic from "youtube-music-ts-api";

type Thumbnail = { url?: string; width?: number; height?: number };

function pickBestThumbnail(thumbnails?: Thumbnail[]) {
  if (!thumbnails || thumbnails.length === 0) return undefined;

  return thumbnails.reduce<Thumbnail | undefined>((best, current) => {
    if (!current?.url) return best;

    const currentArea = (current.width ?? 0) * (current.height ?? 0);
    if (!best?.url) return current;

    const bestArea = (best.width ?? 0) * (best.height ?? 0);
    return currentArea > bestArea ? current : best;
  }, undefined)?.url;
}

export function parseYouTubeMusicPlaylistId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const listParam = url.searchParams.get("list");
    if (listParam) return listParam;

    const segments = url.pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    if (
      segments.includes("playlist") &&
      lastSegment &&
      lastSegment !== "playlist"
    ) {
      return lastSegment;
    }
  } catch {
    // The value is not a URL; fall back to plain ID validation below.
  }

  const idPattern = /^[A-Za-z0-9_-]{10,}$/;
  return idPattern.test(trimmed) ? trimmed : null;
}

type PlaylistDetail =
  Awaited<ReturnType<YouTubeMusic["guest"]>> extends infer Guest
    ? Guest extends {
        getPlaylist: (id: string, maxRetries?: number) => Promise<infer Detail>;
      }
      ? Detail
      : never
    : never;

export async function fetchYouTubeMusicPlaylistMeta(
  playlistId: string,
): Promise<{
  title?: string;
  thumbnailUrl?: string;
  trackCount?: number;
} | null> {
  if (!playlistId) return null;

  try {
    const ytm = new YouTubeMusic();
    const guest = await ytm.guest();
    const detail: PlaylistDetail = await guest.getPlaylist(playlistId, 3);
    if (!detail) return null;

    const thumbnails = (detail as PlaylistDetail & { thumbnails?: Thumbnail[] })
      .thumbnails;
    const thumbnailUrl = pickBestThumbnail(thumbnails);
    const title =
      detail.name ?? (detail as PlaylistDetail & { title?: string }).title;
    const trackCount =
      Array.isArray(detail?.tracks) && detail.tracks.length > 0
        ? detail.tracks.length
        : detail.count;

    return {
      title: title ?? undefined,
      thumbnailUrl: thumbnailUrl ?? undefined,
      trackCount: typeof trackCount === "number" ? trackCount : undefined,
    };
  } catch {
    return null;
  }
}
