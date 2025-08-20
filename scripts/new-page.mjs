#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';

const [,, slug, ...titleParts] = process.argv;

if (!slug || titleParts.length === 0) {
  console.log('Usage: npm run new-page <slug> "Title"');
  process.exit(1);
}

const title = titleParts.join(' ');
const dir = path.join('app', slug);
await fs.mkdir(dir, { recursive: true });

const content = `---\ntitle: "${title}"\ndescription: ""\ncanonical: "https://tullyelly.com/${slug}"\nhero:\n  src: "/images/optimized/${slug}/hero.webp"\n  alt: "${title} hero"\n  width: 1200\n  height: 675\n---\n\nimport Hero from '@/components/Hero';\nimport { buildPageMetadata } from '@/lib/page-metadata';\n\nexport const metadata = buildPageMetadata(frontmatter);\n\n# ${title}\n\n<Hero {...frontmatter.hero} caption="" />\n`;

await fs.writeFile(path.join(dir, 'page.mdx'), content);
console.log(`Created ${dir}/page.mdx`);
