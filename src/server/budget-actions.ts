"use server";

import { ObjectId } from "mongodb";
import { refresh } from "next/cache";
import { getLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth/dal";
import { collections } from "@/lib/db";
import { shiftMonth } from "@/lib/dates";
import { decimalSeparator } from "@/lib/money";
import { fieldErrors } from "@/lib/validation/auth";
import { budgetSchema, category, monthKey } from "@/lib/validation/entries";

export type BudgetFormState =
  { fieldErrors?: Record<string, string>; formError?: string; ok?: boolean } | undefined;

/** Sets (or replaces) one category's limit for one month. */
export async function setBudgetAction(
  _prev: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const user = await requireUser();
  const parsed = budgetSchema(decimalSeparator(await getLocale())).safeParse({
    month: formData.get("month"),
    category: formData.get("category"),
    limit: formData.get("limit"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const { budgets } = await collections();
  const { month, category, limit } = parsed.data;
  const userId = new ObjectId(user.id);
  await budgets.updateOne(
    { userId, month, category },
    {
      $set: { limitCents: limit, updatedAt: new Date() },
      $setOnInsert: { _id: new ObjectId(), userId, month, category },
    },
    { upsert: true },
  );
  refresh();
  return { ok: true };
}

export async function removeBudgetAction(month: string, cat: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const m = monthKey.safeParse(month);
  const c = category.safeParse(cat);
  if (!m.success || !c.success) return { ok: false };
  const { budgets } = await collections();
  const { deletedCount } = await budgets.deleteOne({
    userId: new ObjectId(user.id),
    month: m.data,
    category: c.data,
  });
  refresh();
  return { ok: deletedCount === 1 };
}

/**
 * Copies last month's limits into `month` for every category that has no
 * limit yet. Returns how many were copied.
 */
export async function copyPreviousBudgetsAction(month: string): Promise<{ copied: number }> {
  const user = await requireUser();
  const m = monthKey.safeParse(month);
  if (!m.success) return { copied: 0 };
  const { budgets } = await collections();
  const userId = new ObjectId(user.id);
  const [previous, existing] = await Promise.all([
    budgets.find({ userId, month: shiftMonth(m.data, -1) }).toArray(),
    budgets.find({ userId, month: m.data }, { projection: { category: 1 } }).toArray(),
  ]);
  const taken = new Set(existing.map((b) => b.category));
  const now = new Date();
  const docs = previous
    .filter((b) => !taken.has(b.category))
    .map((b) => ({
      _id: new ObjectId(),
      userId,
      month: m.data,
      category: b.category,
      limitCents: b.limitCents,
      updatedAt: now,
    }));
  if (docs.length > 0) {
    // ordered: false so a concurrent copy only skips duplicates instead of failing.
    await budgets.insertMany(docs, { ordered: false }).catch((err: unknown) => {
      if ((err as { code?: number }).code !== 11000) throw err;
    });
  }
  refresh();
  return { copied: docs.length };
}
