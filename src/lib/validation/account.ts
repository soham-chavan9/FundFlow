import { z } from "zod";
import { LOCALES } from "@/i18n/locales";
import { CURRENCIES } from "@/lib/money";

/** Settings forms. Error messages are i18n keys, like the other schemas. */

export const profileSchema = z.object({
  name: z
    .string({ error: "validation.nameRequired" })
    .trim()
    .min(1, { error: "validation.nameRequired" })
    .max(80, { error: "validation.nameTooLong" }),
});

export const preferencesSchema = z.object({
  currency: z.enum(CURRENCIES, { error: "common.genericError" }),
  locale: z.enum(LOCALES, { error: "common.genericError" }),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string({ error: "validation.passwordRequired" })
      .min(1, { error: "validation.passwordRequired" }),
    newPassword: z
      .string({ error: "validation.passwordTooShort" })
      .min(8, { error: "validation.passwordTooShort" })
      .max(72, { error: "validation.passwordTooLong" }),
    confirmPassword: z.string({ error: "validation.passwordMismatch" }),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    error: "validation.passwordMismatch",
    path: ["confirmPassword"],
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    error: "validation.passwordUnchanged",
    path: ["newPassword"],
  });

export const deleteAccountSchema = z.object({
  password: z
    .string({ error: "validation.passwordRequired" })
    .min(1, { error: "validation.passwordRequired" }),
});
