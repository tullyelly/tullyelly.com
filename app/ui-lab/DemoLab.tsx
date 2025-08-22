'use client';

import Callout from '@/components/Callout';
import Quote from '@/components/Quote';
import Hero from '@/components/Hero';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import AnnouncementBanner from '@/components/AnnouncementBanner';

export default function DemoLab() {
  const palette = [
    { name: 'blue', swatch: 'bg-blue text-text-on-blue' },
    { name: 'green', swatch: 'bg-green text-text-on-green' },
    { name: 'cream', swatch: 'bg-cream text-text-primary' },
    { name: 'surface-card', swatch: 'bg-surface-card text-text-primary' },
    { name: 'surface-page', swatch: 'bg-surface-page text-text-primary' },
    { name: 'border-subtle', swatch: 'bg-border-subtle text-text-primary' },
  ];

  return (
    <div className="mx-auto max-w-container space-y-8 p-4">
      <h1 className="text-4xl font-extrabold">UI Lab</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="card space-y-4" aria-labelledby="announcement-banner">
          <h2 id="announcement-banner" className="text-xl font-semibold">Announcement Banner</h2>
          <AnnouncementBanner message="Big news! Something important goes here." />
        </section>
        <section className="card space-y-4" aria-labelledby="header-footer">
          <h2 id="header-footer" className="text-xl font-semibold">Header & Footer</h2>
          <div className="border border-border-subtle rounded">
            <SiteHeader />
            <div className="p-4 text-center">Page content</div>
            <Footer />
          </div>
        </section>
        <section className="card space-y-4" aria-labelledby="callout">
          <h2 id="callout" className="text-xl font-semibold">Callout</h2>
          <Callout>Remember to stay hydrated.</Callout>
        </section>
        <section className="card space-y-4" aria-labelledby="quote">
          <h2 id="quote" className="text-xl font-semibold">Quote</h2>
          <Quote cite="tullyelly">Design is both art and science.</Quote>
        </section>
        <section className="card space-y-4 md:col-span-2" aria-labelledby="hero">
          <h2 id="hero" className="text-xl font-semibold">Hero</h2>
          <Hero src="/vercel.svg" alt="Vercel logo" width={400} height={200} />
        </section>
        <section className="card space-y-4 md:col-span-2" aria-labelledby="palette">
          <h2 id="palette" className="text-xl font-semibold">Palette</h2>
          <ul className="grid grid-cols-3 gap-4" aria-label="Color tokens">
            {palette.map((c) => (
              <li key={c.name} className="border border-border-subtle rounded">
                <div className={`h-16 rounded-t ${c.swatch}`} />
                <p className="p-2 text-sm">{c.name}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

