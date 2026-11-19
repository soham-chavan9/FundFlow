import { monthRange } from "./dates";

/** Locale-aware display helpers. All dates are calendar days in UTC. */

function sentenceCase(text: string, locale: string): string {
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

/**
 * "November 2026", "noviembre de 2026", "2026年11月". Pass `standalone` for a
 * label on its own (sentence case: "Noviembre de 2026"); leave it off inside a
 * sentence, where Spanish keeps the month lowercase.
 */
export function formatMonth(
  key: string,
  locale: string,
  { standalone = false, short = false }: { standalone?: boolean; short?: boolean } = {},
): string {
  const raw = new Intl.DateTimeFormat(locale, {
    month: short ? "short" : "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(monthRange(key).start);
  // Sentence case by hand: CSS capitalize would hit every word ("Octubre De 2026").
  return standalone ? sentenceCase(raw, locale) : raw;
}

/** "November", without the year. */
export function formatMonthName(key: string, locale: string): string {
  return sentenceCase(
    new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(
      monthRange(key).start,
    ),
    locale,
  );
}

/** "Nov", for chart axes. */
export function formatMonthShort(key: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(
    monthRange(key).start,
  );
}

/** "Nov 19" from `2026-11-19`. */
export function formatDay(isoDate: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

export function formatPercent(
  ratio: number,
  locale: string,
  options: { signDisplay?: Intl.NumberFormatOptions["signDisplay"] } = {},
): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: Math.abs(ratio) < 0.1 && ratio !== 0 ? 1 : 0,
    signDisplay: options.signDisplay,
  }).format(ratio);
}

/** The currency's symbol in this locale, e.g. "$", "€", "MX$". */
export function currencySymbol(currency: string, locale: string): string {
  return (
    new Intl.NumberFormat(locale, { style: "currency", currency })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value ?? currency
  );
}

/**
 * Money for chart axes: whole units in full below 10,000 ("$2,000") and
 * compact from there ("$12K"), so one axis keeps one style.
 */
export function formatAxisMoney(
  cents: number,
  currency: string,
  locale: string,
  axisMaxCents: number,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: axisMaxCents >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
