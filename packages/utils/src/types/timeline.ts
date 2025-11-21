export type TimelineEventCategory =
  | "government_change"
  | "public_health"
  | "security"
  | "travel"
  | "other";

export type TimelineEvent = {
  id: string;
  title: string;
  period: string;
  category: TimelineEventCategory[];
  summary: string;
  date?: string;
};
