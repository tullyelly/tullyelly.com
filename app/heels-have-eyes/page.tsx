/**
 * HEELS HAVE EYES demo page
 * Server wrapper for the Bucks palette style lab.
 * Renders the client-side <HeelsDemo /> component.
 */

import { buildPageMetadata } from '@/lib/page-metadata';
import type { PageFrontmatter } from '@/types/frontmatter';
import HeelsDemo from './HeelsDemo';

const frontmatter = {
  title: 'Heels Have Eyes – Style Demo',
  description: 'Playground for Bucks color system & typography rules',
  canonical: 'https://tullyelly.com/heels-have-eyes',
} satisfies PageFrontmatter;

export const metadata = buildPageMetadata(frontmatter);

export default function Page() {
  return <HeelsDemo />;
}

