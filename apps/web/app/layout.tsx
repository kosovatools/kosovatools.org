import Link from "next/link";
import type { Metadata } from "next";
import { Github, LayoutGrid } from "lucide-react";
import { Geist } from "next/font/google";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sq" className={geist.className} suppressHydrationWarning>
      <body className="font-sans antialiased">
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
