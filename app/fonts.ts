import localFont from "next/font/local";

export const inter = localFont({
  src: [
    {
      path: require.resolve(
        "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2"
      ),
      style: "normal",
      weight: "100 900",
    },
    {
      path: require.resolve(
        "@fontsource-variable/inter/files/inter-latin-wght-italic.woff2"
      ),
      style: "italic",
      weight: "100 900",
    },
  ],
  variable: "--font-inter",
  display: "swap",
});

export const jbMono = localFont({
  src: [
    {
      path: require.resolve(
        "@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2"
      ),
      style: "normal",
      weight: "100 800",
    },
    {
      path: require.resolve(
        "@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-italic.woff2"
      ),
      style: "italic",
      weight: "100 800",
    },
  ],
  variable: "--font-jbmono",
  display: "swap",
});
