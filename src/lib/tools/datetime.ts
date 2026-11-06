/**
 * Date and Time Utilities Tool
 * Provides precise current real-world timestamp, UTC, local, day of week,
 * and date math.
 */

export interface DateTimeInfo {
  iso: string;
  utcDate: string;
  utcTime: string;
  dayOfWeek: string;
  epochMs: number;
  timeZone: string;
  formattedLocal: string;
}

export function getCurrentDateTime(timeZone: string = "UTC"): DateTimeInfo {
  const now = new Date();

  return {
    iso: now.toISOString(),
    utcDate: now.toISOString().split("T")[0],
    utcTime: now.toISOString().split("T")[1].replace("Z", ""),
    dayOfWeek: now.toLocaleDateString("en-US", { weekday: "long", timeZone }),
    epochMs: now.getTime(),
    timeZone,
    formattedLocal: now.toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "long",
      timeZone: timeZone === "local" ? undefined : timeZone,
    }),
  };
}

export function calculateDateDifference(dateA: string, dateB: string): { days: number; hours: number } {
  const dA = new Date(dateA).getTime();
  const dB = new Date(dateB).getTime();
  const diffMs = Math.abs(dB - dA);

  return {
    days: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
    hours: Math.floor(diffMs / (1000 * 60 * 60)),
  };
}
