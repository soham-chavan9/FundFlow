import { isMonthKey, toMonthKey } from "./dates";

/** Resolves a `?month=YYYY-MM` search param, defaulting to the current UTC month. */
export function resolveMonth(value: string | string[] | undefined, now = new Date()): string {
  const v = Array.isArray(value) ? value[0] : value;
  return isMonthKey(v) ? v : toMonthKey(now);
}
