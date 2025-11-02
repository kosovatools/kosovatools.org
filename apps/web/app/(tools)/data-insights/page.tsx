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
            Data Insights
          </h1>
          <span className="text-xs text-muted-foreground">
            Dataset refresh: {generatedLabel}
          </span>
        </div>
        <p className="text-muted-foreground">
          Explore Kosovo Agency of Statistics datasets that power KosovoTools.
          Each visualization reflects the most recent cached snapshot in
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">
            packages/stats
          </code>
          .
        </p>
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Trade & Customs</h2>
        <Card>
          <CardHeader>
            <CardTitle>Partner contributions (stacked)</CardTitle>
            <CardDescription>
              Top trading partners over the last year. Adjust the selection or
              toggle the “Other” bucket to inspect smaller partners.
            </CardDescription>
          </CardHeader>
          <CardContent className={chartContentClass}>
            <ImportPartnersStackedChart data={tradeImportsByPartner} top={6} />
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Source: {importsByPartnerSource.table}.
          </CardFooter>
        </Card>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Energy & Fuels</h2>

        <Card>
          <CardHeader>
            <CardTitle>Power imports vs production</CardTitle>
            <CardDescription>
              Monthly electricity imports and domestic generation (GWh).
            </CardDescription>
          </CardHeader>
          <CardContent className={chartContentClass}>
            <ElectricityBalanceChart data={electricityMonthly} />
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Source: {energyMonthlySource.table} ({energyMonthlySource.unit}).
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fuel supply balance</CardTitle>
            <CardDescription>
              Monthly fuel availability by type. Toggle metrics to compare
              production, trade flows, stock, or ready-for-market volumes.
            </CardDescription>
          </CardHeader>
          <CardContent className={chartContentClass}>
            <FuelBalanceChart balances={fuelBalances} months={36} />
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Sources: {fuelSourceLabel}.
          </CardFooter>
        </Card>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Tourism</h2>

        <Card>
          <CardHeader>
            <CardTitle>Top visitor countries (stacked)</CardTitle>
            <CardDescription>
              Leading origin countries stacked by visitors or overnight stays
              across the last year.
            </CardDescription>
          </CardHeader>
          <CardContent className={chartContentClass}>
            <TourismCountryStackedChart data={tourismByCountry} top={5} />
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Source: {tourismCountrySource.table}.
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tourism by region</CardTitle>
            <CardDescription>
              Small multiples for Kosovo regions with visitor-group filters.
            </CardDescription>
          </CardHeader>
          <CardContent className={chartContentClass}>
            <TourismRegionCharts data={tourismByRegion} />
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Source: {tourismRegionSource.table}.
          </CardFooter>
        </Card>
      </section>
    </article>
  );
}
