// Tailwind v4 — ESM config
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx,mdx}",
    "./pages/**/*.{ts,tsx,mdx}",
    "./src/**/*.{ts,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cream: "var(--cream)",
        blue: "var(--blue)",
        "blue-contrast": "var(--blue-contrast)",
        green: "var(--green)",
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
        surface: "var(--surface)",
        border: "var(--border)",
        fg: "var(--fg)",
        "tc-chrome-silver": "var(--tc-chrome-silver)",
        "tc-chrome-hi": "var(--tc-chrome-hi)",
        "tc-chrome-mid": "var(--tc-chrome-mid)",
        "tc-chrome-lo": "var(--tc-chrome-lo)",
        "tc-chrome-shadow": "var(--tc-chrome-shadow)",
        brand: {
          bucksGreen: "#00471B",
          creamCityCream: "#EEE1C6",
          greatLakesBlue: "#0077C0",
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
    },
  },
  plugins: [tailwindcssAnimate],
};
