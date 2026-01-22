// next.config.mjs
import "./lib/dns-polyfill.js";
import bundleAnalyzer from "@next/bundle-analyzer";
import createMDX from "@next/mdx";
import { withContentlayer } from "next-contentlayer2";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkSemicolons from "./mdx/remark-semicolons-instead-of-emdash.mjs";
const remarkPlugins = [
  remarkFrontmatter,
  remarkMdxFrontmatter,
  remarkSemicolons,
];
const isTurbopack = Boolean(process.env.TURBOPACK);

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  pageExtensions: ["ts", "tsx", "mdx"],
  images: {
    // Use Next.js defaults; no custom loader/path.
  },
  // No legacy redirects required.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
  experimental: {
    optimizePackageImports: ["vaul", "cmdk", "lucide-react"],
    mdxRs: {
      remarkPlugins: isTurbopack ? [] : remarkPlugins,
    },
  },
  turbopack: {
    resolveAlias: {
      "contentlayer/generated": "./.contentlayer/generated",
    },
  },
  webpack: (config, { dev }) => {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      (warning) => {
        const resource =
          warning && warning.module && warning.module.resource
            ? warning.module.resource
            : "";
        const msg = String(warning?.message || "");
        const fromContentlayer =
          /@contentlayer2[\\/]+core[\\/]+dist[\\/]+generation[\\/]+generate-dotpkg\.js/.test(
            resource
          );
        const isCacheWarning = msg.includes(
          "Build dependencies behind this expression are ignored and might cause incorrect cache invalidation."
        );
        return fromContentlayer && isCacheWarning;
      },
    ];
    if (dev) {
      if (process.env.NEXT_DISABLE_FS_CACHE === "1") {
        config.cache = false;
      }
      const extraIgnored = ["**/.contentlayer/**", "**/.next/**"];
      const extraIgnoredRegexSource =
        "[\\\\/]\\.contentlayer[\\\\/]|[\\\\/]\\.next[\\\\/]";
      const currentIgnored = config.watchOptions?.ignored;
      if (currentIgnored instanceof RegExp) {
        const combinedIgnored = new RegExp(
          `${currentIgnored.source}|${extraIgnoredRegexSource}`,
          currentIgnored.flags,
        );
        config.watchOptions = {
          ...(config.watchOptions || {}),
          ignored: combinedIgnored,
        };
      } else if (Array.isArray(currentIgnored)) {
        const regexEntries = currentIgnored.filter(
          (entry) => entry instanceof RegExp,
        );
        if (regexEntries.length > 0) {
          const stringEntries = currentIgnored.filter(
            (entry) => typeof entry === "string" && entry.trim().length > 0,
          );
          const globToRegexSource = (value) =>
            value
              .replace(/[.+^${}()|[\]\\]/g, "\\$&")
              .replace(/\\\*\\\*/g, ".*")
              .replace(/\\\*/g, "[^/]*")
              .replace(/\\\?/g, ".");
          const stringSources = stringEntries.map(globToRegexSource);
          const regexSources = regexEntries.map((entry) => entry.source);
          const combinedIgnored = new RegExp(
            [...regexSources, ...stringSources, extraIgnoredRegexSource]
              .filter(Boolean)
              .join("|"),
            regexEntries[0].flags,
          );
          config.watchOptions = {
            ...(config.watchOptions || {}),
            ignored: combinedIgnored,
          };
        } else {
          const ignoredList = currentIgnored.filter(
            (entry) => typeof entry === "string" && entry.trim().length > 0,
          );
          config.watchOptions = {
            ...(config.watchOptions || {}),
            ignored: [...ignoredList, ...extraIgnored],
          };
        }
      } else {
        const ignoredList =
          typeof currentIgnored === "string" && currentIgnored.trim().length > 0
            ? [currentIgnored]
            : [];
        config.watchOptions = {
          ...(config.watchOptions || {}),
          ignored: [...ignoredList, ...extraIgnored],
        };
      }
    }
    return config;
  },
};

const enableContentlayer =
  process.env.NEXT_PUBLIC_ENABLE_CONTENTLAYER === "1" ||
  process.env.ENABLE_CONTENTLAYER === "1";
const isDev = process.env.NODE_ENV !== "production";
const baseConfig = createMDX()(withBundleAnalyzer(nextConfig));
const configWithPlugins =
  !isDev || enableContentlayer ? withContentlayer(baseConfig) : baseConfig;

if (
  configWithPlugins.turbopack &&
  typeof configWithPlugins.turbopack === "object"
) {
  delete configWithPlugins.turbopack.conditions;
  if (Object.keys(configWithPlugins.turbopack).length === 0) {
    delete configWithPlugins.turbopack;
  }
}

export default configWithPlugins;
