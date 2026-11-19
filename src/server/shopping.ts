import "server-only";
import { ObjectId } from "mongodb";
import { collections } from "@/lib/db";

export interface ShoppingItem {
  id: string;
  name: string;
  done: boolean;
}

/** The signed-in user's list: items still to buy first (newest first), then bought ones. */
export async function listShoppingItems(userId: string): Promise<ShoppingItem[]> {
  const { shoppingItems } = await collections();
  const docs = await shoppingItems
    .find({ userId: new ObjectId(userId) })
    .sort({ done: 1, createdAt: -1, _id: -1 })
    .limit(500)
    .toArray();
  return docs.map((d) => ({ id: d._id.toHexString(), name: d.name, done: d.done }));
}
