import Hero from '@/components/Hero';
import { buildPageMetadata } from '@/lib/page-metadata';
import type { PageFrontmatter } from '@/types/frontmatter';

const frontmatter: PageFrontmatter = {
  title: 'HEELS HAVE EYES',
  description: 'A shareable static page for HEELS HAVE EYES.',
  canonical: 'https://tullyelly.com/heels-have-eyes',
  hero: {
    src: '/images/optimized/shaolin logo.webp',
    alt: 'HEELS HAVE EYES hero',
    width: 1200,
    height: 675,
  },
};

export const metadata = buildPageMetadata(frontmatter);


export default function Page() {
  return (
    <article className="section" aria-labelledby="title">
      <h1 id="title">{frontmatter.title}</h1>
      <p>This page uses the same base layout, tokens, and image pipeline.</p>
      <Hero {...frontmatter.hero} caption="Hero image served from the optimized folder." />
    </article>
  );
}