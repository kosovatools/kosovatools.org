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
    <main className="flex flex-col gap-16 px-3 sm:px-6 py-16 sm:py-24">
      <section className="mx-auto grid w-full max-w-[1500px] gap-10 lg:grid-cols-[1.2fr,0.8fr] lg:items-start">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            Transparencë për publikun
          </span>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Rreth Kosova Tools
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Ky projekt ekziston që qytetarët dhe institucionet të kenë qasje
              praktike në të dhëna publike pa pasur nevojë të besojnë në një
              burim të vetëm. Të dhënat, përpunimi dhe kodi burimor janë të
              hapura që secili të mund t&apos;i inspektojë dhe verifikojë,
              pavarësisht nëse vijnë nga Kosovë, rajoni apo agjenci
              ndërkombëtare.
            </p>
            <p className="text-muted-foreground text-sm sm:text-base">
              Ne nuk kërkojmë të dhëna personale, nuk mbajmë informacion për
              përdoruesit dhe çdo burim mund të kontrollohet në GitHub.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href={GITHUB_REPO_URL} rel="noreferrer" target="_blank">
                Shiko kodin në GitHub
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={GITHUB_NEW_ISSUE_URL} rel="noreferrer" target="_blank">
                Raporto ose sugjero
              </a>
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail aria-hidden className="h-4 w-4" />
            <a
              className="font-medium underline transition hover:text-primary"
              href="mailto:contact@kosovatools.org"
            >
              contact@kosovatools.org
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-[1500px] flex-col gap-6">
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            Transparenca teknike
          </span>
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Të dhënat, përpunimi dhe kodi kujtdo
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Çdo metrikë që shihni vjen nga një burim i verifikueshëm, qoftë
            vendor apo ndërkombëtar. Proceset e pastrimit dokumentohen që të mos
            mbetet asgjë e paqartë.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {transparencyPillars.map(({ Icon, title, description }) => (
            <Card
              key={title}
              className="border-border/70 bg-background/80 shadow-sm"
            >
              <CardHeader className="space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon aria-hidden className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl font-semibold">{title}</CardTitle>
                <CardDescription className="text-sm">
                  {description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-[1500px] flex-col gap-5">
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            Kufizimet dhe përgjegjësia
          </span>
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Informacion “as is”
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Vlerësojmë saktësinë, por gabimet janë të mundshme. Ky projekt nuk
            zëvendëson dokumentet zyrtare.
          </p>
        </div>
        <Card className="border-amber-500/50 bg-amber-50/80 shadow-sm dark:bg-amber-950/30">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-semibold text-amber-900 dark:text-amber-100">
              Çfarë duhet të dini
            </CardTitle>
            <CardDescription className="text-amber-900/80 dark:text-amber-50/80">
              Përdorni rezultatet me kujdes dhe krahasojini me burimin origjinal
              kur merrni vendime.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm sm:text-base">
              {responsibilityNotes.map((note) => (
                <li key={note} className="flex items-start gap-3">
                  <AlertTriangle
                    aria-hidden
                    className="mt-1 h-5 w-5 text-amber-700 dark:text-amber-200"
                  />
                  <span className="text-foreground">{note}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
