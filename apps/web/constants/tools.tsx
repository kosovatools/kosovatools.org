import {
  BarChart3,
  Building2,
  Car,
  HelpCircle,
  Hammer,
  HandCoins,
  LineChart,
  PackageSearch,
  Percent,
  Pill,
  Plane,
  TrendingUp,
  Zap,
  type LucideIcon,
  type LucideProps,
  Icon,
} from "lucide-react";
import { candlestick } from "@lucide/lab";
import { forwardRef } from "react";

export type ToolCard = {
  name: string;
  href: string;
  description: string;
  cta: string;
  icon: LucideIcon;
  category: string;
};

const CandleIcon: LucideIcon = forwardRef<SVGSVGElement, LucideProps>(
  (props, ref) => <Icon ref={ref} iconNode={candlestick} {...props} />,
);
CandleIcon.displayName = "CandleIcon";

export const tools: ToolCard[] = [
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
    name: "Normat e interesit për kredi",
    href: "/loan-interest-rates",
    description:
      "Normat mujore të interesit për kreditë e reja sipas Bankës Qendrore të Kosovës, me ndarje për ekonomitë familjare dhe korporatat.",
    cta: "Shiko normat",
    icon: Percent,
    category: "Financa",
  },
  {
    name: "Statistikat e aviacionit",
    href: "/aviation-stats",
    description:
      "Shiko hyrjet/daljet e pasagjerëve dhe numrin e fluturimeve mujore nga aeroporti i Kosovës.",
    cta: "Analizo trafikun ajror",
    icon: Plane,
    category: "Statistika",
  },
  {
    name: "Kalkulatori i pagave",
    href: "/wage-calculator",
    description:
      "Parashiko pagën neto pas trustit, tatimit në të ardhura dhe kontributeve sipas rregullave në Kosovë.",
    cta: "Planifiko pagën",
    icon: HandCoins,
    category: "Dogana dhe Taksat",
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
    category: "Dogana dhe Taksat",
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
    name: "Pyetje të shpeshta të ATK",
    href: "/atk-faq",
    description:
      "Kërko bazën e pyetjeve të Administratës Tatimore të Kosovës për TVSH, EDI dhe kuponët fiskalë.",
    cta: "Gjej përgjigje",
    icon: HelpCircle,
    category: "Dogana dhe Taksat",
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

export const toolRoutes = tools.map((tool) => tool.href.replace(/^\//, ""));
