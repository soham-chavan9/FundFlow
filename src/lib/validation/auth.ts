import { z } from "zod";

/**
 * Error messages are i18n keys under `validation.*` so the UI can translate
 * them; the server never sends English strings to the client.
 */

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "validation.emailInvalid" }));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { error: "validation.passwordRequired" }),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { error: "validation.nameRequired" })
      .max(80, { error: "validation.nameTooLong" }),
    email,
    // bcrypt only uses the first 72 bytes, so cap it there.
    password: z
      .string()
      .min(8, { error: "validation.passwordTooShort" })
      .max(72, { error: "validation.passwordTooLong" }),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    error: "validation.passwordMismatch",
    path: ["confirmPassword"],
  });

/** First error key per field, for inline form messages. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    out[field] ??= issue.message;
  }
  return out;
}

/** Only allow same-site relative redirects after login. */
export function safeNextPath(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  if (value.startsWith("/\\")) return fallback;
  return value;
}
