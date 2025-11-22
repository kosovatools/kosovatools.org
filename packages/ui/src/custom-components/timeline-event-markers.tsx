"use client";

import * as React from "react";
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
  yAxisId?: string;
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
  yAxisId,
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

  return markers.map((event, i) => (
    <ReferenceLine
      key={event.id}
      yAxisId={yAxisId}
      x={event.x}
      strokeDasharray="3 3"
      ifOverflow="extendDomain"
    >
      <Label
        value={event.label}
        position={"left"}
        textAnchor="middle"
        fill="var(--muted-foreground)"
        className="text-xs"
        angle={-90}
      />
    </ReferenceLine>
  ));
}

export type { TimelineEventCategory };
