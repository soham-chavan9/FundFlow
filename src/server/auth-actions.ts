"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, deleteSession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { fieldErrors, loginSchema, registerSchema, safeNextPath } from "@/lib/validation/auth";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "@/i18n/locales";
import { EmailTakenError, createUser, findUserByEmail } from "./users";

export type AuthFormState =
  | {
      fieldErrors?: Record<string, string>;
      /** i18n key for a form-level error */
      formError?: string;
      values?: { name?: string; email?: string };
    }
  | undefined;

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const values = { email: String(formData.get("email") ?? "") };
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const user = await findUserByEmail(parsed.data.email);
  const ok = await verifyPassword(parsed.data.password, user?.passwordHash ?? null);
  if (!user || !ok) return { formError: "auth.invalidCredentials", values };

  await createSession(user._id.toHexString(), user.sessionVersion ?? 0);
  // Restore the language this account last chose.
  if (isLocale(user.locale)) {
    (await cookies()).set(LOCALE_COOKIE, user.locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  redirect(safeNextPath(formData.get("next")));
}

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
  };
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  let userId: string;
  try {
    userId = await createUser({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      locale: isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE,
    });
  } catch (err) {
    if (err instanceof EmailTakenError) {
      return { fieldErrors: { email: "auth.emailTaken" }, values };
    }
    throw err;
  }

  await createSession(userId);
  redirect("/dashboard");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
