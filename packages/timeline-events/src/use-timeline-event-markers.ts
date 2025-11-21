import * as React from "react";

import timelineEventsJson from "../data/events.json" with { type: "json" };
import {
  PeriodGrouping,
  type TimelineEvent,
  type TimelineEventCategory,
  groupPeriod,
} from "@workspace/utils";

export type { TimelineEventCategory };

const timelineEvents = timelineEventsJson as TimelineEvent[];

type ChartDatum = {
  period: string;
};

export type ChartEventMarker = {
  id: string;
  x: string;
  offset: number;
  label: string;
  description?: string;
  details?: string;
};

export type UseTimelineEventMarkersOptions = {
  includeCategories?: ReadonlyArray<TimelineEventCategory>;
};

export function useTimelineEventMarkers(
  data: ChartDatum[],
  grouping: PeriodGrouping,
  options: UseTimelineEventMarkersOptions = {},
): ChartEventMarker[] {
  const { includeCategories } = options;

  return React.useMemo(() => {
    if (!data.length) {
      return [];
    }

    const includeCategorySet =
      includeCategories && includeCategories.length
        ? new Set(includeCategories)
        : null;
    const visibleEvents = includeCategorySet
      ? timelineEvents.filter((event) =>
          event.category.some((cat) => includeCategorySet.has(cat)),
        )
      : timelineEvents;

    const periodSet = new Set(data.map((row) => row.period));
    const markers = new Map<
      string,
      {
        id: string;
        period: string;
        titles: string[];
        descriptions: string[];
      }
    >();

    for (const event of visibleEvents) {
      const groupedPeriod = groupPeriod(event.period, grouping);
      if (!periodSet.has(groupedPeriod)) {
        continue;
      }
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
        period: groupedPeriod,
        titles: [event.title],
        descriptions: event.summary ? [event.summary] : [],
      });
    }

    return Array.from(markers.values()).map((entry, i) => ({
      id: entry.id,
      x: entry.period,
      offset: -(i % 6) * 12 - 5,
      label: entry.titles[0] ?? entry.id,
      description:
        entry.descriptions.length === 1
          ? entry.descriptions[0]
          : entry.descriptions.join(" • "),
      details:
        entry.titles.length > 1 ? entry.titles.slice(1).join(" • ") : undefined,
    }));
  }, [data, grouping, includeCategories]);
}
