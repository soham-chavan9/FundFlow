import { describe, expect, it } from "vitest";
import { fieldErrors } from "./auth";
import { passwordChangeSchema, preferencesSchema, profileSchema } from "./account";

describe("profileSchema", () => {
  it("trims and bounds the name", () => {
    expect(profileSchema.parse({ name: "  Ada  " }).name).toBe("Ada");
    expect(profileSchema.safeParse({ name: " " }).success).toBe(false);
    expect(profileSchema.safeParse({ name: "x".repeat(81) }).success).toBe(false);
  });
});

describe("preferencesSchema", () => {
  it("accepts only supported currencies and languages", () => {
    expect(preferencesSchema.parse({ currency: "EUR", locale: "es" })).toEqual({
      currency: "EUR",
      locale: "es",
    });
    expect(preferencesSchema.safeParse({ currency: "BTC", locale: "es" }).success).toBe(false);
    expect(preferencesSchema.safeParse({ currency: "USD", locale: "fr" }).success).toBe(false);
  });
});

describe("passwordChangeSchema", () => {
  const ok = {
    currentPassword: "old-password",
    newPassword: "new-password-1",
    confirmPassword: "new-password-1",
  };

  it("accepts a valid change", () => {
    expect(passwordChangeSchema.safeParse(ok).success).toBe(true);
  });

  it("flags a mismatch, a short password and an unchanged one", () => {
    const mismatch = passwordChangeSchema.safeParse({ ...ok, confirmPassword: "nope" });
    expect(mismatch.success || fieldErrors(mismatch.error)).toEqual({
      confirmPassword: "validation.passwordMismatch",
    });
    const short = passwordChangeSchema.safeParse({
      ...ok,
      newPassword: "short",
      confirmPassword: "short",
    });
    expect(short.success || fieldErrors(short.error).newPassword).toBe(
      "validation.passwordTooShort",
    );
    const same = passwordChangeSchema.safeParse({
      currentPassword: "same-password",
      newPassword: "same-password",
      confirmPassword: "same-password",
    });
    expect(same.success || fieldErrors(same.error).newPassword).toBe(
      "validation.passwordUnchanged",
    );
  });
});
