import { describe, expect, it } from "vitest";
import { MAX_CENTS, centsToInput, formatMoney, parseAmountToCents } from "./money";

describe("parseAmountToCents", () => {
  it.each([
    ["12", 1200],
    ["12.5", 1250],
    ["12.50", 1250],
    ["0.01", 1],
    ["1,234.56", 123456],
    [" 7 ", 700],
    [42, 4200],
    [0.1, 10],
  ])("parses %j as %i cents", (input, cents) => {
    expect(parseAmountToCents(input)).toBe(cents);
  });

  it.each(["", "abc", "-5", "1.234", "1e3", ".5", "12.", "NaN"])("rejects %j", (input) => {
    expect(parseAmountToCents(input)).toBeNull();
  });

  it("rejects amounts above the cap", () => {
    expect(parseAmountToCents(String(MAX_CENTS / 100 + 1))).toBeNull();
    expect(parseAmountToCents(String(MAX_CENTS / 100))).toBe(MAX_CENTS);
  });

  it("avoids float rounding errors", () => {
    expect(parseAmountToCents("19.99")).toBe(1999);
    expect(parseAmountToCents("0.29")).toBe(29);
  });
});

describe("centsToInput", () => {
  it.each([
    [0, "0.00"],
    [5, "0.05"],
    [1250, "12.50"],
    [-1250, "-12.50"],
  ])("formats %i as %s", (cents, out) => {
    expect(centsToInput(cents)).toBe(out);
  });
});

describe("formatMoney", () => {
  it("formats with currency and locale", () => {
    expect(formatMoney(123456, "USD", "en")).toBe("$1,234.56");
    expect(formatMoney(5000, "EUR", "es")).toMatch(/50,00\s€/);
  });

  it("supports compact notation", () => {
    expect(formatMoney(1_250_000, "USD", "en", { compact: true })).toBe("$12.5K");
  });
});
