import eventsData from "../../data/events.json" with { type: "json" };
import { type TimelineEvent } from "@workspace/utils";

const isTimelineEvent = (value: unknown): value is TimelineEvent => {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    typeof c.title === "string" &&
    typeof c.period === "string" &&
    typeof c.category === "string"
  );
};

export const timelineEvents: TimelineEvent[] = Array.isArray(eventsData)
  ? (eventsData as unknown[]).filter(isTimelineEvent)
  : [];
