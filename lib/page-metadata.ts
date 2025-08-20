import type { Metadata } from 'next';
import type { PageFrontmatter } from '@/types/frontmatter';

export function buildPageMetadata(frontmatter: PageFrontmatter): Metadata {
  const { title, description, canonical, hero } = frontmatter;

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title,
      description,
      images: hero
        ? [
            {
              url: hero.src,
              width: hero.width,
              height: hero.height,
              alt: hero.alt,
            },
          ]
        : undefined,
    },
  };
}
