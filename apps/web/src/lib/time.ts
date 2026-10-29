// Display/range helpers. Candidates to move into packages/shared (Architect owns it).

/** UTC [from, to) bounds of "today" in the given IANA timezone. Assumes no DST shift within the day. */
export function zonedDayRange(tz: string, now = new Date()): { from: string; to: string } {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(now);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(now);
  const g = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const wallAsUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second"));
  const offset = wallAsUtc - Math.floor(now.getTime() / 1000) * 1000;
  const start = Date.parse(`${ymd}T00:00:00Z`) - offset;
  return { from: new Date(start).toISOString(), to: new Date(start + 86_400_000).toISOString() };
}

export function minutesOfDay(iso: string, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(new Date(iso));
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return n("hour") * 60 + n("minute");
}

export function formatTime(iso: string, tz: string, locale = "ru-RU"): string {
  return new Intl.DateTimeFormat(locale, { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return h && m ? `${h} ч ${m} мин` : h ? `${h} ч` : `${m} мин`;
}

/** Offset (wall clock minus UTC) of `tz` at the given instant, in ms. */
function tzOffsetMs(instantMs: number, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(instantMs));
  const g = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const wallAsUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second"));
  return wallAsUtc - Math.floor(instantMs / 1000) * 1000;
}

/** UTC instant of 23:59 on the calendar day `ymd` (YYYY-MM-DD) in `tz`. Used for date-only due dates. */
export function endOfZonedDay(ymd: string, tz: string): string {
  const wall = Date.parse(`${ymd}T23:59:00Z`);
  // Two passes so a DST change between the guess and the real instant is still handled.
  const first = wall - tzOffsetMs(wall, tz);
  return new Date(wall - tzOffsetMs(first, tz)).toISOString();
}

/** Calendar day (YYYY-MM-DD) of an instant in `tz`. */
export function zonedYmd(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(iso));
}

export function formatDueDate(iso: string, tz: string, locale = "ru-RU"): string {
  return new Intl.DateTimeFormat(locale, { timeZone: tz, day: "numeric", month: "short" }).format(new Date(iso));
}
