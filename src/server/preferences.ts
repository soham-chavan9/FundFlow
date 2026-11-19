"use server";

import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { LOCALE_COOKIE, isLocale } from "@/i18n/locales";
import { getCurrentUser } from "@/lib/auth/dal";
import { collections } from "@/lib/db";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Sets the UI language cookie and, when signed in, remembers it on the account. */
export async function setLocaleAction(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });
  const user = await getCurrentUser();
  if (user) {
    const { users } = await collections();
    await users.updateOne({ _id: new ObjectId(user.id) }, { $set: { locale } });
  }
}
