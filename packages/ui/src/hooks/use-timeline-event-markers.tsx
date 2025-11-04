import * as React from "react";

import {
  timelineEvents,
  groupStackPeriod,
  getStackPeriodFormatter,
  type StackPeriodGrouping,
} from "@workspace/stats";

type ChartDatum = {
  period: string;
  periodLabel: string;
};

export type ChartEventMarker = {
  id: string;
  x: string;
  label: string;
  description?: string;
  details?: string;
};

export function useTimelineEventMarkers(
  data: ChartDatum[],
  grouping: StackPeriodGrouping,
): ChartEventMarker[] {
  return React.useMemo(() => {
    if (!data.length) {
      return [];
    }

    const periodFormatter = getStackPeriodFormatter(grouping);
    const periodSet = new Set(data.map((row) => row.period));
    const markers = new Map<
      string,
      {
        id: string;
        x: string;
        titles: string[];
        descriptions: string[];
      }
    >();

    for (const event of timelineEvents) {
      const groupedPeriod = groupStackPeriod(event.period, grouping);
      if (!periodSet.has(groupedPeriod)) {
        continue;
      }
      const x = periodFormatter(groupedPeriod);
      const existing = markers.get(groupedPeriod);
      if (existing) {
        existing.titles.push(event.title);
        if (event.summary) {
          existing.descriptions.push(event.summary);
        }
        continue;
      }

      markers.set(groupedPeriod, {
        id: groupedPeriod,
        x,
        titles: [event.title],
        descriptions: event.summary ? [event.summary] : [],
      });
    }

    return Array.from(markers.values()).map((entry) => ({
      id: entry.id,
      x: entry.x,
      label: entry.titles[0] ?? entry.id,
      description:
        entry.descriptions.length === 1
          ? entry.descriptions[0]
          : entry.descriptions.join(" • "),
      details:
        entry.titles.length > 1 ? entry.titles.slice(1).join(" • ") : undefined,
    }));
  }, [data, grouping]);
}
