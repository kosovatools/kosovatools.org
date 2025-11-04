import eventsData from "../../data/events.json" with { type: "json" };
import { type TimelineEvent } from "@workspace/chart-utils";

const isTimelineEvent = (value: unknown): value is TimelineEvent => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.period === "string" &&
    typeof candidate.category === "string"
  );
};

export const timelineEvents: TimelineEvent[] = Array.isArray(eventsData)
  ? (eventsData as unknown[]).filter(isTimelineEvent)
  : [];
