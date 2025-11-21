import { forwardRef } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Car,
  Hammer,
  HandCoins,
  LineChart,
  Icon,
  PackageSearch,
  Pill,
  Plane,
  TrendingUp,
  Zap,
  type LucideIcon,
  type LucideProps,
  Github,
} from "lucide-react";
import { candlestick } from "@lucide/lab";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { GITHUB_NEW_ISSUE_URL, GITHUB_REPO_URL } from "@/constants/links";

const CandleIcon: LucideIcon = forwardRef<SVGSVGElement, LucideProps>(
  (props, ref) => <Icon ref={ref} iconNode={candlestick} {...props} />,
);
CandleIcon.displayName = "CandleIcon";

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
      "Kalkulatorë dhe grafe të dhënash në shqip që mbështeten në statistika zyrtare të Kosovës.",
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
    name: "Aktiviteti ekonomik dhe financat publike",
    href: "/economic-activity",
    description:
      "BPV sipas aktiviteteve, qarkullimi i bizneseve dhe të hyrat/shpenzimet e Qeverisë së Përgjithshme me të dhëna nga ASK dhe Ministria e Financave.",
    cta: "Shiko ekonominë",
    icon: LineChart,
    category: "Statistika",
  },
  {
    name: "Indeksi i çmimeve",
    href: "/inflation-tracker",
    description:
      "Monitoro IHÇK-në mujore, çmimet mesatare vjetore dhe indeksin e kostos së ndërtimit për Kosovën.",
    cta: "Analizo çmimet",
    icon: TrendingUp,
    category: "Statistika",
  },
  {
    name: "Statistika të përgjithshme",
    href: "/data-insights",
    description:
      "Grafe vizuale nga ASK për tregtinë e jashtme, karburantet, mjetet motorike dhe turizmin.",
    cta: "Shiko grafet",
    icon: BarChart3,
    category: "Statistika",
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
  {
    name: "Pagat e shërbyesve civilë",
    href: "/public-wage-calculator",
    description:
      "Llogarit pagën mujore bruto sipas koeficientit C, vlerës Z, përvojës dhe orëve shtesë në sektorin publik.",
    cta: "Llogarit pagat publike",
    icon: Building2,
    category: "Administrata publike",
  },
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
    name: "Taksat e importit të veturave",
    href: "/car-import-taxes",
    description:
      "Vlerëso TVSH-në, akcizën dhe detyrimet doganore për veturat e importuara në Republikën e Kosovës.",
    cta: "Llogarit kostot",
    icon: Car,
    category: "Transport",
  },
  {
    name: "Statistikat e aviacionit",
    href: "/aviation-stats",
    description:
      "Shiko hyrjet/daljet e pasagjerëve dhe numrin e fluturimeve mujore nga aeroporti i Kosovës.",
    cta: "Analizo trafikun ajror",
    icon: Plane,
    category: "Transport",
  },
  {
    name: "Gjurmuesi i energjisë",
    href: "/energy-flows",
    description:
      "Shfleto snapshot-e mujore nga ENTSO-E për të parë importet, eksportet dhe bilancin neto të energjisë së Kosovës me vendet fqinje.",
    cta: "Analizo rrjedhat e energjisë",
    icon: Zap,
    category: "Energjia",
  },
  {
    name: "Lejet e ndërtimit të Prishtinës",
    href: "/prishtina-building-permits",
    description:
      "Shfleto lejet e ndërtimit të publikuara nga Komuna e Prishtinës, filtro sipas lagjes, destinimit ose pronarit",
    cta: "Shiko lejet",
    icon: Hammer,
    category: "Administrata publike",
  },
  {
    name: "Çmimet e barnave",
    href: "/drug-prices",
    description:
      "Kërko barnat e licencuara nga Ministria e Shëndetësisë, shiko çmimet referuese të shumicës/pakicës dhe krahaso versionet e publikimeve.",
    cta: "Hulumto çmimet",
    icon: Pill,
    category: "Shëndetësia",
  },
  {
    name: "Regjistrat e luftës",
    href: "/war-records",
    description:
      "Statistika dhe regjistrat e personave të vrarë ose të zhdukur në Kosovë (1998-2000) sipas Kosovo Memory Book.",
    cta: "Shfleto regjistrat",
    icon: CandleIcon,
    category: "Kujtesa & drejtësia",
  },
];

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
      <section className="relative isolate -mx-3 sm:-mx-6 overflow-hidden pt-16 pb-12 md:pt-20 md:pb-16 lg:pt-32 lg:pb-20">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]"></div>
        <div className="absolute -left-[10%] -top-[10%] -z-10 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[100px] opacity-50 dark:opacity-20 pointer-events-none"></div>
        <div className="absolute -right-[10%] top-[20%] -z-10 h-[500px] w-[500px] rounded-full bg-secondary/40 blur-[100px] opacity-50 dark:opacity-20 pointer-events-none"></div>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.3),rgba(0,0,0,0))]"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 max-w-4xl mx-auto">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
              Të dhëna të hapura për të gjithë
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-balance">
              Kthe të dhënat publike në{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-blue-600">
                vendime
              </span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl text-balance leading-relaxed">
              Eksploro kalkulatorë, grafe dhe analiza nga burime zyrtare të
              Kosovës. Një platformë e hapur për qytetarë, biznese dhe
              politikëbërës.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
              <Button
                asChild
                size="lg"
                className="h-12 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
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
                className="h-12 px-8 text-base backdrop-blur-sm bg-background/50"
              >
                <a href={GITHUB_REPO_URL} rel="noreferrer" target="_blank">
                  <Github className="mr-2 h-4 w-4" />
                  Kontribo në GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

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
