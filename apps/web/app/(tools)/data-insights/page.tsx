import {
  describeFuelSources,
  electricityMonthly,
  energyMonthlySource,
  formatKasGeneratedLabel,
  fuelBalances,
  importsByPartnerSource,
  tradeImportsByPartner,
  tourismByCountry,
  tourismByRegion,
  tourismMonthlySource,
} from "@workspace/stats";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  ElectricityBalanceChart,
  FuelBalanceChart,
  ImportPartnersStackedChart,
  TourismCountryStackedChart,
  TourismRegionCharts,
} from "@workspace/data-insights";

export default function DataInsightsPage() {
  const { region: tourismRegionSource, country: tourismCountrySource } =
    tourismMonthlySource;

  const generatedLabel = formatKasGeneratedLabel();
  const fuelSourceLabel = describeFuelSources();

  const chartContentClass = "px-2 sm:px-6";

  return (
    <article className="space-y-10">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            Analiza të të dhënave
          </h1>
          <span className="text-xs text-muted-foreground">
            Përditësim i të dhënave: {generatedLabel}
          </span>
        </div>
        <p className="text-muted-foreground">
          Eksploro datasetet e Agjencisë së Statistikave të Kosovës që fuqizojnë
          Kosova Tools. Çdo vizualizim pasqyron kopjen më të fundit të ruajtur në
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">
            packages/stats
          </code>
          .
        </p>
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Tregtia & Dogana</h2>
        <Card>
          <CardHeader>
            <CardTitle>Kontributet e partnerëve (shtresuar)</CardTitle>
            <CardDescription>
              Partnerët kryesorë tregtarë gjatë vitit të fundit. Rregullo
              përzgjedhjen ose aktivizo kategorinë “Të tjerët” për të parë
              partnerët më të vegjël.
            </CardDescription>
          </CardHeader>
          <CardContent className={chartContentClass}>
            <ImportPartnersStackedChart data={tradeImportsByPartner} top={6} />
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Burimi: {importsByPartnerSource.table}.
          </CardFooter>
        </Card>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Energjia & Karburantet</h2>

        <Card>
          <CardHeader>
            <CardTitle>Importet e energjisë kundrejt prodhimit</CardTitle>
            <CardDescription>
              Importet mujore të energjisë elektrike dhe prodhimi vendor (GWh).
            </CardDescription>
          </CardHeader>
          <CardContent className={chartContentClass}>
            <ElectricityBalanceChart data={electricityMonthly} />
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Burimi: {energyMonthlySource.table} ({energyMonthlySource.unit}).
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bilanci i furnizimit me karburante</CardTitle>
            <CardDescription>
              Disponueshmëria mujore e karburanteve sipas llojit. Ndrysho
              metrikat për të krahasuar prodhimin, flukset tregtare, rezervat ose
              vëllimet gati për treg.
            </CardDescription>
          </CardHeader>
          <CardContent className={chartContentClass}>
            <FuelBalanceChart balances={fuelBalances} months={36} />
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Burimet: {fuelSourceLabel}.
          </CardFooter>
        </Card>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Turizmi</h2>

        <Card>
          <CardHeader>
            <CardTitle>Vendet kryesore të vizitorëve (shtresuar)</CardTitle>
            <CardDescription>
              Vendet e origjinës kryesuese të radhitura sipas vizitorëve ose
              netëve të qëndrimit gjatë vitit të fundit.
            </CardDescription>
          </CardHeader>
          <CardContent className={chartContentClass}>
            <TourismCountryStackedChart data={tourismByCountry} top={5} />
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Burimi: {tourismCountrySource.table}.
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Turizmi sipas rajonit</CardTitle>
            <CardDescription>
              Vizualizime të shumëfishta për rajonet e Kosovës me filtra sipas
              grupeve të vizitorëve.
            </CardDescription>
          </CardHeader>
          <CardContent className={chartContentClass}>
            <TourismRegionCharts data={tourismByRegion} />
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Burimi: {tourismRegionSource.table}.
          </CardFooter>
        </Card>
      </section>
    </article>
  );
}
