/**
 * UI Lab page
 * Server wrapper for component showcase.
 * Renders the client-side <DemoLab /> component.
 */

import { buildPageMetadata } from '@/lib/page-metadata';
import type { PageFrontmatter } from '@/types/frontmatter';
import DemoLab from './DemoLab';

const frontmatter = {
  title: 'UI Lab',
  description: 'Showcase of UI components and color tokens',
  canonical: 'https://tullyelly.com/ui-lab',
} satisfies PageFrontmatter;

export const metadata = buildPageMetadata(frontmatter);

export default function Page() {
  return <DemoLab />;
}

