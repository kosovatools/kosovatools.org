import { createDateFormatter } from "@workspace/utils";

export const formatMonthLabel = createDateFormatter(
  "sq-AL",
  { month: "long", year: "numeric" },
  { fallback: "E panjohur" },
);

export const formatTimestamp = createDateFormatter(
  "sq-AL",
  {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  },
  { fallback: "E panjohur" },
);

export const formatDayLabel = createDateFormatter(
  "sq-AL",
  { day: "2-digit", month: "short" },
  { fallback: "" },
);
