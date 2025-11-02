import { useMemo } from "react";

import {
  electricityMonthly,
  fuelBalances,
  kasSources,
  tradeImportsByPartner,
  tradeImportsMonthly,
  tourismByCountry,
  tourismByRegion,
  type TradeImportRecord,
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
  TradeImportsChart,
} from "@workspace/data-insights";

export default function DataInsightsPage() {
  const tradeSource = kasSources.sources["trade_monthly"] as {
    table: string;
    unit: string;
  };
  const energySource = kasSources.sources["energy_monthly"] as {
    table: string;
    unit: string;
  };
  const fuelSource = kasSources.sources["fuel_monthly"] as Record<
    string,
    { table: string; label: string }
  >;
  const tourismSource = kasSources.sources["tourism_monthly"] as {
    region: { table: string };
    country: { table: string };
  };
  const tourismRegionSource = tourismSource.region;
  const tourismCountrySource = tourismSource.country;
  const importsPartnerSource = kasSources.sources["imports_by_partner"] as {
    table: string;
  };

  const generatedLabel = useMemo(() => {
    const generatedAt = new Date(kasSources.generated_at);
    if (Number.isNaN(generatedAt.getTime())) {
      return "Unknown";
    }
    return generatedAt.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const latestTrade = useMemo(() => {
    return tradeImportsMonthly
      .slice()
      .sort((a: TradeImportRecord, b: TradeImportRecord) =>
        a.period.localeCompare(b.period),
      )
      .at(-1);
  }, []);

  const latestTradeLabel = latestTrade
    ? new Date(`${latestTrade.period}-01`).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      })
    : "n/a";

  const fuelSourceLabel = useMemo(() => {
    const entries = Object.values(fuelSource ?? {});
    const parts = entries
      .map((entry) => {
        if (!entry) {
          return "";
        }
        if (entry.label && entry.table) {
          return `${entry.label}: ${entry.table}`;
        }
        return entry.table ?? entry.label ?? "";
      })
      .filter((part) => part.length > 0);
    return parts.length ? parts.join("; ") : "Unknown";
  }, [fuelSource]);

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
            Source: {importsPartnerSource.table}.
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
            Source: {energySource.table} ({energySource.unit}).
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
