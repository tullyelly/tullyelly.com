// Tailwind v4 — ESM config
export default {
  content: [
    "./app/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx,mdx}"
  ],
  darkMode: ["media"], // uses prefers-color-scheme; switch to "class" if you want .dark
  theme: {
    extend: {
      colors: {
        cream: "var(--cream)",
        blue: "var(--blue)",
        "blue-contrast": "var(--blue-contrast)",
        green: "var(--green)",
        white: "var(--white)",
        black: "var(--black)",
        "great-lakes": "#0077C0",
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
        "btn-secondary-fg": "var(--btn-secondary-fg)"
      },
      maxWidth: {
        container: "var(--container)"
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"]
      }
    }
  },
  plugins: []
};
