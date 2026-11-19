import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "./csv";

describe("csvCell", () => {
  it("passes plain values through", () => {
    expect(csvCell("Groceries")).toBe("Groceries");
    expect(csvCell(12.5)).toBe("12.5");
    expect(csvCell(null)).toBe("");
  });

  it("quotes commas, quotes and newlines", () => {
    expect(csvCell("Rent, May")).toBe('"Rent, May"');
    expect(csvCell('The "good" one')).toBe('"The ""good"" one"');
    expect(csvCell("line\nbreak")).toBe('"line\nbreak"');
  });

  it("neutralises spreadsheet formulas but not negative numbers", () => {
    expect(csvCell("=SUM(A1:A2)")).toBe("'=SUM(A1:A2)");
    expect(csvCell("+1 555")).toBe("'+1 555");
    expect(csvCell("@cmd")).toBe("'@cmd");
    expect(csvCell("-12.50")).toBe("-12.50");
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
  });
});

describe("toCsv", () => {
  it("joins rows with CRLF and ends with a newline", () => {
    expect(
      toCsv([
        ["Date", "Title"],
        ["2026-11-01", "Coffee"],
      ]),
    ).toBe("Date,Title\r\n2026-11-01,Coffee\r\n");
  });
});
