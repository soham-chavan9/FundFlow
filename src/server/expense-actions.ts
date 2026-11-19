"use server";

import { ObjectId } from "mongodb";
import { refresh } from "next/cache";
import { getLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth/dal";
import { collections } from "@/lib/db";
import { decimalSeparator } from "@/lib/money";
import { monthRange, toMonthKey } from "@/lib/dates";
import { overspendAfterChange } from "@/lib/finance";
import { fieldErrors } from "@/lib/validation/auth";
import { expenseSchema, formText, objectId } from "@/lib/validation/entries";
import type { ExpenseDoc } from "@/lib/types";
import type { EntryFormState, Overspend } from "@/lib/entry-types";
import type { Category } from "@/lib/categories";

/**
 * Creates or updates an expense (an `id` field means update). Returns an
 * overspend notice when the save leaves that category over its budget for
 * the expense's month.
 */
export async function saveExpenseAction(
  _prev: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  const user = await requireUser();
  const parsed = expenseSchema(decimalSeparator(await getLocale())).safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    notes: formText(formData, "notes"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const userId = new ObjectId(user.id);
  const { expenses } = await collections();
  const { title, category, amount, date, notes } = parsed.data;
  const now = new Date();
  const fields = { title, category, amountCents: amount, date, updatedAt: now };

  let previous: ExpenseDoc | null = null;
  const rawId = formText(formData, "id");
  if (rawId) {
    const id = objectId.safeParse(rawId);
    if (!id.success) return { formError: "entries.notFound" };
    previous = await expenses.findOneAndUpdate(
      { _id: new ObjectId(id.data), userId },
      notes ? { $set: { ...fields, notes } } : { $set: fields, $unset: { notes: "" } },
      { returnDocument: "before" },
    );
    if (!previous) return { formError: "entries.notFound" };
  } else {
    await expenses.insertOne({
      _id: new ObjectId(),
      userId,
      ...fields,
      ...(notes ? { notes } : {}),
      createdAt: now,
    });
  }

  const overspend = await checkOverspend(userId, category, date, amount, previous);
  refresh();
  return { ok: true, overspend };
}

async function checkOverspend(
  userId: ObjectId,
  category: Category,
  date: Date,
  amountCents: number,
  previous: ExpenseDoc | null,
): Promise<Overspend | undefined> {
  const { expenses, budgets } = await collections();
  const month = toMonthKey(date);
  const budget = await budgets.findOne({ userId, month, category });
  if (!budget) return undefined;

  const { start, end } = monthRange(month);
  const [agg] = await expenses
    .aggregate<{ total: number }>([
      { $match: { userId, category, date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: "$amountCents" } } },
    ])
    .toArray();
  const total = agg?.total ?? 0;
  // What this category's total was before the save.
  const previousInSameBucket =
    previous && previous.category === category && toMonthKey(previous.date) === month
      ? previous.amountCents
      : 0;
  const before = total - amountCents + previousInSameBucket;

  const over = overspendAfterChange(before, total, budget.limitCents);
  return over === null
    ? undefined
    : { category, overByCents: over, limitCents: budget.limitCents, month };
}

export async function deleteExpenseAction(id: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const parsed = objectId.safeParse(id);
  if (!parsed.success) return { ok: false };
  const { expenses } = await collections();
  const { deletedCount } = await expenses.deleteOne({
    _id: new ObjectId(parsed.data),
    userId: new ObjectId(user.id),
  });
  refresh();
  return { ok: deletedCount === 1 };
}
