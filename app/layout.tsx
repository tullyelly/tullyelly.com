// app/layout.tsx
import "./globals.css";
import Script from "next/script";
import { initSentry } from "@/lib/sentry";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import Providers from "./providers";
import { inter, jbMono } from "./fonts";

await initSentry();

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "tullyelly",
    template: "%s — tullyelly",
  },
  description: "Dead-simple static pages with a tiny design system.",
  openGraph: {
    title: "tullyelly",
    description: "Dead-simple static pages with a tiny design system.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const announcement = process.env.NEXT_PUBLIC_ANNOUNCEMENT;
  const enableHydrationDiag = Boolean(process.env.NEXT_PUBLIC_HYDRATION_DIAG);

  return (
    <html lang="en" className={`${inter.variable} ${jbMono.variable}`}>
      <head>
        {enableHydrationDiag ? (
          <Script id="hydration-console-tap" strategy="beforeInteractive">
            {`
              (function(){
                try {
                  var origError = console.error;
                  console.error = function(){
                    try {
                      var args = Array.prototype.slice.call(arguments);
                      var msg = (args && args[0] && args[0].toString()) || '';
                      if (/Hydration failed|did not match/i.test(msg)) {
                        (window.__HYDRATION_DIAG__ ||= []).push({
                          tag: 'hydration:console',
                          when: new Date().toISOString(),
                          url: location.href,
                          message: String(args[0]),
                          args: args.slice(1)
                        });
                      }
                    } catch {}
                    return origError.apply(console, arguments);
                  };
                } catch {}
              })();
            `}
          </Script>
        ) : null}
      </head>
      <body className="font-sans min-h-screen flex flex-col bg-[#EEE1C6] text-foreground">
        <Providers>
          {announcement && <AnnouncementBanner message={announcement} dismissible />}

          <header>
            <SiteHeader />
          </header>

          <main id="content" className="flex-1 p-4" tabIndex={-1}>
            <div className="mx-auto w-full max-w-7xl bg-white rounded-lg shadow-sm p-6">
              {children}
            </div>
          </main>

          <Footer />
        </Providers>
      </body>
    </html>
  );
}
