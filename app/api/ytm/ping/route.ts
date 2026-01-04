import "server-only";

import { NextResponse } from "next/server";

import { fetchYouTubeMusicPlaylistMeta } from "@/lib/youtubeMusic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const SAMPLE_PLAYLIST_ID = "PLMC9KNkIncKtPzgY-5rmhvj7fax8fdxoj";

export async function GET() {
  const meta = await fetchYouTubeMusicPlaylistMeta(SAMPLE_PLAYLIST_ID);

  return NextResponse.json({
    ok: true,
    playlistId: SAMPLE_PLAYLIST_ID,
    meta: meta ?? null,
  });
}
