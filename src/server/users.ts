import "server-only";
import { MongoServerError, ObjectId } from "mongodb";
import { collections } from "@/lib/db";
import type { CurrentUser, UserDoc } from "@/lib/types";
import type { Currency } from "@/lib/money";
import type { Locale } from "@/i18n/locales";

export class EmailTakenError extends Error {
  constructor() {
    super("Email already registered");
  }
}

export function toCurrentUser(
  user: Pick<UserDoc, "_id" | "name" | "email" | "currency" | "locale">,
): CurrentUser {
  return {
    id: user._id.toHexString(),
    name: user.name,
    email: user.email,
    currency: user.currency,
    locale: user.locale,
  };
}

export async function findUserByEmail(email: string) {
  const { users } = await collections();
  return users.findOne({ email: email.trim().toLowerCase() });
}

export async function findUserById(id: string) {
  if (!ObjectId.isValid(id)) return null;
  const { users } = await collections();
  return users.findOne({ _id: new ObjectId(id) }, { projection: { passwordHash: 0 } });
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  locale: Locale;
  currency?: Currency;
}): Promise<string> {
  const { users } = await collections();
  try {
    const { insertedId } = await users.insertOne({
      _id: new ObjectId(),
      name: input.name,
      email: input.email.trim().toLowerCase(),
      passwordHash: input.passwordHash,
      currency: input.currency ?? "USD",
      locale: input.locale,
      createdAt: new Date(),
    });
    return insertedId.toHexString();
  } catch (err) {
    if (err instanceof MongoServerError && err.code === 11000) throw new EmailTakenError();
    throw err;
  }
}
