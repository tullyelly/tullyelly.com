import { buildPageMetadata } from '@/lib/page-metadata'
import type { PageFrontmatter } from '@/types/frontmatter'
import ShoutOutLab from './ShoutOutLab'

const frontmatter = {
  title: 'Shout Out',
  description: 'ShoutOut component playground',
  canonical: 'https://tullyelly.com/ui-lab/shout-out',
} satisfies PageFrontmatter

export const metadata = buildPageMetadata(frontmatter)

export default function Page() {
  return <ShoutOutLab />
}
