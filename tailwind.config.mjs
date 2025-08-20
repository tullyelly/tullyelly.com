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
        cream: "var(--color-cream)",
        blue: "var(--color-blue)",
        green: "var(--color-green)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        muted: "var(--color-muted)",
        accent: "var(--color-accent)",
        cta: "var(--color-cta)",
        border: "var(--color-border)"
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