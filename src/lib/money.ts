export const CURRENCIES = ["USD", "EUR", "GBP", "INR", "CNY", "MXN", "CAD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export function isCurrency(value: unknown): value is Currency {
  return typeof value === "string" && (CURRENCIES as readonly string[]).includes(value);
}

/** Largest amount we accept for one entry: 10 million in major units. */
export const MAX_CENTS = 1_000_000_000;

const AMOUNT_RE = /^(\d+)(?:\.(\d{1,2}))?$/;

/**
 * Parses user input such as "12", "12.5", "1,234.56" into integer cents.
 * Returns null for anything that is not a non-negative amount with at most
 * two decimals. String-based so 0.1 + 0.2 style float errors never happen.
 */
export function parseAmountToCents(input: string | number): number | null {
  const raw = typeof input === "number" ? input.toString() : input;
  const cleaned = raw.trim().replace(/[,\s_]/g, "");
  const match = AMOUNT_RE.exec(cleaned);
  if (!match) return null;
  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? "").padEnd(2, "0"));
  const cents = whole * 100 + fraction;
  if (!Number.isSafeInteger(cents) || cents > MAX_CENTS) return null;
  return cents;
}

/** Cents to a plain input value: 1250 -> "12.50". */
export function centsToInput(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
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
