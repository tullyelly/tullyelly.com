# Contentlayer Inference

Chronicle MDX is a small content data pipeline. Authors write normal MDX
components, then Contentlayer reads the MDX tree and adds useful metadata to the
generated post.

The orchestration lives in `contentlayer.config.ts`. The pure parsing helpers
live in `lib/alterEgo.ts`.

## What Gets Inferred

- `tags`: frontmatter tags plus inferred tags from supported MDX components.
- `resolvedAlterEgo`: frontmatter `alterEgo` when present, otherwise the first
  inferred `ReleaseSection` alter ego, otherwise `tullyelly`.
- `personTagUsages`: every `PersonTag` usage with its tag and display label.
- `clanTagUsages`: every `ClanSnapshot` usage with its tag as the display label.

Supported inferred tag sources:

- `ReleaseSection alterEgo="..."` adds alter ego tags.
- `PersonTag tag="..."` adds inline person or concept tags.
- `ClanSnapshot tag="..."` adds clan snapshot tags.
- `YouTubeVideo artist="..."` adds artist tags when `artist` is present.

## How Tags Merge

The computed `tags` field merges values in this order:

1. Frontmatter `tags`
2. Inferred `ReleaseSection` alter ego tags
3. Inferred `PersonTag` tags
4. Inferred `ClanSnapshot` tags
5. Inferred `YouTubeVideo artist` tags

Duplicates are removed after merging, and the first occurrence wins. That means
a tag already listed in frontmatter keeps its frontmatter position.

`PersonTag`, `ClanSnapshot`, and `ReleaseSection` tags are merged as authored.
`YouTubeVideo artist` values are normalized with `normalizeTagSlug`, so
`artist="DJ Shadow"` becomes `dj-shadow`.

Example:

```mdx
---
title: "sample"
date: "2026-07-09"
summary: "Example"
tags: ["volleyball", "jeff-meff"]
---

<ReleaseSection alterEgo="unclejimmy">
  <PersonTag displayName="noah" tag="jeff-meff" />
  <ClanSnapshot tag="t-wolves" />
  <YouTubeVideo id="abc123" artist="DJ Shadow" />
</ReleaseSection>
```

Computed tags:

```ts
["volleyball", "jeff-meff", "unclejimmy", "t-wolves", "dj-shadow"];
```

## Authoring Examples

### ReleaseSection Alter Ego

```mdx
<ReleaseSection alterEgo="cardattack" releaseId="174">
  Card notes go here.
</ReleaseSection>
```

This adds `cardattack` to computed tags. If frontmatter `alterEgo` is omitted,
`resolvedAlterEgo` can use the first inferred `ReleaseSection` alter ego.

Every `ReleaseSection` must declare exactly one string-literal `alterEgo`.

### PersonTag

```mdx
<PersonTag displayName="noah" tag="jeff-meff" />
```

This adds `jeff-meff` to computed tags and records this usage:

```ts
{ tag: "jeff-meff", displayName: "noah" }
```

When `displayName` is omitted, the display name falls back to the tag:

```mdx
<PersonTag tag="tcdb" />
```

```ts
{ tag: "tcdb", displayName: "tcdb" }
```

### ClanSnapshot

```mdx
<ClanSnapshot tag="t-wolves" />
```

This adds `t-wolves` to computed tags and records this clan usage:

```ts
{ tag: "t-wolves", displayName: "t-wolves" }
```

### YouTubeVideo Artist

```mdx
<YouTubeVideo
  id="HORLJvUMs08"
  artist="DJ Shadow"
  album="endtroducing....."
  song="building steam with a single grain of salt"
/>
```

This adds `dj-shadow` to computed tags. `artist` is optional; a YouTube video
without `artist` does not add a tag.

## What Can Break Inference

The inference helpers expect direct MDX JSX component names and literal props.
These patterns can fail or skip inference:

- Missing required props:
  - `ReleaseSection` without `alterEgo`
  - `PersonTag` without `tag`
  - `ClanSnapshot` without `tag`
- Duplicate inferred props, such as two `tag` props on one `PersonTag`.
- Non-string props, such as `tag={personTag}` or `artist={artistName}`.
- An unknown `ReleaseSection alterEgo` value outside the allowed list.
- Renaming or aliasing the component in MDX, such as using `<Tag />` instead of
  `<PersonTag />`; the inference checks exact component names.
- Moving MDX through a build path where the Contentlayer remark plugins do not
  run.

Keep authoring ergonomic: use the supported components directly, use
string-literal props, and let Contentlayer merge the tags.
