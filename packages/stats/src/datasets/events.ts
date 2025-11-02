import eventsData from "../../data/events.json" with { type: "json" };

export type TimelineEventCategory =
  | "government_change"
  | "public_health"
  | "security"
  | "other";

export type TimelineEvent = {
  id: string;
  title: string;
  period: string;
  category: TimelineEventCategory;
  summary?: string;
  date?: string;
};

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
