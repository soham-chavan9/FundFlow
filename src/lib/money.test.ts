import { describe, expect, it } from "vitest";
import {
  MAX_CENTS,
  centsToInput,
  decimalSeparator,
  formatMoney,
  parseAmountToCents,
} from "./money";

describe("parseAmountToCents", () => {
  it.each([
    ["12", 1200],
    ["12.5", 1250],
    ["12.50", 1250],
    ["0.01", 1],
    ["1,234.56", 123456],
    ["1.234,56", 123456],
    ["12,50", 1250],
    ["12,5", 1250],
    ["1,234", 123400],
    ["1 234,56", 123456],
    [" 7 ", 700],
    [42, 4200],
    [0.1, 10],
  ])("parses %j as %i cents", (input, cents) => {
    expect(parseAmountToCents(input)).toBe(cents);
  });

  it.each(["", "abc", "-5", "1e3", "12.345", "1.234", "12,3456", "1,23,4", ".5", "12.", "NaN"])(
    "rejects %j",
    (input) => {
      expect(parseAmountToCents(input)).toBeNull();
    },
  );

  it("uses the locale's decimal separator to settle a lone three-digit group", () => {
    expect(parseAmountToCents("1.234", ",")).toBe(123400);
    expect(parseAmountToCents("1,234", ",")).toBeNull();
    expect(parseAmountToCents("1.234", ".")).toBeNull();
    expect(parseAmountToCents("12,50", ",")).toBe(1250);
    expect(parseAmountToCents("12.50", ",")).toBe(1250);
    expect(parseAmountToCents("1.234.567", ".")).toBe(123456700);
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

describe("decimalSeparator", () => {
  it("matches what each supported language types", () => {
    expect(decimalSeparator("en")).toBe(".");
    expect(decimalSeparator("zh")).toBe(".");
    expect(decimalSeparator("es")).toBe(",");
  });

  it("centsToInput can write a comma", () => {
    expect(centsToInput(123456, ",")).toBe("1234,56");
  });
});
