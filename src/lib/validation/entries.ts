import { z } from "zod";
import { CATEGORIES } from "@/lib/categories";
import { isMonthKey, parseDateInput } from "@/lib/dates";
import { parseAmountToCents } from "@/lib/money";

/** Error messages are i18n keys under `validation.*`, like the auth schemas. */

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, { error: "common.genericError" });

/** Form text like "12.50" in, integer cents out. */
const amountCents = z.string({ error: "validation.amountInvalid" }).transform((value, ctx) => {
  const cents = parseAmountToCents(value);
  if (cents === null || cents <= 0) {
    ctx.addIssue({ code: "custom", message: "validation.amountInvalid" });
    return z.NEVER;
  }
  return cents;
});

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

export const expenseSchema = z.object({
  title: label("validation.titleRequired", "validation.titleTooLong"),
  category,
  amount: amountCents,
  date: calendarDate,
  notes,
});

export const incomeSchema = z.object({
  source: label("validation.sourceRequired", "validation.titleTooLong"),
  amount: amountCents,
  date: calendarDate,
  notes,
});

export const monthKey = z.string().refine(isMonthKey, { error: "common.genericError" });

export const budgetSchema = z.object({
  month: monthKey,
  category,
  limit: amountCents,
});

export const shoppingItemSchema = z.object({
  name: label("validation.itemRequired", "validation.titleTooLong"),
});

/** Reads optional text fields so a missing field and an empty one look the same. */
export function formText(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}
