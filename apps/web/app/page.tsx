import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Github } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { GITHUB_NEW_ISSUE_URL, GITHUB_REPO_URL } from "@/constants/links";
import { tools, type ToolCard } from "@/constants/tools";
import { Hero } from "@/components/hero";

export const metadata: Metadata = {
  title: "Vegla qytetare për të dhëna, tregti dhe financa në Kosovë",
  description:
    "Kosova Tools mbledh kalkulatorë për doganat, pagat dhe vizualizime statistikore që përdorin të dhëna zyrtare të Republikës së Kosovës.",
  keywords: [
    "Kosova Tools",
    "open data",
    "Kosovo",
    "Kosova",
    "vegla qytetare",
    "të dhëna të hapura",
    "tarifa doganore",
    "kalkulator pagash",
    "statistika Kosovë",
  ],
  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    url: "/",
    title: "Vegla qytetare për të dhëna, tregti dhe financa në Kosovë",
    description:
      "Kosova Tools ofron kalkulatorë doganorë, planifikues pagash dhe dashboardë vizualë nga Agjencia e Statistikave të Kosovës.",
    siteName: "Kosova Tools",
    locale: "sq_AL",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vegla qytetare për të dhëna, tregti dhe financa në Kosovë",
    description:
      "Kalkulatorë dhe grafe të dhënash në shqip që mbështeten në statistika zyrtare të Kosovës.",
  },
};

const groupedTools = tools.reduce<
  Array<{ category: string; tools: ToolCard[] }>
>((acc, tool) => {
  const existingGroup = acc.find((entry) => entry.category === tool.category);

  if (existingGroup) {
    existingGroup.tools.push(tool);
    return acc;
  }

  acc.push({ category: tool.category, tools: [tool] });
  return acc;
}, []);

export default function Page() {
  return (
    <main className="flex flex-col gap-24 px-3 sm:px-6 pb-16 sm:pb-24">
      <Hero
        withFlagBackground
        eyebrow="Të dhëna të hapura për të gjithë"
        title="Kthe të dhënat publike në"
        highlight="vendime"
        description="Eksploro kalkulatorë, grafe dhe analiza nga burime zyrtare të Kosovës. Një platformë e hapur për qytetarë, biznese dhe politikëbërës."
        actions={
          <>
            <Button
              asChild
              size="lg"
              className="h-12 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all w-full sm:w-auto"
            >
              <Link href="/#tools">
                Eksploro veglat
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base backdrop-blur-sm bg-background/50 w-full sm:w-auto"
            >
              <a href={GITHUB_REPO_URL} rel="noreferrer" target="_blank">
                <Github className="mr-2 h-4 w-4" />
                Kontribo në GitHub
              </a>
            </Button>
          </>
        }
      />

      <section
        className="mx-auto flex w-full max-w-[1500px] flex-col gap-10"
        id="tools"
      >
        <header className="flex flex-col gap-3 text-center items-center max-w-2xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            Përzgjedhja aktuale
          </span>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Vegla qytetare gati për t'u{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-blue-600">
              përdorur sot
            </span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Çdo vegël është përgatitur me ndërfaqe në shqip, llogaritje të sakta
            dhe referenca të përditësuara nga institucionet e Kosovës.
          </p>
        </header>
        <div className="space-y-12">
          {groupedTools.map((group) => {
            return (
              <div key={group.category} className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold uppercase tracking-wider text-primary/80 text-nowrap px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
                    {group.category}
                  </span>
                  <span className="h-px w-full bg-linear-to-r from-border/60 to-transparent" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.tools.map((tool) => {
                    const Icon = tool.icon;

                    return (
                      <Link
                        key={tool.name}
                        className="group relative flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/50 dark:bg-white/5 px-6 py-5 transition-all hover:border-primary/20 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 backdrop-blur-sm"
                        href={tool.href}
                      >
                        <div className="flex items-start justify-between">
                          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20 transition-colors group-hover:bg-primary/20">
                            <Icon aria-hidden className="h-5 w-5" />
                          </span>
                          <ArrowRight
                            aria-hidden
                            className="h-5 w-5 text-muted-foreground/50 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary"
                          />
                        </div>

                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg tracking-tight">
                            {tool.name}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {tool.description}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section
        className="mx-auto flex w-full max-w-[1500px] flex-col gap-12 text-center items-center py-12"
        id="about"
      >
        <div className="space-y-4 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            Plani i zhvillimit
          </span>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Më shumë vegla për interes publik në rrugë e sipër
          </h2>
          <p className="text-muted-foreground text-lg">
            Kosova Tools është projekt i hapur me kod të publikuar në GitHub. Na
            ndihmoni të përcaktojmë veglën e radhës që i shërben komunitetit.
          </p>
        </div>

        <Card className="w-full max-w-3xl border border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-md shadow-xl">
          <CardHeader className="flex flex-col gap-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left p-8">
            <div className="space-y-3 sm:w-2/3">
              <CardTitle className="text-2xl font-bold leading-tight">
                Kemi ide të reja, por duam t'i dëgjojmë edhe tuajat
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground/80">
                Sugjeroni kalkulatorë, eksplorues të të dhënave ose shërbime të
                tjera që do t'ua lehtësonin punën banorëve dhe institucioneve.
              </CardDescription>
            </div>
            <Button
              asChild
              className="w-full sm:w-auto sm:self-center h-12 px-6 text-base shadow-lg shadow-primary/10"
              size="lg"
            >
              <a href={GITHUB_NEW_ISSUE_URL} rel="noreferrer" target="_blank">
                Sugjero një ide
                <ArrowRight aria-hidden className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardHeader>
        </Card>
      </section>
    </main>
  );
}
