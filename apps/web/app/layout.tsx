import Link from "next/link";
import type { Metadata } from "next";
import { Github, LayoutGrid } from "lucide-react";
import { Geist } from "next/font/google";
import Script from "next/script";

import "@workspace/ui/globals.css";

import { Providers } from "@/components/providers";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  metadataBase: new URL("https://kosovatools.org"),
  title: {
    default: "Kosova Tools",
    template: "%s | Kosova Tools",
  },
  description:
    "Vegla praktike për banorët e Kosovës, të mundësuara nga të dhënat e hapura.",
  openGraph: {
    type: "website",
    url: "https://kosovatools.org",
    title: "Kosova Tools",
    description:
      "Vegla praktike për banorët e Kosovës, të mundësuara nga të dhënat e hapura.",
    siteName: "Kosova Tools",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kosova Tools",
    description:
      "Vegla praktike për banorët e Kosovës, të mundësuara nga të dhënat e hapura.",
  },
};

const geist = Geist({
  subsets: ["latin"],
});

const themeInitScript = `
(() => {
  try {
    const root = document.documentElement;
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = storedTheme === "light" || storedTheme === "dark"
      ? storedTheme
      : prefersDark
        ? "dark"
        : "light";

    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.style.colorScheme = theme;
  } catch {
    // Ignore if access to localStorage or matchMedia fails
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sq" className={geist.className} suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body className="font-sans antialiased">
        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id="8ce63f83-6b4d-4169-b878-fde943cea543"
          strategy="afterInteractive"
        />
        <Providers>
          <div className="flex min-h-svh flex-col bg-background">
            <header className="border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4 px-6 py-3 sm:py-4">
                <div className="flex items-center gap-6">
                  <Link
                    href="/"
                    className="flex items-center gap-2 text-sm font-semibold tracking-tight transition hover:text-primary sm:text-base"
                  >
                    <LayoutGrid aria-hidden className="h-4 w-4" />
                    Kosova Tools
                  </Link>
                  <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex md:text-base">
                    <Link
                      className="transition hover:text-primary"
                      href="/#tools"
                    >
                      Veglat
                    </Link>
                    <Link
                      className="transition hover:text-primary"
                      href="/#about"
                    >
                      Përfshihu
                    </Link>
                  </nav>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <a
                    className="inline-flex items-center gap-2 rounded-full border border-border/60 px-2.5 py-1 font-medium transition hover:border-primary hover:text-primary"
                    href="https://github.com/kosovatools/kosovatools.org"
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Github aria-hidden className="h-4 w-4" />
                    <span className="hidden sm:inline">GitHub</span>
                  </a>
                  <ThemeToggle />
                </div>
              </div>
            </header>

            <div className="flex-1">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
