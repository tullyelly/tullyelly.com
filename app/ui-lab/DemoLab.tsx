'use client';

import { useEffect, useState } from 'react';
import Callout from '@/components/Callout';
import Quote from '@/components/Quote';
import Hero from '@/components/Hero';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import Button from '@ui/Button';

const paletteTokens = {
  brand: [
    { name: 'blue', var: '--blue', text: 'text-text-on-blue', light: false },
    { name: 'green', var: '--green', text: 'text-text-on-green', light: false },
  ],
  surface: [
    { name: 'cream', var: '--cream', text: 'text-text-primary', light: true },
    { name: 'surface-card', var: '--surface-card', text: 'text-text-primary', light: true },
    { name: 'surface-page', var: '--surface-page', text: 'text-text-primary', light: true },
    { name: 'border-subtle', var: '--border-subtle', text: 'text-text-primary', light: true },
  ],
} as const;

type PaletteGroup = keyof typeof paletteTokens;

export default function DemoLab() {
  const [paletteGroup, setPaletteGroup] = useState<PaletteGroup>('brand');
  const [colorValues, setColorValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const root = getComputedStyle(document.documentElement);
    const entries: Record<string, string> = {};
    Object.values(paletteTokens)
      .flat()
      .forEach((c) => {
        entries[c.name] = root.getPropertyValue(c.var).trim();
      });
    setColorValues(entries);
  }, []);

  const [message, setMessage] = useState('Custom announcement');
  const [href, setHref] = useState('');
  const [variant, setVariant] =
    useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [dismissible, setDismissible] = useState(false);
  const [showHeroImage, setShowHeroImage] = useState(true);

  return (
    <div className="mx-auto max-w-container space-y-8 p-4">
      <h1 className="text-4xl font-extrabold">UI Lab</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="card space-y-4" aria-labelledby="flowers">
          <h2 id="flowers" className="text-xl font-semibold">Flowers</h2>
          <p><a href="/ui-lab/flowers" className="underline hover:no-underline">Open Flowers demo</a></p>
        </section>
        <section className="card space-y-4" aria-labelledby="announcement-banner">
          <h2 id="announcement-banner" className="text-xl font-semibold">Announcement Banner</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Presets</h3>
              <AnnouncementBanner message="Heads up!" variant="info" />
              <AnnouncementBanner message="It worked!" variant="success" />
              <AnnouncementBanner message="Watch out!" variant="warning" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Build your own</h3>
              <AnnouncementBanner
                key={`${message}-${href}-${variant}-${dismissible}`}
                message={message}
                href={href || undefined}
                variant={variant}
                dismissible={dismissible}
              />
              <div className="grid gap-2 text-sm">
                <label className="flex flex-col">
                  Message
                  <input
                    className="form-input"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </label>
                <label className="flex flex-col">
                  Link
                  <input
                    className="form-input"
                    value={href}
                    onChange={(e) => setHref(e.target.value)}
                    placeholder="https://example.com"
                  />
                </label>
                <label className="flex flex-col">
                  Variant
                  <select
                    className="form-input"
                    value={variant}
                    onChange={(e) =>
                      setVariant(
                        e.target.value as 'info' | 'success' | 'warning' | 'error'
                      )
                    }
                  >
                    <option value="info">info</option>
                    <option value="success">success</option>
                    <option value="warning">warning</option>
                    <option value="error">error</option>
                  </select>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={dismissible}
                    onChange={(e) => setDismissible(e.target.checked)}
                  />
                  Dismissible
                </label>
              </div>
            </div>
          </div>
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
          <div className="flex flex-col-reverse items-center gap-6 md:flex-row md:gap-8">
            <div className="space-y-4 text-center md:text-left">
              <h1 className="text-5xl font-extrabold">Design, delivered.</h1>
              <p className="text-lg">Reusable tokens and components to build quickly.</p>
              <Button as="a" href="#" variant="primary">Get started</Button>
            </div>
            {showHeroImage && (
              <Hero
                src="/vercel.svg"
                alt="Vercel logo"
                width={400}
                height={200}
                priority={false}
              />
            )}
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showHeroImage}
              onChange={(e) => setShowHeroImage(e.target.checked)}
            />
            Show image
          </label>
        </section>
        <section className="card space-y-4 md:col-span-2" aria-labelledby="palette">
          <h2 id="palette" className="text-xl font-semibold">Palette</h2>
          <label className="inline-flex items-center gap-2 text-sm">
            Palette
            <select
              className="form-input"
              value={paletteGroup}
              onChange={(e) => setPaletteGroup(e.target.value as PaletteGroup)}
            >
              <option value="brand">brand</option>
              <option value="surface">surface</option>
            </select>
          </label>
          <ul className="grid grid-cols-3 gap-4" aria-label={`${paletteGroup} color tokens`}>
            {paletteTokens[paletteGroup].map((c) => (
              <li key={c.name} className="border border-border-subtle rounded">
                <div
                  className={`h-16 rounded-t ${c.light ? 'border border-border-subtle' : ''}`}
                  style={{ backgroundColor: `var(${c.var})` }}
                />
                <p className="p-2 text-sm flex items-center justify-between">
                  <span>{c.name}</span>
                  <span className="font-mono">{colorValues[c.name]}</span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
