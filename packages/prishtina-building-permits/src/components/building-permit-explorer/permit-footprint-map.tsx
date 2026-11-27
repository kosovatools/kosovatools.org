import * as React from "react";
import type { FeatureGroup, Map } from "leaflet";
import { formatCount, formatDecimal } from "@workspace/utils";
import type { BuildingPermitsYearDataset } from "@kosovatools/data";
import "leaflet/dist/leaflet.css";

type PermitRecord = BuildingPermitsYearDataset["records"][number];
type Footprint = NonNullable<PermitRecord["footprints"]>[number];

type PermitFootprintMapProps = {
  records: PermitRecord[];
};

export function PermitFootprintMap({ records }: PermitFootprintMapProps) {
  const mappedRecords = records.filter((record) => record.footprints?.length);
  const footprintCount = mappedRecords.reduce(
    (count, record) => count + (record.footprints?.length ?? 0),
    0,
  );

  if (!records.length) return null;
  if (!mappedRecords.length) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Për lejet e zgjedhura ende nuk ka konture të hartëzuara.
      </p>
    );
  }
  return (
    <section className="space-y-3" aria-label="Harta e gjurmëve të ndërtimit">
      <h3 className="font-semibold">Gjurmët e përdhesës së planifikuar</h3>
      <p className="text-sm text-muted-foreground" role="status">
        Leje të hartëzuara: {formatCount(mappedRecords.length)} nga{" "}
        {formatCount(records.length)} · {formatCount(footprintCount)} gjurmë
      </p>

      <p className="text-sm text-muted-foreground">
        Konturet tregojnë përdhesën sipas projektit të miratuar. Hap lejen në
        listë për koordinatat dhe faqen e dokumentit.
      </p>
      <FootprintMap records={records} />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-3 w-4 rounded-sm border-2 border-[#1d4ed8] bg-[#3b82f6]/40"
          />
          Gjurmë e përdhesës së planifikuar
        </span>
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-3 rounded-full border-2 border-white bg-[#1d4ed8]"
          />
          Në pamje të gjerë, kliko rrethin për ta zmadhuar konturin
        </span>
      </div>
    </section>
  );
}

function FootprintMap({ records }: PermitFootprintMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<Map | null>(null);
  const [mapStatus, setMapStatus] = React.useState<
    "loading" | "ready" | "error"
  >("loading");
  const [tileError, setTileError] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    let layers: FeatureGroup | undefined;
    let locators: FeatureGroup | undefined;
    let syncLocators: (() => void) | undefined;

    void import("leaflet")
      .then((L) => {
        if (!active || !containerRef.current) return;

        if (!mapRef.current) {
          const map = L.map(containerRef.current, { scrollWheelZoom: false });
          mapRef.current = map;
          L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
          })
            .on("tileerror", () => setTileError(true))
            .addTo(map);
        }

        const map = mapRef.current;
        layers = L.featureGroup();
        locators = L.featureGroup();
        for (const record of records) {
          for (const footprint of record.footprints ?? []) {
            const outline = L.geoJSON(footprint.geometry, {
              style: {
                color: "#1d4ed8",
                fillColor: "#3b82f6",
                weight: 2,
                fillOpacity: 0.4,
              },
            })
              .bindPopup(createPopup(record, footprint))
              .addTo(layers);
            const bounds = outline.getBounds();
            L.circleMarker(bounds.getCenter(), {
              radius: 5,
              color: "#ffffff",
              weight: 2,
              fillColor: "#1d4ed8",
              fillOpacity: 1,
            })
              .on("click", () => {
                map.fitBounds(bounds, {
                  padding: [24, 24],
                  maxZoom: 19,
                  animate: false,
                });
                outline.openPopup();
              })
              .addTo(locators);
          }
        }
        layers.addTo(map);
        map.fitBounds(layers.getBounds(), {
          padding: [24, 24],
          maxZoom: 19,
          animate: false,
        });
        const locatorGroup = locators;
        syncLocators = () => {
          if (map.getZoom() < 18) locatorGroup.addTo(map);
          else locatorGroup.remove();
        };
        syncLocators();
        map.on("zoomend", syncLocators);
        setMapStatus("ready");
      })
      .catch(() => {
        if (active) setMapStatus("error");
      });

    return () => {
      active = false;
      if (syncLocators) mapRef.current?.off("zoomend", syncLocators);
      locators?.remove();
      layers?.remove();
    };
  }, [records]);

  React.useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        role="region"
        aria-label="Hartë interaktive e gjurmëve të dokumentuara"
        aria-busy={mapStatus === "loading"}
        className="isolate z-0 h-96 w-full rounded-lg border border-border bg-muted"
      />
      {mapStatus === "loading" && (
        <p role="status" className="text-sm text-muted-foreground">
          Harta po ngarkohet…
        </p>
      )}
      {mapStatus === "error" && (
        <p role="status" className="text-sm text-muted-foreground">
          Harta nuk u ngarkua. Të dhënat dhe burimet gjenden në listën e lejeve.
        </p>
      )}
      {mapStatus === "ready" && tileError && (
        <p role="status" className="text-sm text-muted-foreground">
          Sfondi i hartës nuk u ngarkua plotësisht.
        </p>
      )}
    </div>
  );
}

function createPopup(record: PermitRecord, footprint: Footprint): HTMLElement {
  const content = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = `Leja #${record.permit_number}`;
  const area = document.createElement("p");
  area.textContent = `Sipërfaqja e llogaritur nga konturi: ${formatDecimal(footprint.area_m2)} m²`;
  content.append(title, area);
  if (URL.canParse(footprint.source_url)) {
    const url = new URL(footprint.source_url);
    if (url.protocol === "https:" || url.protocol === "http:") {
      const source = document.createElement("a");
      source.href = url.href;
      source.target = "_blank";
      source.rel = "noreferrer";
      source.textContent = `Burimi (faqja ${footprint.page})`;
      content.append(source);
    }
  }
  return content;
}
