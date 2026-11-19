"use server";

import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { LOCALE_COOKIE } from "@/i18n/locales";
import { requireUser } from "@/lib/auth/dal";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, deleteSession } from "@/lib/auth/session";
import { collections } from "@/lib/db";
import {
  deleteAccountSchema,
  passwordChangeSchema,
  preferencesSchema,
  profileSchema,
} from "@/lib/validation/account";
import { fieldErrors } from "@/lib/validation/auth";

export type SettingsFormState =
  { fieldErrors?: Record<string, string>; formError?: string; ok?: boolean } | undefined;

export async function updateProfileAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const { users } = await collections();
  await users.updateOne({ _id: new ObjectId(user.id) }, { $set: { name: parsed.data.name } });
  refresh();
  return { ok: true };
}

/** Currency only changes how amounts are labelled; stored amounts are not converted. */
export async function updatePreferencesAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const user = await requireUser();
  const parsed = preferencesSchema.safeParse({
    currency: formData.get("currency"),
    locale: formData.get("locale"),
  });
  if (!parsed.success) return { formError: "common.genericError" };
  const { users } = await collections();
  await users.updateOne({ _id: new ObjectId(user.id) }, { $set: parsed.data });
  (await cookies()).set(LOCALE_COOKIE, parsed.data.locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  refresh();
  return { ok: true };
}

/**
 * Changes the password and bumps the session version, which signs out every
 * other device. This browser gets a fresh session so it stays signed in.
 */
export async function changePasswordAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const user = await requireUser();
  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const { users } = await collections();
  const id = new ObjectId(user.id);
  const account = await users.findOne(
    { _id: id },
    { projection: { passwordHash: 1, sessionVersion: 1 } },
  );
  if (!(await verifyPassword(parsed.data.currentPassword, account?.passwordHash ?? null))) {
    return { fieldErrors: { currentPassword: "settings.wrongPassword" } };
  }
  const updated = await users.findOneAndUpdate(
    { _id: id },
    {
      $set: { passwordHash: await hashPassword(parsed.data.newPassword) },
      $inc: { sessionVersion: 1 },
    },
    { returnDocument: "after", projection: { sessionVersion: 1 } },
  );
  await createSession(user.id, updated?.sessionVersion ?? 0);
  return { ok: true };
}

/** Permanently deletes the account and everything recorded under it, after re-checking the password. */
export async function deleteAccountAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const user = await requireUser();
  const parsed = deleteAccountSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const db = await collections();
  const id = new ObjectId(user.id);
  const account = await db.users.findOne({ _id: id }, { projection: { passwordHash: 1 } });
  if (!(await verifyPassword(parsed.data.password, account?.passwordHash ?? null))) {
    return { fieldErrors: { password: "settings.wrongPassword" } };
  }
  await Promise.all([
    db.expenses.deleteMany({ userId: id }),
    db.incomes.deleteMany({ userId: id }),
    db.budgets.deleteMany({ userId: id }),
    db.shoppingItems.deleteMany({ userId: id }),
  ]);
  await db.users.deleteOne({ _id: id });
  await deleteSession();
  redirect("/?deleted=1");
}
