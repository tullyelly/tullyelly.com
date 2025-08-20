import Hero from '@/components/Hero';
import { buildPageMetadata } from '@/lib/page-metadata';
import type { PageFrontmatter } from '@/types/frontmatter';

const frontmatter: PageFrontmatter = {
  title: 'Roadwork Rappin’',
  description: 'A shareable static page for Roadwork Rappin’.',
  canonical: 'https://tullyelly.com/roadwork-rappin',
  hero: {
    src: '/images/optimized/cardattack logo.webp',
    alt: 'Roadwork Rappin’ hero',
    width: 1200,
    height: 675,
  },
};

export const metadata = buildPageMetadata(frontmatter);


export default function Page() {
  return (
    <article className="section" aria-labelledby="title">
      <h1 id="title">{frontmatter.title}</h1>
      <p>This page verifies our base layout, tokens, and image pipeline in Next.js.</p>
      <Hero {...frontmatter.hero} caption="Hero image served from the optimized folder." />
    </article>
  );
}