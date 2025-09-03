# Shout Out

A lightweight, personality-forward aside for quick editorial notes or playful credits without the heaviness of a card.

## When to use
Use sparingly to highlight fun footnotes or personal asides inline with text. Keep usage tight and let surrounding copy carry the main narrative.

## MDX snippets
Inline:

```mdx
<ShoutOut>shouts to the chronicles wiki <a href="https://dragonlance.fandom.com/wiki/Raistlin_Majere">Raistlin Majere</a></ShoutOut>
```

Block:

```mdx
<ShoutOut as="div" variant="note" icon="sprout">
  Keep your database tidy.
</ShoutOut>
```

## Variants

| variant | description |
| ------- | ----------- |
| whisper | subtle left accent, no background |
| note    | dotted edge with soft background |
| spark   | faint underline that brightens on hover |

## Accessibility & guidelines
- `role="note"` with `aria-label="Shout out"` is applied automatically.
- Avoid link-only shout outs and keep content to roughly 150 characters or less.
- Ensure sufficient color contrast when overriding the accent tone.
