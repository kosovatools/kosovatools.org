import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BarChart3,
  Car,
  HandCoins,
  PackageSearch,
  Sparkles,
} from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

export const metadata: Metadata = {
  title: "Vegla qytetare për të dhëna, tregti dhe financa në Kosovë",
  description:
    "Kosova Tools mbledh kalkulatorë për doganat, pagat dhe vizualizime statistikore që përdorin të dhëna zyrtare të Republikës së Kosovës.",
  keywords: [
    "Kosova Tools",
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
      "Kalkulatorë dhe pultë të dhënash në shqip që mbështeten në statistika zyrtare të Kosovës.",
  },
};

type ToolCard = {
  name: string;
  href: string;
  description: string;
  cta: string;
  icon: LucideIcon;
  category: string;
};

const tools: ToolCard[] = [
  {
    name: "Tarifat Doganore",
    href: "/customs-codes",
    description:
      "Kërko listën e tarifave të Kosovës, krahaso normat doganore dhe llogarit detyrimet e importit në çast.",
    cta: "Shfleto kodet doganore",
    icon: PackageSearch,
    category: "Tregtia & dogana",
  },
  {
    name: "Analiza të të dhënave",
    href: "/data-insights",
    description:
      "Pultë vizuale nga të dhënat e ASK për të kuptuar demografinë, punësimin dhe çmimet.",
    cta: "Shiko grafet",
    icon: BarChart3,
    category: "Statistika",
  },
  {
    name: "Taksat e importit të veturave",
    href: "/car-import-taxes",
    description:
      "Vlerëso TVSH-në, akcizën dhe detyrimet doganore për veturat e importuara në Republikën e Kosovës.",
    cta: "Llogarit kostot",
    icon: Car,
    category: "Transport",
  },
  {
    name: "Kalkulatori i pagave",
    href: "/wage-calculator",
    description:
      "Parashiko pagën neto pas trustit, tatimit në të ardhura dhe kontributeve sipas rregullave në Kosovë.",
    cta: "Planifiko pagën",
    icon: HandCoins,
    category: "Financa",
  },
];

type RoadmapCard = {
  name: string;
  description: string;
  cta: string;
  icon: LucideIcon;
  category: string;
  href?: string;
  external?: boolean;
};

const roadmap: RoadmapCard[] = [
  {
    name: "Më shumë vegla qytetare",
    description:
      "Na ndihmo të vendosim çfarë të ndërtojmë më pas—gjurmues buxhetorë, eksplorues të prokurimit e të tjera.",
    cta: "Sugjero një ide",
    icon: Sparkles,
    category: "Ide",
    href: "https://github.com/kosovatools/kosovatools.org/issues/new/choose",
    external: true,
  },
];

export default function Page() {
  return (
    <main className="flex flex-col gap-24 px-6 py-16 sm:py-24">
      <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-xs font-medium uppercase tracking-wide text-primary">
          Të dhëna të hapura për të gjithë
        </span>
        <div className="space-y-6">
          <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl">
            Vegla praktike për banorët e Kosovës, sipërmarrësit dhe hartuesit e
            politikave.
          </h1>
          <p className="text-balance text-muted-foreground text-sm sm:text-lg">
            Kosova Tools bashkon kalkulatorë, eksplorues dhe pultë që të merrni
            vendime të informuara me të dhëna publike të besueshme.
          </p>
          <p className="text-center text-xs text-muted-foreground sm:text-sm">
            Ndërtuar për interes publik dhe licencuar nën GNU Affero General
            Public License v3.{" "}
            <a
              className="font-medium underline hover:text-primary"
              href="https://github.com/kosovatools/kosovatools.org/blob/main/LICENSE"
              rel="noreferrer"
              target="_blank"
            >
              Shikoni kodin burimor
            </a>{" "}
            dhe kontribuoni lirshëm.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/#tools">
              Eksploro veglat
              <ArrowRight aria-hidden className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a
              href="https://github.com/kosovatools/kosovatools.org"
              rel="noreferrer"
              target="_blank"
            >
              Kontribuo në GitHub
            </a>
          </Button>
        </div>
      </section>

      <section
        className="mx-auto flex w-full max-w-6xl flex-col gap-10"
        id="tools"
      >
        <header className="flex flex-col gap-3 text-center sm:text-left">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            Përzgjedhja aktuale
          </span>
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Vegla qytetare gati për t'u përdorur sot
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Çdo vegël është përgatitur me ndërfaqe dygjuhëshe, llogaritje të
            sakta dhe referenca të përditësuara nga institucionet e Kosovës.
          </p>
        </header>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 auto-rows-auto items-start">
          {tools.map((tool) => {
            const Icon = tool.icon;

            return (
              <Card key={tool.name} className="border-border/70 pb-0">
                <CardHeader className="gap-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-border/70 px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {tool.category}
                    </span>
                    <Icon aria-hidden className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-semibold leading-tight">
                    {tool.name}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-6">
                  <Button asChild className="w-full" variant="secondary">
                    <Link href={tool.href}>
                      {tool.cta}
                      <ArrowRight aria-hidden className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby="how-it-works-title"
        className="mx-auto flex w-full max-w-5xl flex-col gap-10 rounded-3xl border border-border/60 bg-card/60 px-8 py-12 backdrop-blur"
        id="how-it-works"
      >
        <div className="space-y-3 text-center sm:text-left">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            Pse ka rëndësi
          </span>
          <h2
            id="how-it-works-title"
            className="text-3xl font-semibold sm:text-4xl"
          >
            Ndërtuar për qartësi, mirëmbajtur hapur
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Çdo funksionalitet është i dokumentuar, transparent dhe i mbështetur
            në kornizat ligjore më të fundit. Gjithmonë e dini cilat të dhëna
            ushqejnë vendimet tuaja.
          </p>
        </div>
        <dl className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-2 rounded-2xl bg-background/70 p-5 shadow-sm">
            <dt className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Burime të verifikuara
            </dt>
            <dd className="text-sm text-muted-foreground">
              Përditësuar drejtpërdrejt nga Dogana e Kosovës, Administrata
              Tatimore dhe Agjencia e Statistikave të Kosovës.
            </dd>
          </div>
          <div className="space-y-2 rounded-2xl bg-background/70 p-5 shadow-sm">
            <dt className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Matematikë transparente
            </dt>
            <dd className="text-sm text-muted-foreground">
              Llogaritjet mbështeten në formulat e publikuara që të verifikoni
              çdo supozim dhe ndryshim norme.
            </dd>
          </div>
          <div className="space-y-2 rounded-2xl bg-background/70 p-5 shadow-sm">
            <dt className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Dizajn i qasshëm
            </dt>
            <dd className="text-sm text-muted-foreground">
              Ndërfaqet përshtaten në shqip dhe anglisht, me navigim nga
              tastiera dhe modalitet të errët të gatshëm.
            </dd>
          </div>
        </dl>
      </section>

      <section
        className="mx-auto flex w-full max-w-6xl flex-col gap-10"
        id="about"
      >
        <header className="flex flex-col gap-3 text-center sm:text-left">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            Plani i zhvillimit
          </span>
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Më shumë vegla për interes publik në rrugë e sipër
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Kosova Tools është projekt i hapur me kod të publikuar në GitHub.
            Kontributet nga komuniteti janë të mirëpritura për të zgjeruar
            platformën. Ja çfarë planifikojmë më tej.
          </p>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          {roadmap.map((entry) => {
            const Icon = entry.icon;
            const actionable = Boolean(entry.href);

            return (
              <Card
                key={entry.name}
                className="h-full border-dashed border-border/60 bg-background/60 pb-0"
              >
                <CardHeader className="gap-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-border/60 px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {entry.category}
                    </span>
                    <Icon aria-hidden className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-semibold leading-tight">
                    {entry.name}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {entry.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-6">
                  {actionable ? (
                    <Button asChild className="w-full" variant="secondary">
                      {entry.external ? (
                        <a href={entry.href} rel="noreferrer" target="_blank">
                          {entry.cta}
                          <ArrowRight aria-hidden className="ml-2 h-4 w-4" />
                        </a>
                      ) : (
                        <Link href={entry.href!}>
                          {entry.cta}
                          <ArrowRight aria-hidden className="ml-2 h-4 w-4" />
                        </Link>
                      )}
                    </Button>
                  ) : (
                    <Button className="w-full" disabled variant="outline">
                      {entry.cta}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
