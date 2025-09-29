// next.config.mjs
import bundleAnalyzer from '@next/bundle-analyzer';
import createMDX from '@next/mdx';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import remarkSemicolons from './mdx/remark-semicolons-instead-of-emdash.mjs';
const remarkPlugins = [remarkFrontmatter, remarkMdxFrontmatter, remarkSemicolons];

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins,
  },
});

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'mdx'],
  images: {
    // Use Next.js defaults; no custom loader/path.
  },
  // No legacy redirects required.
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
  experimental: {
    optimizePackageImports: ['vaul', 'cmdk', 'lucide-react'],
  },
};

export default withBundleAnalyzer(withMDX(nextConfig));
