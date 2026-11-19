/**
 * Calendar helpers. Entry dates are calendar days (no time of day), stored at
 * UTC midnight, and months are `YYYY-MM` keys. Everything is UTC so a date
 * never shifts when the server and the user are in different time zones.
 */

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isMonthKey(value: unknown): value is string {
  return typeof value === "string" && MONTH_RE.test(value);
}

export function toMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Start (inclusive) and end (exclusive) of a month. */
export function monthRange(key: string): { start: Date; end: Date } {
  const m = MONTH_RE.exec(key);
  if (!m) throw new Error(`Invalid month key: ${key}`);
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  return {
    start: new Date(Date.UTC(year, month, 1)),
    end: new Date(Date.UTC(year, month + 1, 1)),
  };
}

export function shiftMonth(key: string, delta: number): string {
  const { start } = monthRange(key);
  return toMonthKey(new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + delta, 1)));
}

/** The `count` months ending at `key`, oldest first. */
export function lastMonths(key: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => shiftMonth(key, i - (count - 1)));
}

/** Parses an `<input type="date">` value. Rejects impossible dates like 2026-02-30. */
export function parseDateInput(value: string): Date | null {
  const m = DATE_RE.exec(value.trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return date;
}

export function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Number of days in the month and how many have elapsed as of `now` (UTC). */
export function monthProgress(key: string, now: Date): { days: number; elapsed: number } {
  const { start, end } = monthRange(key);
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  if (now < start) return { days, elapsed: 0 };
  if (now >= end) return { days, elapsed: days };
  return { days, elapsed: now.getUTCDate() };
}
