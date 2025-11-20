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
} from "lucide-react";
import { candlestick } from "@lucide/lab";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  GITHUB_LICENSE_URL,
  GITHUB_NEW_ISSUE_URL,
  GITHUB_REPO_URL,
} from "@/constants/links";

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
    name: "Tarifat Doganore",
    href: "/customs-codes",
    description:
      "Kërko listën e tarifave të Kosovës, krahaso normat doganore dhe llogarit detyrimet e importit në çast.",
    cta: "Shfleto kodet doganore",
    icon: PackageSearch,
    category: "Tregtia & dogana",
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
    name: "Aktiviteti ekonomik",
    href: "/economic-activity",
    description:
      "Qarkullimi vjetor i bizneseve të Kosovës sipas kategorive ekonomike dhe komunave, i bazuar në të dhënat e Ministrisë së Financave.",
    cta: "Shiko qarkullimin",
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
    name: "Lejet e ndërtimit të Prishtinës",
    href: "/prishtina-building-permits",
    description:
      "Shfleto lejet e ndërtimit të publikuara nga Komuna e Prishtinës, filtro sipas lagjes, destinimit ose pronarit",
    cta: "Shiko lejet",
    icon: Hammer,
    category: "Administrata publike",
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
    name: "Kalkulatori i pagave",
    href: "/wage-calculator",
    description:
      "Parashiko pagën neto pas trustit, tatimit në të ardhura dhe kontributeve sipas rregullave në Kosovë.",
    cta: "Planifiko pagën",
    icon: HandCoins,
    category: "Financa",
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

const totalTools = tools.length;
const toolCategories = Array.from(new Set(tools.map((tool) => tool.category)));

export default function Page() {
  return (
    <main className="flex flex-col gap-24 px-3 sm:px-6 py-16 sm:py-24">
      <section className="mx-auto grid w-full max-w-[1500px] gap-12 text-center lg:grid-cols-12 lg:items-center lg:gap-16 lg:text-left">
        <div className="flex flex-col items-center gap-8 lg:col-span-7 lg:items-start">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-xs font-medium uppercase tracking-wide text-primary">
            Të dhëna të hapura për të gjithë
          </span>
          <div className="space-y-6 lg:max-w-2xl">
            <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl xl:text-6xl">
              Kthe të dhënat publike në vendime
            </h1>
            <p className="text-balance text-muted-foreground text-sm sm:text-lg">
              Kalkulatorë, grafe dhe eksplorues nga burime zyrtare të Kosovës –
              për qytetarë, biznese dhe politika.
            </p>
            <p className="text-balance text-muted-foreground text-sm sm:text-base">
              Përfshihen doganat, pagat, tregtia, inflacioni, energjia dhe më
              shumë.
            </p>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Ndërtuar për interes publik dhe licencuar nën GNU Affero General
              Public License v3.{" "}
              <a
                className="font-medium underline hover:text-primary"
                href={GITHUB_LICENSE_URL}
                rel="noreferrer"
                target="_blank"
              >
                Shikoni kodin burimor
              </a>{" "}
              dhe kontribuoni lirshëm.
            </p>
            <p className="text-xs text-amber-700 sm:text-sm">
              Të dhënat burimore mbeten pronë e institucioneve përkatëse; jo çdo
              dataset është në domen publik. Ne japim atributet për burimet,
              respektojmë licencat e tyre dhe nuk pretendojmë pronësi mbi
              përmbajtjen.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Button asChild size="lg">
              <Link href="/#tools">
                Eksploro veglat
                <ArrowRight aria-hidden className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={GITHUB_REPO_URL} rel="noreferrer" target="_blank">
                Kontribuo në GitHub
              </a>
            </Button>
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-lg flex-col gap-6 rounded-3xl border border-border/60 bg-background/80 p-8 text-left shadow-sm backdrop-blur lg:col-span-5 lg:mx-0 lg:max-w-none">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
              Panorama e veglave
            </span>
            <h2 className="text-2xl font-semibold leading-snug">
              {totalTools} vegla të licencuara hapur për komunitetin
            </h2>
            <p className="text-sm text-muted-foreground">
              Zgjedhni shërbimet që ju duhen për taksa, paga dhe analiza
              statistikore. Gjithçka ndërtohet me transparencë dhe baza të
              përditësuara të të dhënave.
            </p>
          </div>
          <dl className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-primary/5 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-primary">
                Seksione
              </dt>
              <dd className="text-lg font-semibold">{toolCategories.length}</dd>
            </div>
            <div className="rounded-2xl bg-muted/40 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Qasje
              </dt>
              <dd className="text-lg font-semibold">Falas</dd>
            </div>
            <div className="rounded-2xl bg-muted/40 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Licenca
              </dt>
              <dd className="text-lg font-semibold">AGPL-3.0</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            {toolCategories.map((category) => (
              <span
                key={category}
                className="rounded-full border border-border/60 px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section
        className="mx-auto flex w-full max-w-[1500px] flex-col gap-10"
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
            Çdo vegël është përgatitur me ndërfaqe në shqip, llogaritje të sakta
            dhe referenca të përditësuara nga institucionet e Kosovës.
          </p>
        </header>
        <div className="space-y-7">
          {groupedTools.map((group) => (
            <div key={group.category} className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-primary text-nowrap">
                  {group.category}
                </span>
                <span className="h-px w-full bg-border/60" />
              </div>
              <div className="grid gap-2">
                {group.tools.map((tool) => {
                  const Icon = tool.icon;

                  return (
                    <Link
                      key={tool.name}
                      className="group flex items-start gap-4 rounded-2xl border border-border/50 bg-background/60 px-4 py-3 transition hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      href={tool.href}
                    >
                      <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition group-hover:bg-primary/15">
                        <Icon aria-hidden className="h-4 w-4" />
                      </span>
                      <span className="flex flex-1 flex-col gap-1">
                        <span className="text-sm font-medium">{tool.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {tool.description}
                        </span>
                      </span>
                      <ArrowRight
                        aria-hidden
                        className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary"
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        className="mx-auto flex w-full max-w-[1500px] flex-col gap-8 text-center sm:text-left"
        id="about"
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">
          Plani i zhvillimit
        </span>
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Më shumë vegla për interes publik në rrugë e sipër
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Kosova Tools është projekt i hapur me kod të publikuar në GitHub. Na
            ndihmoni të përcaktojmë veglën e radhës që i shërben komunitetit.
          </p>
        </div>
        <Card className="border-dashed border-border/60 bg-background/60">
          <CardHeader className="flex flex-col gap-4 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
            <div className="space-y-2 sm:w-2/3">
              <CardTitle className="text-2xl font-semibold leading-tight">
                Kemi ide të reja, por duam t'i dëgjojmë edhe tuajat
              </CardTitle>
              <CardDescription className="text-sm">
                Sugjeroni kalkulatorë, eksplorues të të dhënave ose shërbime të
                tjera që do t'ua lehtësonin punën banorëve dhe institucioneve.
              </CardDescription>
            </div>
            <Button
              asChild
              className="w-full sm:w-auto sm:self-center"
              variant="secondary"
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
