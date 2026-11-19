export const CURRENCIES = ["USD", "EUR", "GBP", "INR", "CNY", "MXN", "CAD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export function isCurrency(value: unknown): value is Currency {
  return typeof value === "string" && (CURRENCIES as readonly string[]).includes(value);
}

/** Largest amount we accept for one entry: 10 million in major units. */
export const MAX_CENTS = 1_000_000_000;

export type DecimalSeparator = "." | ",";

/** The decimal separator people type in this locale: "." for en and zh, "," for es. */
export function decimalSeparator(locale: string): DecimalSeparator {
  const part = new Intl.NumberFormat(locale).formatToParts(1.5).find((p) => p.type === "decimal");
  return part?.value === "," ? "," : ".";
}

const WHOLE_RE = /^(?:\d+|\d{1,3}(?:[.,]\d{3})+)$/;

/**
 * Parses user input into integer cents. Accepts "1,234.56" and "1.234,56":
 * the last separator is the decimal point when one or two digits follow it,
 * and other dots or commas group thousands, so "12,50" is 12.50 and
 * "1,234.50" is 1234.50.
 *
 * A single separator followed by three digits is ambiguous ("1.234" is 1234 in
 * Spanish but 1.234 in English). It counts as grouping only when it is not the
 * locale's decimal separator; otherwise it is rejected rather than guessed, so
 * a typo never turns 12.345 into twelve thousand.
 *
 * Returns null for anything that is not a non-negative amount with at most
 * two decimals. String-based, so 0.1 + 0.2 style float errors never happen.
 */
export function parseAmountToCents(
  input: string | number,
  decimal: DecimalSeparator = ".",
): number | null {
  const raw = typeof input === "number" ? input.toString() : input;
  const cleaned = raw.trim().replace(/[\s_\u00a0\u202f']/g, "");
  const fractionMatch = /[.,](\d{1,2})$/.exec(cleaned);
  const wholePart = fractionMatch ? cleaned.slice(0, fractionMatch.index) : cleaned;
  if (!WHOLE_RE.test(wholePart)) return null;
  if (!fractionMatch && /^\d{1,3}[.,]\d{3}$/.test(wholePart) && wholePart.includes(decimal)) {
    return null;
  }
  const whole = Number(wholePart.replace(/[.,]/g, ""));
  const fraction = Number((fractionMatch?.[1] ?? "").padEnd(2, "0"));
  const cents = whole * 100 + fraction;
  if (!Number.isSafeInteger(cents) || cents > MAX_CENTS) return null;
  return cents;
}

/** Cents to a plain input value: 1250 -> "12.50" (or "12,50"). */
export function centsToInput(cents: number, decimal: DecimalSeparator = "."): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}${decimal}${String(abs % 100).padStart(2, "0")}`;
}

export function formatMoney(
  cents: number,
  currency: Currency,
  locale: string,
  options: { compact?: boolean; signDisplay?: Intl.NumberFormatOptions["signDisplay"] } = {},
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: options.compact ? "compact" : "standard",
    maximumFractionDigits: options.compact ? 1 : 2,
    signDisplay: options.signDisplay,
  }).format(cents / 100);
}
