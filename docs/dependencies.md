# Dependency maintenance

Use npm and the Node version in [.nvmrc](../.nvmrc). Keep dependency updates
separate from authored content. Preserve lockfile version 2 from [.npmrc](../.npmrc)
and review both manifest and lockfile changes. npm can substantially rearrange
nested dependencies; compare resolved versions as well as the textual diff.

Start with `npm audit --json` and trace each affected package to its consumer.
Do not use `npm audit fix --force` as a general repair command: it can install
breaking versions outside the declared ranges. A production audit filter can
still include tooling through optional peer dependencies; it does not establish
whether application requests execute a vulnerable API.

## Reviewed compatibility choices

- Keep `prisma` and `@prisma/client` on the same exact reviewed version. The
  current pair is 6.19.3; this cleanup does not migrate the schema or database.
- Keep Next's MDX and bundle analyzer packages aligned with the reviewed Next
  release. The MDX tooling depends on internal Next APIs.
- Retain exact ESLint config 16.1.6 and React Hooks plugin 7.0.1 pins. Hooks 7.1.1
  changes analysis of existing components; adopting that analysis belongs in a
  separate UI/lint review. Existing rules stay enabled. Pinning the config alone
  would still permit the newer plugin through its dependency range.
- Declare `jsdom` directly for Vitest's configured browser environment. Use the
  compatible 26.x version shared with Jest; a nested transitive copy is not a
  reliable test dependency.
- Sharp 0.35.5 includes the patched native image libraries. The scoped Next
  override uses the root Sharp specification so image processing resolves the
  same reviewed version. Keep optional dependencies enabled for platform binaries.
- The scoped `mdx-bundler` override uses `uuid` 11.1.1, which retains CommonJS.
  The frontmatter override reuses the root `remark-mdx-frontmatter` specification,
  currently 6.0.0, already used by the site's static MDX path.
  The latter replaces the vulnerable `toml` parser with `smol-toml`. Recheck these
  overrides when updating the bundler; remove them when upstream dependencies
  supply compatible fixes.
- The legacy telemetry SDK's scoped Jaeger propagator override uses 2.9.0 to fix
  malformed-header handling. It retains the OpenTelemetry API 1.x interface;
  provider construction and trace/baggage propagation must remain compatible.

## Remaining upstream findings

These findings remain visible in `npm audit`; they are not suppressed. Reassess
them when updating Contentlayer or Prisma, or before accepting untrusted build
inputs or enabling Contentlayer telemetry. Repository content and configuration
must remain trusted.

| Dependency chain                                                 | Exposure and current constraint                                                                                                                                                                                | Follow-up                                                                                                               |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Contentlayer 0.5.8 / legacy Effect telemetry / OpenTelemetry 1.x | W3C baggage parsing finding; this repository does not enable `CL_OTEL`. Generated client renderers do not load the telemetry implementation. OTel 2 removes APIs used by this toolchain.                       | Upgrade the parent telemetry integration before replacing its OTel major.                                               |
| Contentlayer source-files / Zod 3.25.76                          | Validation of authored content during generation. Contentlayer uses Zod 3 APIs incompatible with Zod 4; the application's separate Zod 4 dependency is patched.                                                | Update Contentlayer to a compatible patched validator; do not globally override Zod 3 with 4.                           |
| Prisma config 6.19.3 / deepmerge-ts 7.1.5                        | Prisma CLI configuration merging; this checkout has no `prisma.config` file and application requests do not call the configuration loader. Prisma pins this dependency; deepmerge-ts 8 changes merge behavior. | Prefer a compatible upstream Prisma patch over forcing a major override or migrating Prisma solely for the audit count. |

Primary advisories: [OTel baggage](https://github.com/advisories/GHSA-8988-4f7v-96qf),
[Jaeger headers](https://github.com/advisories/GHSA-45rx-2jwx-cxfr),
[Zod collections](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5),
[recursive merging](https://github.com/advisories/GHSA-ggr8-5vv4-36mx), and
[Sharp native libraries](https://github.com/advisories/GHSA-wq5f-xc86-pv6w).

## Install scripts and validation

With npm versions supporting `npm install-scripts`, review pending hooks using
`npm install-scripts ls`. The root `allowScripts` map records approval for exact
reviewed package versions. Do not approve every package or allow arbitrary future
versions. Review the actual hook and its binary-download behavior before using
`npm install-scripts approve <package>@<version>`; the command records policy and
does not itself run the hook. Older npm versions may not enforce this map.

The reviewed hooks cover Prisma generation and engines, Sentry's CLI binary,
Contentlayer's generated type stubs, native resolver and esbuild binaries, and
protobufjs's version-scheme check. Sharp 0.35 has no install hook. A new version
requires another review and a new approval entry.

Verify the lock with `npm ci --include=optional`, then run the complete
`npm run verify:agent` baseline from [validation](validation.md). Dependency
changes also warrant real MDX frontmatter compilation, Sharp decode/resize/encode
checks and the separate Vitest suite when its dependencies change. Rebuild
Contentlayer without its old cache when changing compiler plugins; preserve
authored files and inspect generated manifest changes afterward.

After a Next update, use `npm exec -- next typegen` to regenerate route types
without starting a server. Next owns `next-env.d.ts`, including its generated
route and root-parameter imports. If old `.next/dev/types` files are malformed,
move that ignored generated directory aside before regeneration; do not change
TypeScript checks or hand-edit the generated declarations to hide the error.
