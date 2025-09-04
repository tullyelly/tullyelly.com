# Flowers naming policy

We replace legacy “shout” patterns with the Flowers convention.

- Display label: Flowers
- Inline lead-in: “💐 Flowers: …”
- Canonical slug: `/credits`
- ARIA label: “Acknowledgments” (emoji is aria-hidden)

Examples
- Inline: `💐 Flowers: PostgreSQL, Neon, DataGrip; rekindled my database crush.`
- Block title: `Flowers`

Codemod rules (used by `scripts/refactor-flowers.ts`)
- Star-bullet shouts to: `/^\s*[★\*]\s*shouts?\s+to\s+/mi` → `💐 Flowers: `
- Line-start shouts to: `/^\s*shouts?\s+to\s+/mi` → `💐 Flowers: `
- Headings: `/^(\s*#{1,6}\s*)(Shouts|Liner Notes)\b/mi` → `$1Flowers`
- Label-only lines: `/^(\s*)(Shouts|Liner Notes|Credits)\s*:\s*$/mi` → `$1Flowers:`
- Noun form: `/\bShout[- ]?outs?\b/g` → `Flowers`

Guardrails
- Do not modify “credit(s)” in general prose.
- Do not change inside code fences or URLs.
