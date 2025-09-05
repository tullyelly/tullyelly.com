// Tailwind v4 — ESM config
import plugin from 'tailwindcss/plugin'

export default {
  content: [
    "./app/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx,mdx}",
    "./pages/**/*.{js,jsx,ts,tsx,mdx}",
  ],
  darkMode: ["media"], // switch to "class" if you want .dark toggling
  theme: {
    extend: {
      colors: {
        cream: "var(--cream)",
        blue: "var(--blue)",
        "blue-contrast": "var(--blue-contrast)",
        green: "var(--green)",
        "green-900": "var(--green-900)",
        white: "var(--white)",
        black: "var(--black)",
        ink: "var(--ink)",
        "text-primary": "var(--text-primary)",
        "text-on-blue": "var(--text-on-blue)",
        "text-on-green": "var(--text-on-green)",
        "link-on-white": "var(--link-on-white)",
        "link-on-cream": "var(--link-on-cream)",
        "surface-page": "var(--surface-page)",
        "surface-card": "var(--surface-card)",
        "border-subtle": "var(--border-subtle)",
        "btn-primary-bg": "var(--btn-primary-bg)",
        "btn-primary-fg": "var(--btn-primary-fg)",
        "btn-secondary-bg": "var(--btn-secondary-bg)",
        "btn-secondary-fg": "var(--btn-secondary-fg)",
        surface: "var(--surface)",
        bg: "var(--bg)",
        border: "var(--border)",
        fg: "var(--fg)",
        success: "var(--success)",
        warning: "var(--warning)",
        brandPrimary: "var(--brand-primary)",
        brandDivider: "var(--brand-divider)",
        brand: {
          bucksGreen: '#00471B',
          creamCityCream: '#EEE1C6',
          greatLakesBlue: '#0077C0',
          championshipGold: '#F0EBD2',
          red: '#C8102E',
          border: 'var(--border, #e5e7eb)',
          card: 'var(--card, #ffffff)',
        },
        badge: {
          planned: 'var(--badge-planned, #0077C0)',
          released: 'var(--badge-released, #16a34a)',
          minor: 'var(--badge-minor, #16a34a)',
          hotfix: 'var(--badge-hotfix, #C8102E)',
          archived: 'var(--badge-archived, #E9D8C7)',
          patch: 'var(--badge-patch, #F0EBD2)',
          neutral: 'var(--badge-neutral, #64748b)',
        },
      },
      maxWidth: {
        container: "var(--container)",
      },
      fontFamily: {
      sans: [
          "var(--font-inter)",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "var(--font-jbmono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        badge: '9999px',
      },
    },
  },
  plugins: [
    plugin(function ({ addComponents, theme }) {
      addComponents({
        '.badge': {
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.25rem 0.5rem',
          borderRadius: theme('borderRadius.badge'),
          fontSize: '0.875rem',
          fontWeight: '600',
          lineHeight: '1.25rem',
        },
        '.badge--planned': { backgroundColor: theme('colors.badge.planned'), color: '#fff' },
        '.badge--released': { backgroundColor: theme('colors.badge.released'), color: '#fff' },
        '.badge--minor': { backgroundColor: theme('colors.badge.minor'), color: '#fff' },
        '.badge--hotfix': { backgroundColor: theme('colors.badge.hotfix'), color: '#fff' },
        '.badge--archived': { backgroundColor: theme('colors.badge.archived'), color: '#111827' },
        '.badge--patch': { backgroundColor: theme('colors.badge.patch'), color: '#111827' },
        '.badge--neutral': { backgroundColor: theme('colors.badge.neutral'), color: '#fff' },
      })
    }),
  ],
};
