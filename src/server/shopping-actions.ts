"use server";

import { ObjectId } from "mongodb";
import { refresh } from "next/cache";
import { requireUser } from "@/lib/auth/dal";
import { collections } from "@/lib/db";
import { fieldErrors } from "@/lib/validation/auth";
import { objectId, shoppingItemSchema } from "@/lib/validation/entries";

/** Keeps one list from growing without bound. */
const MAX_ITEMS = 500;

export type ShoppingFormState = { fieldErrors?: Record<string, string>; ok?: boolean } | undefined;

export async function addShoppingItemAction(
  _prev: ShoppingFormState,
  formData: FormData,
): Promise<ShoppingFormState> {
  const user = await requireUser();
  const parsed = shoppingItemSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const { shoppingItems } = await collections();
  const userId = new ObjectId(user.id);
  if ((await shoppingItems.countDocuments({ userId })) >= MAX_ITEMS) {
    return { fieldErrors: { name: "shopping.full" } };
  }
  await shoppingItems.insertOne({
    _id: new ObjectId(),
    userId,
    name: parsed.data.name,
    done: false,
    createdAt: new Date(),
  });
  refresh();
  return { ok: true };
}

export async function setShoppingItemDoneAction(id: string, done: boolean): Promise<void> {
  const user = await requireUser();
  const parsed = objectId.safeParse(id);
  if (!parsed.success) return;
  const { shoppingItems } = await collections();
  await shoppingItems.updateOne(
    { _id: new ObjectId(parsed.data), userId: new ObjectId(user.id) },
    { $set: { done: done === true } },
  );
  refresh();
}

export async function deleteShoppingItemAction(id: string): Promise<void> {
  const user = await requireUser();
  const parsed = objectId.safeParse(id);
  if (!parsed.success) return;
  const { shoppingItems } = await collections();
  await shoppingItems.deleteOne({ _id: new ObjectId(parsed.data), userId: new ObjectId(user.id) });
  refresh();
}

export async function clearCompletedShoppingAction(): Promise<{ cleared: number }> {
  const user = await requireUser();
  const { shoppingItems } = await collections();
  const { deletedCount } = await shoppingItems.deleteMany({
    userId: new ObjectId(user.id),
    done: true,
  });
  refresh();
  return { cleared: deletedCount };
}
