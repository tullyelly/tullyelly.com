/**
 * HEELS HAVE EYES demo page
 * Server wrapper for the Bucks palette style lab.
 * Renders the client-side <HeelsDemo /> component.
 */

import { buildPageMetadata } from '@/lib/page-metadata';
import type { PageFrontmatter } from '@/types/frontmatter';
import HeelsDemo from './HeelsDemo';

const frontmatter: PageFrontmatter = {
  title: 'HEELS HAVE EYES',
  description: 'Style demo playground for the Cream City palette.',
  canonical: 'https://tullyelly.com/heels-have-eyes',
};

export const metadata = buildPageMetadata(frontmatter);

export default function Page() {
  return <HeelsDemo />;
}

