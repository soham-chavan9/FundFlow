import { describe, expect, it } from "vitest";
import { fieldErrors, loginSchema, registerSchema, safeNextPath } from "./auth";

const valid = {
  name: "  Ada Lovelace ",
  email: " Ada@Example.COM ",
  password: "correct horse",
  confirmPassword: "correct horse",
};

describe("registerSchema", () => {
  it("normalises name and email", () => {
    const r = registerSchema.parse(valid);
    expect(r.name).toBe("Ada Lovelace");
    expect(r.email).toBe("ada@example.com");
  });

  it.each([
    [{ name: "" }, "name", "validation.nameRequired"],
    [{ email: "nope" }, "email", "validation.emailInvalid"],
    [{ password: "short", confirmPassword: "short" }, "password", "validation.passwordTooShort"],
    [
      { password: "x".repeat(73), confirmPassword: "x".repeat(73) },
      "password",
      "validation.passwordTooLong",
    ],
    [{ confirmPassword: "different" }, "confirmPassword", "validation.passwordMismatch"],
  ])("reports %j as %s: %s", (patch, field, key) => {
    const r = registerSchema.safeParse({ ...valid, ...patch });
    expect(r.success).toBe(false);
    expect(fieldErrors(r.error!)[field]).toBe(key);
  });
});

describe("loginSchema", () => {
  it("requires a password", () => {
    const r = loginSchema.safeParse({ email: "a@b.co", password: "" });
    expect(fieldErrors(r.error!)).toEqual({ password: "validation.passwordRequired" });
  });
});

describe("safeNextPath", () => {
  it.each([
    ["/expenses?month=2026-11", "/expenses?month=2026-11"],
    ["https://evil.example", "/dashboard"],
    ["//evil.example", "/dashboard"],
    ["/\\evil.example", "/dashboard"],
    [null, "/dashboard"],
    ["dashboard", "/dashboard"],
  ])("%j -> %s", (input, out) => {
    expect(safeNextPath(input)).toBe(out);
  });
});
