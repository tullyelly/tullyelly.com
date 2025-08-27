// Tailwind v4 — ESM config
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
        white: "var(--white)",
        black: "var(--black)",
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
    },
  },
  plugins: [],
};
