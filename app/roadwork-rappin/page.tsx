'use client';

import React from 'react';

export default function Page() {
  return (
    <main className="px-4 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl py-10 space-y-10">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Roadwork Rappin’</h1>
          <p className="mt-2 text-sm text-neutral-500">
            A tiny static page demo with an embedded video and some copy blocks.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Setup</h2>
          <p>
            Road cones, fresh paint, and a beat on loop. This section is simple filler to prove the layout
            and spacing. Swap in real copy later.
          </p>
        </section>

        <section aria-labelledby="video-title" className="space-y-4">
          <h2 id="video-title" className="text-xl font-semibold">Video</h2>
          <div className="relative aspect-video overflow-hidden rounded-xl">
            <iframe
              className="absolute inset-0 h-full w-full"
              src="https://www.youtube-nocookie.com/embed/jRHqjDnEFiE?si=-aVzrmGAmDuJ0PL0"
              title="Roadwork Rappin’ — YouTube"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <p className="text-sm text-neutral-500">
            Embedded directly from YouTube using the privacy-enhanced player.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Notes</h2>
          <p>
            Another small block of placeholder copy. Keep the tempo steady; real content will land next pass.
          </p>
        </section>
      </article>
    </main>
  );
}
