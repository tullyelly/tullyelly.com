// next.config.mjs
import createMDX from '@next/mdx';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import jiti from 'jiti';

const remarkPlugins = [remarkFrontmatter, remarkMdxFrontmatter]
if (process.env.ENABLE_SHOUT_OUT_REMARK === '1') {
  const j = jiti(import.meta.url)
  const remarkDirective = j('remark-directive').default
  const shoutOutRemark = j('./lib/mdx/shout-out-remark.ts').default
  remarkPlugins.push(remarkDirective, shoutOutRemark)
}

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'mdx'],
  images: {
    // Use Next.js defaults; no custom loader/path.
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
};

export default withMDX(nextConfig);
