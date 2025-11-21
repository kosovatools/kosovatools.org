import type { Metadata } from "next";
import {
  AlertTriangle,
  Database,
  FileCode2,
  GitBranch,
  Mail,
} from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { GITHUB_NEW_ISSUE_URL, GITHUB_REPO_URL } from "@/constants/links";

export const metadata: Metadata = {
  title: "Rreth projektit",
  description:
    "Kosova Tools dokumenton burimet publike të të dhënave (Kosovë dhe ndërkombëtare), mban skriptet e përpunimit të hapura dhe publik të gjithë kodin burimor. Nuk kërkojmë besim të verbër – çdo gjë mund të verifikohet.",
  alternates: {
    canonical: "/about",
  },
};

const transparencyPillars = [
  {
    title: "Të dhënat janë publike",
    description:
      "Përdorim datasetet e hapura nga institucionet e Kosovës, rajonit dhe burime publike ndërkombëtare, duke i ruajtur të arkivuara për t'u konsultuar.",
    Icon: Database,
  },
  {
    title: "Përpunimi është i gjurmueshëm",
    description:
      "Scraper-at dhe pastrimet dokumentohen në repo: mund të riprodhoni hapat dhe të shihni çdo transformim, pavarësisht nga burimi.",
    Icon: GitBranch,
  },
  {
    title: "Kodi është i hapur",
    description:
      "E gjithë platforma është nën AGPL-3.0. Shikoni, forkojeni ose ripërdoreni pa pasur nevojë të na besoni neve.",
    Icon: FileCode2,
  },
];

const responsibilityNotes = [
  "Mund të ndodhin gabime nga burimet zyrtare ose nga përpunimi ynë. Verifikoni gjithmonë me dokumentet zyrtare.",
  'Platforma ofrohet "as is" pa asnjë garanci apo mbulim përgjegjësie për vendimet që merrni.',
  "Nuk mbledhim ose shfaqim të dhëna personale. Fokusi ynë është vetëm te informacioni publik.",
];

export default function AboutPage() {
  return (
    <main className="flex flex-col gap-24 px-3 sm:px-6 py-16 sm:py-24">
      <section className="mx-auto flex w-full max-w-[1500px] flex-col items-center text-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm">
          <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
          Transparencë për publikun
        </div>

        <div className="space-y-6 max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-balance">
            Rreth{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
              Kosova Tools
            </span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Ky projekt ekziston që qytetarët dhe institucionet të kenë qasje
            praktike në të dhëna publike pa pasur nevojë të besojnë në një burim
            të vetëm. Të dhënat, përpunimi dhe kodi burimor janë të hapura që
            secili të mund t&apos;i inspektojë dhe verifikojë.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="h-12 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
          >
            <a href={GITHUB_REPO_URL} rel="noreferrer" target="_blank">
              Shiko kodin në GitHub
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 px-8 text-base backdrop-blur-sm bg-background/50"
          >
            <a href={GITHUB_NEW_ISSUE_URL} rel="noreferrer" target="_blank">
              Raporto ose sugjero
            </a>
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4">
          <Mail aria-hidden className="h-4 w-4" />
          <a
            className="font-medium underline transition hover:text-primary"
            href="mailto:contact@kosovatools.org"
          >
            contact@kosovatools.org
          </a>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-[1500px] flex-col gap-12 items-center text-center">
        <div className="space-y-4 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            Transparenca teknike
          </span>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Përpunimi dhe kodi burimor janë të hapur
          </h2>
          <p className="text-muted-foreground text-lg">
            Çdo metrikë që shihni vjen nga një burim i verifikueshëm. Proceset e
            pastrimit dokumentohen që të mos mbetet asgjë e paqartë.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full text-left">
          {transparencyPillars.map(({ Icon, title, description }) => (
            <Card
              key={title}
              className="border border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm shadow-lg hover:shadow-xl hover:border-primary/20 transition-all duration-300"
            >
              <CardHeader className="space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                  <Icon aria-hidden className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl font-bold">{title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-[1500px] flex-col gap-10 items-center text-center pb-12">
        <div className="space-y-4 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            Kufizimet dhe përgjegjësia
          </span>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Informacion “as is”
          </h2>
          <p className="text-muted-foreground text-lg">
            Vlerësojmë saktësinë, por gabimet janë të mundshme. Ky projekt nuk
            zëvendëson dokumentet zyrtare.
          </p>
        </div>

        <Card className="w-full max-w-3xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/10 backdrop-blur-sm shadow-xl">
          <CardHeader className="space-y-3 text-left p-8">
            <CardTitle className="text-2xl font-bold text-amber-900 dark:text-amber-100 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              Çfarë duhet të dini
            </CardTitle>
            <CardDescription className="text-base text-amber-900/80 dark:text-amber-50/80">
              Përdorni rezultatet me kujdes dhe krahasojini me burimin origjinal
              kur merrni vendime.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <ul className="space-y-4 text-left">
              {responsibilityNotes.map((note) => (
                <li
                  key={note}
                  className="flex items-start gap-3 text-amber-900/90 dark:text-amber-100/90"
                >
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-base leading-relaxed">{note}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
