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

    const periodIndexMap = new Map(data.map((d, i) => [d.period, i]));
    const sortedMarkers = Array.from(markers.values()).sort((a, b) => {
      const indexA = periodIndexMap.get(a.period) ?? -1;
      const indexB = periodIndexMap.get(b.period) ?? -1;
      return indexA - indexB;
    });

    const mergedMarkers: typeof sortedMarkers = [];

    for (const marker of sortedMarkers) {
      const lastMarker = mergedMarkers[mergedMarkers.length - 1];
      const currentIndex = periodIndexMap.get(marker.period) ?? -1;
      const lastIndex = lastMarker
        ? (periodIndexMap.get(lastMarker.period) ?? -1)
        : -1;

      if (
        grouping == "monthly" &&
        lastMarker &&
        currentIndex !== -1 &&
        lastIndex !== -1 &&
        currentIndex - lastIndex <= 6 // Merge close months
      ) {
        // Merge with previous marker
        lastMarker.titles.push(...marker.titles);
        lastMarker.descriptions.push(...marker.descriptions);
      } else {
        mergedMarkers.push({ ...marker });
      }
    }

    return mergedMarkers.map((entry) => ({
      id: entry.id,
      x: entry.period,
      label: entry.titles.join(", "),
      description:
        entry.descriptions.length === 1
          ? entry.descriptions[0]
          : entry.descriptions.join(" • "),
      details:
        entry.titles.length > 1 ? entry.titles.slice(1).join(" • ") : undefined,
    }));
  }, [data, grouping, includeCategories]);
}
