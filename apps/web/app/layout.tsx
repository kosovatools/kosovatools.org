import Link from "next/link";
import type { Metadata } from "next";
import { Github } from "lucide-react";
import { Geist } from "next/font/google";
import Script from "next/script";

import "@workspace/ui/globals.css";

import { GITHUB_REPO_URL } from "@/constants/links";
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

const currentYear = new Date().getFullYear();

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
            <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/40 backdrop-blur-md supports-[backdrop-filter]:bg-background/20">
              <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4 px-6 py-3 sm:py-4">
                <div className="flex items-center gap-6">
                  <Link
                    href="/"
                    className="flex items-center gap-2 text-sm font-bold tracking-tight transition hover:text-primary sm:text-base"
                  >
                    Kosova Tools
                  </Link>
                  <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex md:text-base">
                    <Link
                      className="transition hover:text-primary"
                      href="/#tools"
                    >
                      Veglat
                    </Link>
                    <Link
                      className="transition hover:text-primary"
                      href="/about"
                    >
                      Transparenca
                    </Link>
                  </nav>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <a
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-medium transition hover:bg-white/10 hover:text-primary backdrop-blur-sm"
                    href={GITHUB_REPO_URL}
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
            <footer className="border-t border-white/10 bg-background/40 backdrop-blur-sm">
              <div className="mx-auto flex w-full max-w-[1500px] items-center justify-center px-6 py-8">
                <div className="flex flex-col items-center gap-4 text-center">
                  <a
                    className="flex items-center gap-2 text-lg font-semibold text-foreground transition hover:text-primary"
                    href={GITHUB_REPO_URL}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Ndërtuar me
                    <span aria-label="zemër e kuqe" role="img" className="animate-pulse">
                      ❤️
                    </span>
                    në
                    <span aria-label="flamuri i Kosovës" role="img">
                      🇽🇰
                    </span>
                  </a>
                  <span className="text-sm text-muted-foreground">
                    © {currentYear} Kosova Tools · Licensed under GPL
                  </span>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
