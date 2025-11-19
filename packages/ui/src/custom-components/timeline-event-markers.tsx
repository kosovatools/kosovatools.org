"use client";

import { Label, ReferenceLine } from "recharts";

import {
  useTimelineEventMarkers,
  type TimelineEventCategory,
  type UseTimelineEventMarkersOptions,
} from "@workspace/timeline-events";
import type { PeriodGrouping } from "@workspace/utils";

type ChartDatum = { period: string };

export type TimelineEventMarkerControls = {
  enabled?: boolean;
  includeCategories?: UseTimelineEventMarkersOptions["includeCategories"];
};

export type TimelineEventsProps = {
  timelineEventsEnabled?: boolean;
  timelineEventCategories?: ReadonlyArray<TimelineEventCategory>;
};

export function TimelineEventMarkers({
  data,
  grouping,
  enabled = true,
  includeCategories,
}: {
  data: ChartDatum[];
  grouping: PeriodGrouping;
} & TimelineEventMarkerControls) {
  const markers = useTimelineEventMarkers(
    data,
    grouping,
    includeCategories
      ? ({ includeCategories } satisfies UseTimelineEventMarkersOptions)
      : undefined,
  );

  if (!enabled || !markers.length) {
    return null;
  }

  return markers.map((event) => (
    <ReferenceLine
      key={event.id}
      x={event.x}
      stroke="var(--muted-foreground)"
      strokeDasharray="3 3"
      ifOverflow="extendDomain"
    >
      <Label
        value={event.label}
        position="top"
        fill="var(--muted-foreground)"
        fontSize={10}
        offset={event.offset}
      />
    </ReferenceLine>
  ));
}

export type { TimelineEventCategory };
