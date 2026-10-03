// The respondent side's date format, with no database import so client parts can use it
// (stories/E6-1; src/lib/sharing.ts re-exports it): "6 Oct 2026, 09:00 UTC". The zone is
// named, since the respondent side does not know the reader's (E7-7 may localise).
const UTC = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
export function formatUtc(date: Date): string {
  return `${UTC.format(date)} UTC`;
}
