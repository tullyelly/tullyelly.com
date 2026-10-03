# Generated files and caches

| Output                                                         | Producer                        | Commit policy                                              |
| -------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------- |
| lib/build-info.ts, .build                                      | gen:build-info                  | Ignored runtime provenance                                 |
| lib/images/optimus-images-manifest.json                        | gen:images-manifest             | Tracked; commit intentional asset changes                  |
| .cache/optimus-images-manifest.json                            | gen:images-manifest             | Ignored dimensions cache; unchanged files reuse dimensions |
| .contentlayer                                                  | content:build / content:dev     | Ignored generated documents                                |
| Prisma client                                                  | gen:prisma / postinstall        | Generated dependency output; do not commit                 |
| public/images/optimus                                          | Image optimizer                 | Commit intended optimized assets                           |
| public/images/source                                           | Author-supplied optimizer input | Ignored; processed inputs removed on success               |
| .next, coverage, test-results, playwright-report, .pw-browsers | Builds and tests                | Ignored                                                    |
| tsconfig.tsbuildinfo, .cache/eslint                            | TypeScript / lint               | Ignored                                                    |

prepare:content runs build-info, image manifest, and Contentlayer generation.
Dev prehooks only run build-info; see [README](../README.md).
Never hand-edit generated documents or manifests to fix a source contract.
Inspect git diff after generation and preserve unrelated tracked changes.
Source-of-truth: [.gitignore](../.gitignore),
[prepare script](../scripts/prepare-content.mjs), and
[manifest generator](../scripts/gen-optimus-images-manifest.mjs).
