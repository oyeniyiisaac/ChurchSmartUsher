const ORDINAL_WORDS = ["First", "Second", "Third", "Fourth", "Fifth"] as const;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/**
 * Given a date string (YYYY-MM-DD or parseable date) and serviceType,
 * computes the church service calendar tag such as:
 * "First Sunday of November 2026" or "Second Sunday of November 2026".
 */
export function computeServiceCalendarTag(
  dateStr: string,
  serviceType: "SUNDAY" | "MIDWEEK" | "SPECIAL" | string = "SUNDAY",
): string {
  const trimmed = (dateStr || "").trim();
  let parsedDate: Date;

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const monthIndex = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    parsedDate = new Date(Date.UTC(year, monthIndex, day, 12, 0, 0));
  } else {
    const fallback = new Date(trimmed);
    parsedDate = Number.isNaN(fallback.getTime()) ? new Date() : fallback;
  }

  const dayOfMonth = parsedDate.getUTCDate();
  const monthName = MONTH_NAMES[parsedDate.getUTCMonth()] ?? "November";
  const year = parsedDate.getUTCFullYear();
  const weekdayName = WEEKDAY_NAMES[parsedDate.getUTCDay()] ?? "Sunday";
  const occurrenceIndex = Math.min(4, Math.floor((dayOfMonth - 1) / 7));
  const ordinalWord = ORDINAL_WORDS[occurrenceIndex] ?? "First";

  if (serviceType === "SUNDAY" || weekdayName === "Sunday") {
    return `${ordinalWord} Sunday of ${monthName} ${year}`;
  }

  if (serviceType === "MIDWEEK") {
    return `${ordinalWord} ${weekdayName} of ${monthName} ${year} · Midweek Service`;
  }

  return `${ordinalWord} ${weekdayName} of ${monthName} ${year} · Special Service`;
}

export function buildTaggedServiceName(
  serviceTag: string,
  sermonTopic?: string | null,
  customName?: string | null,
): string {
  const cleanTag = serviceTag.trim();
  const cleanTopic = (sermonTopic ?? "").trim();
  const cleanCustom = (customName ?? "").trim();

  if (cleanTopic && cleanTag) {
    return `${cleanTag} — ${cleanTopic}`;
  }
  if (cleanCustom) {
    return cleanCustom;
  }
  return cleanTag || "Sunday Worship Service";
}
