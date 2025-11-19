"use client";
import {
  tradePartners,
  fuelDataset,
  tradeChaptersYearly,
  vehicleTypesYearly,
  tourismCountry,
  tourismRegion,
} from "@workspace/kas-data";
import { DatasetRenderer } from "@workspace/ui/custom-components/dataset-renderer";

import { FuelBalanceChart } from "./charts/fuel-balance-chart";
import { TradeChapterStackedChart } from "./charts/trade-chapter-stacked-chart";
import { TradePartnersStackedChart } from "./charts/trade-partners-stacked-chart";
import { TourismCountryStackedChart } from "./charts/tourism-country-stacked-chart";
import { TourismRegionCharts } from "./charts/tourism-region-stacked-chart";
import { VehicleTypesStackedChart } from "./charts/vehicle-types-stacked-chart";

export function DataInsightsDashboard() {
  return (
    <div className="space-y-8">
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">
          Tregtia & Dogana
        </h2>
        <DatasetRenderer
          dataset={tradeChaptersYearly}
          title="Kapitujt kryesorë të tregtisë (shtresuar)"
          description="Të dhëna vjetore për eksportet (FOB) dhe importet (CIF) sipas kapitujve të nomenklaturës doganore. Ndrysho fluksin ose filtro kapitujt kryesorë për të parë kontributet në vite."
        >
          {(dataset) => <TradeChapterStackedChart dataset={dataset} />}
        </DatasetRenderer>
        <DatasetRenderer
          dataset={tradePartners}
          title="Kontributet e partnerëve (shtresuar)"
          description='Partnerët kryesorë tregtarë gjatë vitit të fundit. Rregullo përzgjedhjen ose aktivizo kategorinë "Të tjerët" për të parë partnerët më të vegjël.'
        >
          {(dataset) => <TradePartnersStackedChart dataset={dataset} top={6} />}
        </DatasetRenderer>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Karburantet</h2>
        <DatasetRenderer
          dataset={fuelDataset}
          title="Bilanci i furnizimit me karburante"
          description="Disponueshmëria mujore e karburanteve sipas llojit. Ndrysho metrikat për të krahasuar prodhimin, flukset tregtare, rezervat ose vëllimet gati për treg."
        >
          {(dataset) => <FuelBalanceChart dataset={dataset} />}
        </DatasetRenderer>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Transporti</h2>
        <DatasetRenderer
          dataset={vehicleTypesYearly}
          title="Mjetet motorike sipas llojit"
          description="Seri vjetore për mjetet motorike dhe jo motorike të raportuara nga ASK. Grafiku shtresor shfaq të gjitha kategoritë si vetura, autobusë, rimorkio dhe të tjera."
        >
          {(dataset) => <VehicleTypesStackedChart dataset={dataset} />}
        </DatasetRenderer>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Turizmi</h2>
        <DatasetRenderer
          dataset={tourismCountry}
          title="Vendet kryesore të vizitorëve (shtresuar)"
          description="Vendet e origjinës kryesuese të radhitura sipas vizitorëve ose netëve të qëndrimit gjatë vitit të fundit."
        >
          {(dataset) => (
            <TourismCountryStackedChart dataset={dataset} top={5} />
          )}
        </DatasetRenderer>
        <DatasetRenderer
          dataset={tourismRegion}
          title="Turizmi sipas rajonit"
          description="Vizualizime të shumëfishta për rajonet e Kosovës me filtra sipas grupeve të vizitorëve."
        >
          {(dataset) => <TourismRegionCharts dataset={dataset} />}
        </DatasetRenderer>
      </section>
    </div>
  );
}
