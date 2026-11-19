import { describe, expect, it } from "vitest";
import { fieldErrors } from "./auth";
import { budgetSchema, expenseSchema, incomeSchema, shoppingItemSchema } from "./entries";

describe("expenseSchema", () => {
  it("parses a valid expense into cents and a UTC date", () => {
    const parsed = expenseSchema.parse({
      title: "  Groceries ",
      category: "food",
      amount: "1,234.5",
      date: "2026-11-19",
      notes: "",
    });
    expect(parsed).toEqual({
      title: "Groceries",
      category: "food",
      amount: 123_450,
      date: new Date(Date.UTC(2026, 10, 19)),
      notes: undefined,
    });
  });

  it("returns translatable keys for each bad field", () => {
    const result = expenseSchema.safeParse({
      title: "",
      category: "gadgets",
      amount: "0",
      date: "2026-02-30",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(fieldErrors(result.error)).toEqual({
      title: "validation.titleRequired",
      category: "validation.categoryRequired",
      amount: "validation.amountInvalid",
      date: "validation.dateInvalid",
    });
  });

  it("rejects missing fields (null from FormData) with the same keys", () => {
    const result = expenseSchema.safeParse({
      title: null,
      category: null,
      amount: null,
      date: null,
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(fieldErrors(result.error)).toMatchObject({
      title: "validation.titleRequired",
      amount: "validation.amountInvalid",
      date: "validation.dateInvalid",
    });
  });

  it("caps notes at 500 characters", () => {
    const result = expenseSchema.safeParse({
      title: "x",
      category: "other",
      amount: "1",
      date: "2026-11-01",
      notes: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("incomeSchema", () => {
  it("accepts a source and amount", () => {
    expect(
      incomeSchema.parse({ source: "Salary", amount: "3200", date: "2026-11-01" }).amount,
    ).toBe(320_000);
  });
});

describe("budgetSchema", () => {
  it("needs a real month key and a positive limit", () => {
    expect(
      budgetSchema.safeParse({ month: "2026-13", category: "food", limit: "10" }).success,
    ).toBe(false);
    expect(
      budgetSchema.safeParse({ month: "2026-11", category: "food", limit: "-5" }).success,
    ).toBe(false);
    expect(budgetSchema.parse({ month: "2026-11", category: "food", limit: "300" }).limit).toBe(
      30_000,
    );
  });
});

describe("shoppingItemSchema", () => {
  it("trims and requires a name", () => {
    expect(shoppingItemSchema.parse({ name: " Milk " }).name).toBe("Milk");
    expect(shoppingItemSchema.safeParse({ name: "   " }).success).toBe(false);
  });
});
