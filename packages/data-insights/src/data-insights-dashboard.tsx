"use client";
import {
  loadDataset,
  type TradePartnersDataset,
  type FuelDataset,
  type TradeChaptersDataset,
  type VehicleTypesDataset,
  type EmploymentActivityGenderDataset,
  type WageLevelsDataset,
  type TourismCountryDataset,
  type TourismRegionDataset,
  type EducationBachelorFirstTimeDataset,
} from "@workspace/data";
import { DatasetRenderer } from "@workspace/ui/custom-components/dataset-renderer";

import { FuelBalanceChart } from "./charts/fuel-balance-chart";
import { TradeChapterStackedChart } from "./charts/trade-chapter-stacked-chart";
import { TradePartnersStackedChart } from "./charts/trade-partners-stacked-chart";
import { EmploymentActivityChart } from "./charts/employment-activity-chart";
import { WageLevelsChart } from "./charts/wage-levels-chart";
import { TourismCountryStackedChart } from "./charts/tourism-country-stacked-chart";
import { TourismRegionCharts } from "./charts/tourism-region-stacked-chart";
import { VehicleTypesStackedChart } from "./charts/vehicle-types-stacked-chart";
import { EducationBachelorFirstTimeChart } from "./charts/education-bachelor-first-time-chart";

type DataInsightsProps = {
  initialTradeChapters?: TradeChaptersDataset;
  initialTradePartners?: TradePartnersDataset;
  initialEmploymentActivityGender?: EmploymentActivityGenderDataset;
  initialWageLevels?: WageLevelsDataset;
  initialFuelDataset?: FuelDataset;
  initialVehicleTypesYearly?: VehicleTypesDataset;
  initialTourismCountry?: TourismCountryDataset;
  initialTourismRegion?: TourismRegionDataset;
  initialEducationBachelorFirstTime?: EducationBachelorFirstTimeDataset;
};

export function DataInsightsDashboard({
  initialTradeChapters,
  initialTradePartners,
  initialEmploymentActivityGender,
  initialWageLevels,
  initialFuelDataset,
  initialVehicleTypesYearly,
  initialTourismCountry,
  initialTourismRegion,
  initialEducationBachelorFirstTime,
}: DataInsightsProps) {
  return (
    <div className="space-y-8">
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">
          Tregtia & Dogana
        </h2>
        <DatasetRenderer
          datasetLoader={() => loadDataset("kas.trade-chapters")}
          queryKey={["trade", "chapters", "monthly"]}
          initialData={initialTradeChapters}
          title="Kapitujt kryesorë të tregtisë (shtresuar)"
          id="trade-chapters"
          description="Të dhëna mujore për eksportet (FOB) dhe importet (CIF) sipas kapitujve të nomenklaturës doganore. Ndrysho fluksin, përzgjedh periudhën ose filtro kapitujt kryesorë për të parë kontributet në kohë."
        >
          {(dataset) => <TradeChapterStackedChart dataset={dataset} />}
        </DatasetRenderer>
        <DatasetRenderer
          datasetLoader={() => loadDataset("kas.trade-partners")}
          queryKey={["trade", "partners"]}
          initialData={initialTradePartners}
          title="Kontributet e partnerëve (shtresuar)"
          id="trade-partners"
          description='Partnerët kryesorë tregtarë gjatë vitit të fundit. Rregullo përzgjedhjen ose aktivizo kategorinë "Të tjerët" për të parë partnerët më të vegjël.'
        >
          {(dataset) => <TradePartnersStackedChart dataset={dataset} top={6} />}
        </DatasetRenderer>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Tregu i punës</h2>
        <DatasetRenderer
          datasetLoader={() => loadDataset("kas.wage-levels")}
          queryKey={["labour", "wage-levels"]}
          initialData={initialWageLevels}
          title="Pagat mesatare sipas sektorit"
          id="wage-levels"
          description="Pagat bruto/neto vjetore për sektorin publik, ndërmarrjet publike dhe sektorin privat. Ndrysho metrikën ose intervalin kohor për të parë dallimet mes grupeve."
        >
          {(dataset) => (
            <WageLevelsChart
              dataset={dataset}
              timelineEvents={{
                enabled: true,
                includeCategories: ["government_change", "public_health"],
              }}
            />
          )}
        </DatasetRenderer>
        <DatasetRenderer
          datasetLoader={() => loadDataset("kas.employment-activity-gender")}
          queryKey={["labour", "employment-activity-gender"]}
          initialData={initialEmploymentActivityGender}
          title="Punësimi sipas aktivitetit dhe gjinisë"
          id="employment-activity"
          description="Punësimi tremujor (persona) sipas aktivitetit ekonomik dhe gjinisë. Filtro gjininë ose ndrysho grupimin për të parë tendencat kryesore."
        >
          {(dataset) => (
            <EmploymentActivityChart
              dataset={dataset}
              timelineEvents={{
                enabled: true,
                includeCategories: ["public_health", "government_change"],
              }}
            />
          )}
        </DatasetRenderer>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">
          Arsimi i lartë
        </h2>
        <DatasetRenderer
          datasetLoader={() => loadDataset("kas.education-bachelor-first-time")}
          queryKey={["education", "bachelor-first-time"]}
          initialData={initialEducationBachelorFirstTime}
          title="Regjistrimet e para në Bachelor (shtresuar)"
          id="education-bachelor-first-time"
          description="Studentët në vitin e parë të programit Bachelor sipas fushës së studimit dhe gjinisë. Ndrysho gjininë ose fushat kryesore për të parë si ka evoluar kërkesa akademike."
        >
          {(dataset) => (
            <EducationBachelorFirstTimeChart dataset={dataset} top={7} />
          )}
        </DatasetRenderer>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Karburantet</h2>
        <DatasetRenderer
          datasetLoader={() => loadDataset("kas.fuel")}
          queryKey={["energy", "fuel", "monthly"]}
          initialData={initialFuelDataset}
          title="Bilanci i furnizimit me karburante"
          id="fuel-balance"
          description="Disponueshmëria mujore e karburanteve sipas llojit. Ndrysho metrikat për të krahasuar prodhimin, flukset tregtare, rezervat ose vëllimet gati për treg."
        >
          {(dataset) => <FuelBalanceChart dataset={dataset} />}
        </DatasetRenderer>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Transporti</h2>
        <DatasetRenderer
          datasetLoader={() => loadDataset("kas.vehicle-types")}
          queryKey={["transport", "vehicle-types", "yearly"]}
          initialData={initialVehicleTypesYearly}
          title="Mjetet motorike sipas llojit"
          id="vehicle-types"
          description="Seri vjetore për mjetet motorike dhe jo motorike të raportuara nga ASK. Grafiku shtresor shfaq të gjitha kategoritë si vetura, autobusë, rimorkio dhe të tjera."
        >
          {(dataset) => <VehicleTypesStackedChart dataset={dataset} />}
        </DatasetRenderer>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Turizmi</h2>
        <DatasetRenderer
          datasetLoader={() => loadDataset("kas.tourism-country")}
          queryKey={["tourism", "country", "visitors"]}
          initialData={initialTourismCountry}
          title="Vendet kryesore të vizitorëve (shtresuar)"
          id="tourism-country"
          description="Vendet e origjinës kryesuese të radhitura sipas vizitorëve ose netëve të qëndrimit gjatë vitit të fundit."
        >
          {(dataset) => (
            <TourismCountryStackedChart
              dataset={dataset}
              top={5}
              timelineEvents={{
                enabled: true,
                includeCategories: ["travel", "public_health"],
              }}
            />
          )}
        </DatasetRenderer>
        <DatasetRenderer
          datasetLoader={() => loadDataset("kas.tourism-region")}
          queryKey={["tourism", "region"]}
          initialData={initialTourismRegion}
          title="Turizmi sipas rajonit"
          id="tourism-region"
          description="Vizualizime të shumëfishta për rajonet e Kosovës me filtra sipas grupeve të vizitorëve."
        >
          {(dataset) => (
            <TourismRegionCharts
              dataset={dataset}
              timelineEvents={{
                enabled: true,
                includeCategories: ["travel", "public_health"],
              }}
            />
          )}
        </DatasetRenderer>
      </section>
    </div>
  );
}
