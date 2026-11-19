import { z } from "zod";
import { CATEGORIES } from "@/lib/categories";
import { isMonthKey, parseDateInput } from "@/lib/dates";
import { parseAmountToCents, type DecimalSeparator } from "@/lib/money";

/** Error messages are i18n keys under `validation.*`, like the auth schemas. */

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, { error: "common.genericError" });

/** Form text like "12.50" (or "12,50") in, integer cents out. */
function amountCents(decimal: DecimalSeparator) {
  return z.string({ error: "validation.amountInvalid" }).transform((value, ctx) => {
    const cents = parseAmountToCents(value, decimal);
    if (cents === null || cents <= 0) {
      ctx.addIssue({ code: "custom", message: "validation.amountInvalid" });
      return z.NEVER;
    }
    return cents;
  });
}

const calendarDate = z.string({ error: "validation.dateInvalid" }).transform((value, ctx) => {
  const date = parseDateInput(value);
  if (!date) {
    ctx.addIssue({ code: "custom", message: "validation.dateInvalid" });
    return z.NEVER;
  }
  return date;
});

const notes = z
  .string()
  .trim()
  .max(500, { error: "validation.notesTooLong" })
  .optional()
  .transform((v) => (v ? v : undefined));

function label(requiredKey: string, tooLongKey: string) {
  return z
    .string({ error: requiredKey })
    .trim()
    .min(1, { error: requiredKey })
    .max(80, { error: tooLongKey });
}

export const category = z.enum(CATEGORIES, { error: "validation.categoryRequired" });

/**
 * Amount schemas depend on the locale's decimal separator, so these are built
 * per request: `expenseSchema(decimalSeparator(locale))`.
 */
export function expenseSchema(decimal: DecimalSeparator = ".") {
  return z.object({
    title: label("validation.titleRequired", "validation.titleTooLong"),
    category,
    amount: amountCents(decimal),
    date: calendarDate,
    notes,
  });
}

export function incomeSchema(decimal: DecimalSeparator = ".") {
  return z.object({
    source: label("validation.sourceRequired", "validation.titleTooLong"),
    amount: amountCents(decimal),
    date: calendarDate,
    notes,
  });
}

export const monthKey = z.string().refine(isMonthKey, { error: "common.genericError" });

export function budgetSchema(decimal: DecimalSeparator = ".") {
  return z.object({
    month: monthKey,
    category,
    limit: amountCents(decimal),
  });
}

export const shoppingItemSchema = z.object({
  name: label("validation.itemRequired", "validation.titleTooLong"),
});

/** Reads optional text fields so a missing field and an empty one look the same. */
export function formText(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}
