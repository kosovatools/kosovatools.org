import { formatDate, type DateFormatter } from "@workspace/utils";

export const formatTimestamp: DateFormatter = (value) =>
  formatDate(
    value,
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

export const formatDayLabel: DateFormatter = (value) =>
  formatDate(value, { day: "2-digit", month: "short" }, { fallback: "" });
