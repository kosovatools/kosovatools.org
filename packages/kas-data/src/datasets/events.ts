import eventsData from "../../data/events.json" with { type: "json" };
import { type TimelineEvent } from "@workspace/utils";

export const timelineEvents = eventsData as TimelineEvent[];
