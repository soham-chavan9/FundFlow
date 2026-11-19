"use server";

import { ObjectId } from "mongodb";
import { refresh } from "next/cache";
import { getLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth/dal";
import { collections } from "@/lib/db";
import { decimalSeparator } from "@/lib/money";
import { fieldErrors } from "@/lib/validation/auth";
import { formText, incomeSchema, objectId } from "@/lib/validation/entries";
import type { EntryFormState } from "@/lib/entry-types";

/** Creates or updates an income entry (an `id` field means update). */
export async function saveIncomeAction(
  _prev: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  const user = await requireUser();
  const parsed = incomeSchema(decimalSeparator(await getLocale())).safeParse({
    source: formData.get("source"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    notes: formText(formData, "notes"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const userId = new ObjectId(user.id);
  const { incomes } = await collections();
  const { source, amount, date, notes } = parsed.data;
  const now = new Date();
  const fields = { source, amountCents: amount, date, updatedAt: now };

  const rawId = formText(formData, "id");
  if (rawId) {
    const id = objectId.safeParse(rawId);
    if (!id.success) return { formError: "entries.notFound" };
    const result = await incomes.updateOne(
      { _id: new ObjectId(id.data), userId },
      notes ? { $set: { ...fields, notes } } : { $set: fields, $unset: { notes: "" } },
    );
    if (result.matchedCount === 0) return { formError: "entries.notFound" };
  } else {
    await incomes.insertOne({
      _id: new ObjectId(),
      userId,
      ...fields,
      ...(notes ? { notes } : {}),
      createdAt: now,
    });
  }

  refresh();
  return { ok: true };
}

export async function deleteIncomeAction(id: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const parsed = objectId.safeParse(id);
  if (!parsed.success) return { ok: false };
  const { incomes } = await collections();
  const { deletedCount } = await incomes.deleteOne({
    _id: new ObjectId(parsed.data),
    userId: new ObjectId(user.id),
  });
  refresh();
  return { ok: deletedCount === 1 };
}
